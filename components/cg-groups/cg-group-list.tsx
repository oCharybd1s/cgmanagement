"use client";

import * as React from "react";
import { Network, Plus } from "lucide-react";
import type { CgGroup } from "@/lib/cg-groups/types";
import { CreateCgGroupDialog } from "@/components/cg-groups/create-cg-group-dialog";

export function CgGroupList({
  initialCgGroups,
  canCreate,
}: {
  initialCgGroups: CgGroup[];
  canCreate: boolean;
}) {
  const [cgGroups, setCgGroups] = React.useState(initialCgGroups);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [dialogKey, setDialogKey] = React.useState(0);

  function openDialog() {
    setDialogKey((previous) => previous + 1);
    setIsDialogOpen(true);
  }

  function handleCreated(cgGroup: CgGroup) {
    setCgGroups((previous) => [...previous, cgGroup].sort((a, b) => a.groupCode.localeCompare(b.groupCode, "id")));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-bold tracking-tight text-foreground">CG Groups</h2>
        {canCreate ? (
          <button
            type="button"
            onClick={openDialog}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors duration-200 hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            Buat CG
          </button>
        ) : null}
      </div>

      {cgGroups.length === 0 ? (
        <EmptyCgGroupState canCreate={canCreate} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cgGroups.map((group) => (
            <div
              key={group.id}
              className="rounded-2xl border border-border bg-card/70 p-4 shadow-sm backdrop-blur-xl"
            >
              <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                {group.groupCode}
              </span>
              <p className="mt-2 font-medium text-foreground">{group.groupName}</p>
            </div>
          ))}
        </div>
      )}

      {canCreate ? (
        <CreateCgGroupDialog
          key={dialogKey}
          open={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onCreated={handleCreated}
        />
      ) : null}
    </div>
  );
}

function EmptyCgGroupState({ canCreate }: { canCreate: boolean }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card/70 px-6 py-12 text-center shadow-sm backdrop-blur-xl">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Network className="h-5 w-5" strokeWidth={2} />
      </span>
      <h3 className="font-display text-base font-bold tracking-tight text-foreground">Belum ada CG</h3>
      <p className="max-w-sm text-sm text-muted-foreground">
        {canCreate
          ? "Buat CG pertama untuk mulai mengelola struktur komsel."
          : "CG akan muncul di sini setelah Coach membuatnya."}
      </p>
    </div>
  );
}
