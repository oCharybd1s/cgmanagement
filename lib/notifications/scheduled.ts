import type { Firestore } from "firebase-admin/firestore";
import { addDays, toDateKey, type CalendarDate } from "@/lib/calendar/date-utils";
import { computeBirthdaysInRange } from "@/lib/calendar/birthdays";
import { getJakartaCalendarDate } from "@/lib/notifications/jakarta-date";
import { listAllMembersForOrg } from "@/lib/members/data";
import { getEventsForOrgOnDate } from "@/lib/events/data";
import { canViewEvent, type EventViewerContext } from "@/lib/events/access";
import { pickSelfBirthdayMessage } from "@/lib/notifications/birthday-messages";
import { isCoach, isCgl } from "@/lib/auth/roles";
import { sendNotificationToUsers } from "@/lib/notifications/send";
import { pruneExpiredNotificationsForOrg } from "@/lib/notifications/inbox";
import { pruneStaleFcmTokensForUser, STALE_FCM_TOKEN_MAX_AGE_MS } from "@/lib/notifications/token-store";
import type { Member } from "@/lib/members/types";

export type DailyNotificationSummary = {
  orgId: string;
  birthdayTodayNotified: number;
  birthdayReminderNotified: number;
  eventTodayNotified: number;
  eventReminderNotified: number;
  expiredNotificationsPruned: number;
  staleFcmTokensPruned: number;
};

const EVENT_REMINDER_DAYS_AHEAD = [7, 3];

export async function runDailyNotificationJob(adminDb: Firestore, orgId: string): Promise<DailyNotificationSummary> {
  const today = getJakartaCalendarDate();
  const reminderDate = addDays(today, 7);

  const members = await listAllMembersForOrg(orgId);

  const [
    birthdayTodayNotified,
    birthdayReminderNotified,
    eventTodayNotified,
    eventReminderNotified,
    expiredNotificationsPruned,
    staleFcmTokensPruned,
  ] = await Promise.all([
    notifyBirthdaysToday(adminDb, orgId, members, today),
    notifyBirthdayReminders(adminDb, orgId, members, reminderDate),
    notifyEventsOnDate(adminDb, orgId, members, today, 0),
    notifyEventReminders(adminDb, orgId, members, today),
    pruneExpiredNotificationsForOrg(adminDb, orgId),
    pruneStaleFcmTokensForOrg(adminDb, orgId, members),
  ]);

  return {
    orgId,
    birthdayTodayNotified,
    birthdayReminderNotified,
    eventTodayNotified,
    eventReminderNotified,
    expiredNotificationsPruned,
    staleFcmTokensPruned,
  };
}

async function pruneStaleFcmTokensForOrg(adminDb: Firestore, orgId: string, members: Member[]): Promise<number> {
  const results = await Promise.all(
    members.map((member) => pruneStaleFcmTokensForUser(adminDb, orgId, member.id, STALE_FCM_TOKEN_MAX_AGE_MS)),
  );
  return results.reduce((total, count) => total + count, 0);
}

async function notifyBirthdaysToday(
  adminDb: Firestore,
  orgId: string,
  members: Member[],
  today: CalendarDate,
): Promise<number> {
  const birthdays = computeBirthdaysInRange(members, { start: today, end: today });
  const coachIds = members.filter((member) => isCoach(member.role)).map((member) => member.id);
  let notifiedCount = 0;

  for (const birthday of birthdays) {
    const selfResult = await sendNotificationToUsers(adminDb, orgId, [birthday.memberId], {
      title: "Selamat Ulang Tahun!",
      body: pickSelfBirthdayMessage(birthday.fullName),
      url: "/anggota",
      category: "birthday",
    });
    notifiedCount += selfResult.successCount;

    const birthdayMember = members.find((member) => member.id === birthday.memberId);
    const birthdayIsCoach = birthdayMember ? isCoach(birthdayMember.role) : false;

    const communityIds = new Set<string>();

    if (birthdayIsCoach) {
      members
        .filter((member) => member.id !== birthday.memberId)
        .forEach((member) => communityIds.add(member.id));
    } else {
      if (birthday.cgGroupId) {
        members
          .filter((member) => member.cgGroupId === birthday.cgGroupId && member.id !== birthday.memberId)
          .forEach((member) => communityIds.add(member.id));
      }

      coachIds
        .filter((coachId) => coachId !== birthday.memberId)
        .forEach((coachId) => communityIds.add(coachId));
    }

    if (communityIds.size === 0) {
      continue;
    }

    const result = await sendNotificationToUsers(adminDb, orgId, Array.from(communityIds), {
      title: "Ulang Tahun Hari Ini",
      body: `${birthday.fullName} berulang tahun hari ini. Yuk kirim ucapan`,
      url: "/anggota",
      category: "birthday",
    });
    notifiedCount += result.successCount;
  }

  return notifiedCount;
}

async function notifyBirthdayReminders(
  adminDb: Firestore,
  orgId: string,
  members: Member[],
  reminderDate: CalendarDate,
): Promise<number> {
  const birthdays = computeBirthdaysInRange(members, { start: reminderDate, end: reminderDate });
  let notifiedCount = 0;

  for (const birthday of birthdays) {
    const birthdayMember = members.find((member) => member.id === birthday.memberId);
    const birthdayIsCoach = birthdayMember ? isCoach(birthdayMember.role) : false;

    const recipientIds = members
      .filter((member) => member.id !== birthday.memberId)
      .filter(
        (member) =>
          isCoach(member.role) ||
          (isCgl(member.role) && (birthdayIsCoach || member.cgGroupId === birthday.cgGroupId)),
      )
      .map((member) => member.id);

    if (recipientIds.length === 0) {
      continue;
    }

    const result = await sendNotificationToUsers(adminDb, orgId, recipientIds, {
      title: "Reminder Ulang Tahun",
      body: birthdayIsCoach
        ? `${birthday.fullName} (Coach) akan ulang tahun dalam 7 hari`
        : `${birthday.fullName} akan ulang tahun dalam 7 hari. Siapkan persiapan CG`,
      url: "/anggota",
      category: "birthday",
    });
    notifiedCount += result.successCount;
  }

  return notifiedCount;
}

async function notifyEventReminders(
  adminDb: Firestore,
  orgId: string,
  members: Member[],
  today: CalendarDate,
): Promise<number> {
  const results = await Promise.all(
    EVENT_REMINDER_DAYS_AHEAD.map((daysAhead) =>
      notifyEventsOnDate(adminDb, orgId, members, addDays(today, daysAhead), daysAhead),
    ),
  );
  return results.reduce((total, count) => total + count, 0);
}

async function notifyEventsOnDate(
  adminDb: Firestore,
  orgId: string,
  members: Member[],
  eventDate: CalendarDate,
  daysAhead: number,
): Promise<number> {
  const events = await getEventsForOrgOnDate(orgId, toDateKey(eventDate));
  let notifiedCount = 0;

  for (const event of events) {
    const recipientIds = members
      .filter((member) => {
        const viewer: EventViewerContext = {
          uid: member.id,
          role: member.role,
          cgGroupId: member.cgGroupId,
          hasMinistry: Boolean(member.pelayanan),
        };
        return canViewEvent(viewer, event);
      })
      .map((member) => member.id);

    if (recipientIds.length === 0) {
      continue;
    }

    const result = await sendNotificationToUsers(adminDb, orgId, recipientIds, {
      ...buildEventNotificationText(event.name, event.time, daysAhead),
      url: "/kalender",
      category: "event",
    });
    notifiedCount += result.successCount;
  }

  return notifiedCount;
}

function buildEventNotificationText(
  eventName: string,
  eventTime: string | null,
  daysAhead: number,
): { title: string; body: string } {
  const timeSuffix = eventTime ? ` pukul ${eventTime}` : "";

  if (daysAhead === 0) {
    return {
      title: "Event Hari Ini",
      body: `${eventName} berlangsung hari ini${timeSuffix}`,
    };
  }

  return {
    title: `Reminder Event H-${daysAhead}`,
    body: `${eventName} akan berlangsung dalam ${daysAhead} hari${timeSuffix}`,
  };
}
