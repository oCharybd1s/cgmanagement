"use client";

import * as React from "react";
import { Network } from "lucide-react";
import {
  CgTreeView,
  type BendaharaResult,
  type DemoteResult,
  type PromoteResult,
} from "@/components/organizations/cg-tree-view";
import { CoachTreeOverview } from "@/components/organizations/coach-tree-overview";
import type { OrganizationTree as OrganizationTreeData, OrganizationTreeMember } from "@/lib/organizations/tree";

export function OrganizationTree({
  tree,
  viewerRole,
  viewerCgGroupId,
}: {
  tree: OrganizationTreeData;
  viewerRole: string | null;
  viewerCgGroupId: string | null;
}) {
  const isCoachView = viewerRole === "coach";
  const [treeData, setTreeData] = React.useState(tree);
  const [selectedCgId, setSelectedCgId] = React.useState<string | null>(
    isCoachView ? null : (viewerCgGroupId ?? null),
  );

  const selectedGroup = treeData.cgGroups.find((group) => group.id === selectedCgId) ?? null;

  function handlePromoted(result: PromoteResult) {
    setTreeData((previous) => applyPromotion(previous, result));
  }

  function handleDemoted(result: DemoteResult) {
    setTreeData((previous) => applyDemotion(previous, result));
  }

  function handleBendaharaChanged(result: BendaharaResult) {
    setTreeData((previous) => applyBendaharaChange(previous, result));
  }

  return (
    <div className="flex flex-col gap-5">
      <h2 className="font-display text-lg font-bold tracking-tight text-foreground">Visual Tree Struktur</h2>

      {isCoachView ? (
        treeData.cgGroups.length === 0 ? (
          <EmptyTreeState />
        ) : (
          <CoachTreeOverview
            coach={treeData.coach}
            cgGroups={treeData.cgGroups}
            selectedCgId={selectedCgId}
            onSelectCg={(cgGroupId) =>
              setSelectedCgId((current) => (current === cgGroupId ? null : cgGroupId))
            }
          />
        )
      ) : null}

      {isCoachView && !selectedGroup ? (
        <p className="rounded-2xl border border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground">
          Pilih salah satu CG di atas untuk melihat struktur & mengelola CGL.
        </p>
      ) : null}

      {!isCoachView && !selectedGroup ? (
        <p className="rounded-2xl border border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground">
          Struktur CG Anda belum tersedia.
        </p>
      ) : null}

      {selectedGroup ? (
        <CgTreeView
          coach={isCoachView ? [] : treeData.coach}
          group={selectedGroup}
          viewerRole={viewerRole}
          viewerCgGroupId={viewerCgGroupId}
          onPromoted={handlePromoted}
          onDemoted={handleDemoted}
          onBendaharaChanged={handleBendaharaChanged}
        />
      ) : null}
    </div>
  );
}

function tierKey(role: string): "sponsors" | "members" | "simpatisans" | null {
  if (role === "sponsor") return "sponsors";
  if (role === "member") return "members";
  if (role === "simpatisan") return "simpatisans";
  return null;
}

function sortByName(members: OrganizationTreeMember[]): OrganizationTreeMember[] {
  return [...members].sort((a, b) => a.fullName.localeCompare(b.fullName, "id"));
}

function applyPromotion(tree: OrganizationTreeData, result: PromoteResult): OrganizationTreeData {
  return {
    coach: tree.coach,
    cgGroups: tree.cgGroups.map((group) => {
      if (group.id !== result.cgGroupId) {
        return group;
      }

      if (result.newRole === "cgl") {
        const promoted = group.sponsors.find((sponsor) => sponsor.id === result.memberId);
        if (!promoted) {
          return group;
        }

        const remainingSponsors = group.sponsors.filter((sponsor) => sponsor.id !== result.memberId);
        const nextSponsors =
          result.swappedCglUserId && group.cgl
            ? [...remainingSponsors, { ...group.cgl, role: "sponsor", isBendahara: false }]
            : remainingSponsors;

        return {
          ...group,
          cgl: { ...promoted, role: "cgl", isBendahara: false },
          sponsors: sortByName(nextSponsors),
        };
      }

      const fromKey = tierKey(result.oldRole);
      const toKey = tierKey(result.newRole);
      if (!fromKey || !toKey) {
        return group;
      }

      const promoted = group[fromKey].find((member) => member.id === result.memberId);
      if (!promoted) {
        return group;
      }

      const updatedMember: OrganizationTreeMember = {
        ...promoted,
        role: result.newRole,
        hasAccount: result.temporaryPassword ? true : promoted.hasAccount,
      };

      return {
        ...group,
        [fromKey]: group[fromKey].filter((member) => member.id !== result.memberId),
        [toKey]: sortByName([...group[toKey], updatedMember]),
      };
    }),
  };
}

function applyDemotion(tree: OrganizationTreeData, result: DemoteResult): OrganizationTreeData {
  return {
    coach: tree.coach,
    cgGroups: tree.cgGroups.map((group) => {
      if (group.id !== result.cgGroupId) {
        return group;
      }

      if (result.oldRole === "cgl") {
        if (!group.cgl || group.cgl.id !== result.memberId) {
          return group;
        }

        return {
          ...group,
          cgl: null,
          sponsors: sortByName([...group.sponsors, { ...group.cgl, role: "sponsor", isBendahara: false }]),
        };
      }

      const fromKey = tierKey(result.oldRole);
      const toKey = tierKey(result.newRole);
      if (!fromKey || !toKey) {
        return group;
      }

      const demoted = group[fromKey].find((member) => member.id === result.memberId);
      if (!demoted) {
        return group;
      }

      const updatedMember: OrganizationTreeMember = { ...demoted, role: result.newRole };

      return {
        ...group,
        [fromKey]: group[fromKey].filter((member) => member.id !== result.memberId),
        [toKey]: sortByName([...group[toKey], updatedMember]),
      };
    }),
  };
}

function applyBendaharaChange(tree: OrganizationTreeData, result: BendaharaResult): OrganizationTreeData {
  return {
    coach: tree.coach,
    cgGroups: tree.cgGroups.map((group) => {
      if (group.id !== result.cgGroupId) {
        return group;
      }

      if (group.cgl && group.cgl.id === result.memberId) {
        return { ...group, cgl: { ...group.cgl, isBendahara: result.isBendahara } };
      }

      return {
        ...group,
        sponsors: group.sponsors.map((sponsor) =>
          sponsor.id === result.memberId ? { ...sponsor, isBendahara: result.isBendahara } : sponsor,
        ),
      };
    }),
  };
}

function EmptyTreeState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card/70 px-6 py-12 text-center shadow-sm backdrop-blur-xl">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Network className="h-5 w-5" strokeWidth={2} />
      </span>
      <h3 className="font-display text-base font-bold tracking-tight text-foreground">Belum ada CG</h3>
      <p className="max-w-sm text-sm text-muted-foreground">
        Buat CG terlebih dahulu untuk mulai mengatur struktur organisasi.
      </p>
    </div>
  );
}
