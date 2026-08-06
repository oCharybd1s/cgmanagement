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
import { pruneStaleFcmTokensForUser } from "@/lib/notifications/token-store";
import type { Member } from "@/lib/members/types";

const STALE_FCM_TOKEN_MAX_AGE_MS = 60 * 24 * 60 * 60 * 1000;

export type DailyNotificationSummary = {
  orgId: string;
  birthdayTodayNotified: number;
  birthdayReminderNotified: number;
  eventTodayNotified: number;
  expiredNotificationsPruned: number;
  staleFcmTokensPruned: number;
};

export async function runDailyNotificationJob(adminDb: Firestore, orgId: string): Promise<DailyNotificationSummary> {
  const today = getJakartaCalendarDate();
  const reminderDate = addDays(today, 7);

  const members = await listAllMembersForOrg(orgId);

  const [
    birthdayTodayNotified,
    birthdayReminderNotified,
    eventTodayNotified,
    expiredNotificationsPruned,
    staleFcmTokensPruned,
  ] = await Promise.all([
    notifyBirthdaysToday(adminDb, orgId, members, today),
    notifyBirthdayReminders(adminDb, orgId, members, reminderDate),
    notifyEventsToday(adminDb, orgId, members, today),
    pruneExpiredNotificationsForOrg(adminDb, orgId),
    pruneStaleFcmTokensForOrg(adminDb, orgId, members),
  ]);

  return {
    orgId,
    birthdayTodayNotified,
    birthdayReminderNotified,
    eventTodayNotified,
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
  let notifiedCount = 0;

  for (const birthday of birthdays) {
    const selfResult = await sendNotificationToUsers(adminDb, orgId, [birthday.memberId], {
      title: "Selamat Ulang Tahun!",
      body: pickSelfBirthdayMessage(birthday.fullName),
      url: "/anggota",
      category: "birthday",
    });
    notifiedCount += selfResult.successCount;

    if (!birthday.cgGroupId) {
      continue;
    }

    const cgMateIds = members
      .filter((member) => member.cgGroupId === birthday.cgGroupId && member.id !== birthday.memberId)
      .map((member) => member.id);

    if (cgMateIds.length === 0) {
      continue;
    }

    const result = await sendNotificationToUsers(adminDb, orgId, cgMateIds, {
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
    const recipientIds = members
      .filter((member) => isCoach(member.role) || (isCgl(member.role) && member.cgGroupId === birthday.cgGroupId))
      .map((member) => member.id);

    if (recipientIds.length === 0) {
      continue;
    }

    const result = await sendNotificationToUsers(adminDb, orgId, recipientIds, {
      title: "Reminder Ulang Tahun",
      body: `${birthday.fullName} akan ulang tahun dalam 7 hari. Siapkan persiapan CG`,
      url: "/anggota",
      category: "birthday",
    });
    notifiedCount += result.successCount;
  }

  return notifiedCount;
}

async function notifyEventsToday(
  adminDb: Firestore,
  orgId: string,
  members: Member[],
  today: CalendarDate,
): Promise<number> {
  const events = await getEventsForOrgOnDate(orgId, toDateKey(today));
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

    const timeSuffix = event.time ? ` pukul ${event.time}` : "";
    const result = await sendNotificationToUsers(adminDb, orgId, recipientIds, {
      title: "Event Hari Ini",
      body: `${event.name} berlangsung hari ini${timeSuffix}`,
      url: "/kalender",
      category: "event",
    });
    notifiedCount += result.successCount;
  }

  return notifiedCount;
}
