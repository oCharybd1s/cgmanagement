"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Cake, CalendarPlus, Pencil, Trash2, X } from "lucide-react";
import { useMounted } from "@/hooks/use-mounted";
import { fromDateKey, formatFullLabel } from "@/lib/calendar/date-utils";
import { canCreateAnyEvent, canDeleteEvent, canUpdateEvent } from "@/lib/events/access";
import { EventTypeBadge } from "@/components/calendar/event-type-badge";
import type { CalendarDayItems } from "@/lib/calendar/group";
import type { EventRecord } from "@/lib/events/types";

export function DayDetailSheet({
  dateKey,
  items,
  viewerUid,
  viewerRole,
  viewerCgGroupId,
  onClose,
  onAddEvent,
  onEditEvent,
  onDeleteEvent,
}: {
  dateKey: string;
  items: CalendarDayItems;
  viewerUid: string;
  viewerRole: string | null;
  viewerCgGroupId: string | null;
  onClose: () => void;
  onAddEvent: () => void;
  onEditEvent: (event: EventRecord) => void;
  onDeleteEvent: (event: EventRecord) => void;
}) {
  const mounted = useMounted();

  React.useEffect(() => {
    function handleKeyDown(keyEvent: KeyboardEvent) {
      if (keyEvent.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const actor = { uid: viewerUid, role: viewerRole, cgGroupId: viewerCgGroupId };
  const sortedEvents = [...items.events].sort((a, b) => (a.time ?? "99:99").localeCompare(b.time ?? "99:99"));
  const hasContent = sortedEvents.length > 0 || items.birthdays.length > 0;

  if (!mounted) {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="day-detail-sheet-title"
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.97 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          onClick={(clickEvent) => clickEvent.stopPropagation()}
          className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 id="day-detail-sheet-title" className="font-display text-lg font-bold tracking-tight text-foreground">
              {formatFullLabel(fromDateKey(dateKey))}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup"
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>

          <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
            {items.birthdays.length > 0 ? (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ulang Tahun</p>
                {items.birthdays.map((birthday) => (
                  <div
                    key={birthday.memberId}
                    className="flex items-center gap-3 rounded-2xl border border-brand-spark/40 bg-brand-spark/15 px-4 py-3"
                  >
                    <Cake className="h-4 w-4 shrink-0 text-brand-spark-foreground" strokeWidth={2} />
                    <p className="text-sm text-foreground">
                      <span className="font-semibold">{birthday.fullName || "Tanpa nama"}</span>
                      {birthday.age !== null ? ` genap ${birthday.age} tahun` : ""}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}

            {sortedEvents.length > 0 ? (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Event</p>
                {sortedEvents.map((event) => {
                  const canEdit = canUpdateEvent(actor, event);
                  const canDelete = canDeleteEvent(actor, event);

                  return (
                    <div key={event.id} className="flex flex-col gap-2 rounded-2xl border border-border bg-input/30 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            {event.time ? (
                              <span className="font-mono text-xs font-semibold text-foreground">{event.time}</span>
                            ) : null}
                            <EventTypeBadge type={event.type} />
                          </div>
                          <p className="text-sm font-semibold text-foreground">{event.name}</p>
                          {event.description ? (
                            <p className="text-sm text-muted-foreground">{event.description}</p>
                          ) : null}
                        </div>

                        {canEdit || canDelete ? (
                          <div className="flex shrink-0 items-center gap-1">
                            {canEdit ? (
                              <button
                                type="button"
                                onClick={() => onEditEvent(event)}
                                aria-label="Ubah event"
                                className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
                              >
                                <Pencil className="h-4 w-4" strokeWidth={2} />
                              </button>
                            ) : null}
                            {canDelete ? (
                              <button
                                type="button"
                                onClick={() => onDeleteEvent(event)}
                                aria-label="Hapus event"
                                className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-destructive/10 hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" strokeWidth={2} />
                              </button>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}

            {!hasContent ? (
              <p className="rounded-2xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                Belum ada event atau ulang tahun di tanggal ini.
              </p>
            ) : null}
          </div>

          {canCreateAnyEvent(viewerRole) ? (
            <div className="border-t border-border px-6 py-4">
              <button
                type="button"
                onClick={onAddEvent}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0"
              >
                <CalendarPlus className="h-4 w-4" strokeWidth={2} />
                Tambah Event di Tanggal Ini
              </button>
            </div>
          ) : null}
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}
