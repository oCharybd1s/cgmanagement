"use client";

import * as React from "react";
import { Network, Plus, Trash2 } from "lucide-react";
import type { CgGroup } from "@/lib/cg-groups/types";
import { CreateCgGroupDialog } from "@/components/cg-groups/create-cg-group-dialog";
import { DeleteCgGroupDialog } from "@/components/cg-groups/delete-cg-group-dialog";

export function CgGroupList({
  initialCgGroups,
  canCreate,
  canDelete,
}: {
  initialCgGroups: CgGroup[];
  canCreate: boolean;
  canDelete: boolean;
}) {
  const [cgGroups, setCgGroups] = React.useState(initialCgGroups);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [dialogKey, setDialogKey] = React.useState(0);
  const [deletingGroup, setDeletingGroup] = React.useState<CgGroup | null>(null);

  function openDialog() {
    setDialogKey((previous) => previous + 1);
    setIsDialogOpen(true);
  }

  function handleCreated(cgGroup: CgGroup) {
    setCgGroups((previous) => [...previous, cgGroup].sort((a, b) => a.groupCode.localeCompare(b.groupCode, "id")));
  }

  function handleDeleted(cgGroupId: string) {
    setCgGroups((previous) => previous.filter((group) => group.id !== cgGroupId));
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
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {cgGroups.map((group) => (
            <div
              key={group.id}
              className="group relative flex items-center justify-center rounded-2xl border border-border bg-card/70 px-4 py-5 text-center shadow-sm backdrop-blur-xl"
            >
              <span className="font-display text-base font-bold tracking-tight text-foreground">
                {group.groupCode}
              </span>
              {canDelete ? (
                <button
                  type="button"
                  onClick={() => setDeletingGroup(group)}
                  aria-label={`Hapus ${group.groupCode}`}
                  className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground opacity-100 transition-opacity duration-200 hover:bg-destructive/10 hover:text-destructive sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {canCreate ? (
        <CreateCgGroupDialog key={dialogKey} open={isDialogOpen} onClose={() => setIsDialogOpen(false)} onCreated={handleCreated} />
      ) : null}

      {canDelete && deletingGroup ? (
        <DeleteCgGroupDialog
          open={true}
          onClose={() => setDeletingGroup(null)}
          cgGroup={deletingGroup}
          availableTargets={cgGroups.filter((group) => group.id !== deletingGroup.id)}
          onDeleted={handleDeleted}
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
        {canCreate ? "Buat CG pertama untuk mulai mengelola struktur komsel." : "CG akan muncul di sini setelah Coach membuatnya."}
      </p>
    </div>
  );
}
