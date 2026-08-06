"use client";

import * as React from "react";
import {
  Users,
  Cake,
  Wallet,
  UserPlus,
  BadgeCheck,
  Waves,
  Flame,
  BookOpenCheck,
  IdCard,
  ChevronDown,
  ChartPie,
  UserMinus,
  PartyPopper,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrencyIDR } from "@/lib/transactions/shared";
import type { ComsulReport, MilestoneProgress, VipReportItem } from "@/lib/reports/types";

const MILESTONE_ICONS: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  msj1: Flame,
  msj2: Flame,
  msj3: Flame,
  cgt1: BookOpenCheck,
  cgt2: BookOpenCheck,
  cgt3: BookOpenCheck,
  baptisSelam: Waves,
  baptisRohKudus: BadgeCheck,
};

const VIP_STATUS_LABELS: Record<VipReportItem["status"], string> = {
  pending: "Pending",
  berpotensi: "Berpotensi",
  accept: "Accept",
  reject: "Reject",
};

const VIP_STATUS_TONES: Record<VipReportItem["status"], string> = {
  pending: "bg-warning/15 text-warning-foreground border-warning/30",
  berpotensi: "bg-primary/15 text-primary border-primary/25",
  accept: "bg-success/15 text-success-foreground border-success/30",
  reject: "bg-destructive/15 text-destructive-foreground border-destructive/30",
};

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export function ReportDashboard({ report }: { report: ComsulReport | null }) {
  if (!report) {
    return (
      <div className="rounded-2xl border border-border bg-card/70 px-6 py-16 text-center shadow-sm backdrop-blur-xl">
        <p className="text-sm text-muted-foreground">
          Data organisasi belum tersedia untuk membentuk laporan.
        </p>
      </div>
    );
  }

  const generatedLabel = new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(report.generatedAt));

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
          Laporan Statistik Komsel
        </h1>
        <p className="text-sm text-muted-foreground">
          Dihitung real-time dari data terkini per {generatedLabel}. Halaman ini hanya bisa dilihat
          Coach dan Admin.
        </p>
      </div>

      <OverviewSection report={report} />
      <CgSection report={report} />
      <MilestoneSection milestones={report.milestones} />
      <VipSection report={report} />
      <KeuanganSection report={report} />
      <RetentionSection report={report} />
      <BirthdaySection report={report} />
      <RoleDistributionSection report={report} />
    </div>
  );
}

function OverviewSection({ report }: { report: ComsulReport }) {
  const { overview } = report;

  const cards = [
    {
      label: "Total Anggota",
      value: overview.totalPeople.toString(),
      icon: Users,
      hint: `${overview.totalCg} CG aktif`,
    },
    {
      label: "Rata-rata Umur",
      value: overview.averageAge !== null ? `${overview.averageAge} th` : "-",
      icon: Cake,
      hint: "Seluruh organisasi",
    },
    {
      label: "Total Saldo Kas",
      value: formatCurrencyIDR(overview.totalBalance),
      icon: Wallet,
      hint: "Coach + seluruh CG",
    },
    {
      label: "NIJ Belum Terisi",
      value: overview.nijMissingCount.toString(),
      icon: IdCard,
      hint: `dari ${overview.totalPeople} anggota`,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="flex flex-col gap-3 rounded-2xl border border-border bg-card/70 p-5 shadow-sm backdrop-blur-xl"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">{card.label}</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
              <card.icon className="h-4 w-4" strokeWidth={2} />
            </span>
          </div>
          <p className="font-display text-2xl font-bold tracking-tight text-foreground">{card.value}</p>
          <p className="text-xs text-muted-foreground">{card.hint}</p>
        </div>
      ))}
    </div>
  );
}

function CgSection({ report }: { report: ComsulReport }) {
  const maxPeople = Math.max(1, ...report.cgStats.map((cg) => cg.totalPeople));

  return (
    <section className="flex flex-col gap-4">
      <SectionHeader
        icon={Users}
        title="Jumlah & Usia per CG"
        description="Distribusi jumlah orang dan rata-rata umur di tiap CG"
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card/70 p-5 shadow-sm backdrop-blur-xl">
          <p className="mb-4 text-sm font-medium text-foreground">Jumlah Orang per CG</p>
          <div className="flex flex-col gap-3">
            {report.cgStats.map((cg, index) => (
              <div key={cg.cgId} className="flex items-center gap-3">
                <span className="w-16 shrink-0 text-xs font-medium text-muted-foreground">{cg.cgLabel}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(cg.totalPeople / maxPeople) * 100}%`,
                      backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                    }}
                  />
                </div>
                <span className="w-6 shrink-0 text-right text-xs font-semibold text-foreground">
                  {cg.totalPeople}
                </span>
              </div>
            ))}
            {report.cgStats.length === 0 && (
              <p className="text-sm text-muted-foreground">Belum ada data CG.</p>
            )}
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-border bg-card/70 shadow-sm backdrop-blur-xl">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-medium">CG</th>
                <th className="px-4 py-3 font-medium">CGL</th>
                <th className="px-4 py-3 font-medium">Orang</th>
                <th className="px-4 py-3 font-medium">Rata Umur</th>
                <th className="px-4 py-3 font-medium">Termuda/Tertua</th>
                <th className="px-4 py-3 font-medium">Laporan 90h</th>
              </tr>
            </thead>
            <tbody>
              {report.cgStats.map((cg) => (
                <tr key={cg.cgId} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-3 font-medium text-foreground">{cg.cgLabel}</td>
                  <td className="px-4 py-3 text-muted-foreground">{cg.cglName ?? "-"}</td>
                  <td className="px-4 py-3 text-foreground">{cg.totalPeople}</td>
                  <td className="px-4 py-3 text-foreground">
                    {cg.averageAge !== null ? `${cg.averageAge} th` : "-"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {cg.youngestAge !== null && cg.oldestAge !== null
                      ? `${cg.youngestAge} / ${cg.oldestAge}`
                      : "-"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{cg.meetingCount90d}</td>
                </tr>
              ))}
              {report.cgStats.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                    Belum ada data CG.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function MilestoneSection({ milestones }: { milestones: MilestoneProgress[] }) {
  const msjMilestones = milestones.filter((milestone) => milestone.group === "msj");
  const cgtMilestones = milestones.filter((milestone) => milestone.group === "cgt");
  const baptisMilestones = milestones.filter((milestone) => milestone.group === "baptis");

  return (
    <section className="flex flex-col gap-6">
      <SectionHeader
        icon={BadgeCheck}
        title="Perjalanan Rohani"
        description="Progres MSJ 1-3, CGT 1-3, dan Baptisan, lengkap dengan daftar yang belum"
      />

      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Jenjang MSJ
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {msjMilestones.map((milestone) => (
            <MilestoneCard key={milestone.key} milestone={milestone} />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Jenjang CGT
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cgtMilestones.map((milestone) => (
            <MilestoneCard key={milestone.key} milestone={milestone} />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Baptisan</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {baptisMilestones.map((milestone) => (
            <MilestoneCard key={milestone.key} milestone={milestone} />
          ))}
        </div>
      </div>
    </section>
  );
}

function MilestoneCard({ milestone }: { milestone: MilestoneProgress }) {
  const [expanded, setExpanded] = React.useState(false);
  const Icon = MILESTONE_ICONS[milestone.key] ?? BadgeCheck;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card/70 p-5 shadow-sm backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Icon className="h-4 w-4" strokeWidth={2} />
          </span>
          <p className="font-medium text-foreground">{milestone.label}</p>
        </div>
        <span className="font-display text-lg font-bold text-foreground">{milestone.percentage}%</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${milestone.percentage}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {milestone.completedCount} dari {milestone.totalCount} sudah selesai ({milestone.baseLabel})
      </p>

      {milestone.pending.length > 0 && (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="flex items-center justify-between rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
          >
            <span>
              Lihat {milestone.pending.length} yang belum {milestone.label}
            </span>
            <ChevronDown
              className={cn("h-4 w-4 transition-transform duration-200", expanded && "rotate-180")}
              strokeWidth={2}
            />
          </button>
          {expanded && (
            <ul className="flex max-h-56 flex-col gap-1 overflow-y-auto rounded-lg border border-border/60 p-2">
              {milestone.pending.map((member) => (
                <li
                  key={member.id}
                  className="flex items-center justify-between rounded-md px-2 py-1.5 text-xs hover:bg-muted/60"
                >
                  <span className="text-foreground">{member.fullName}</span>
                  <span className="text-muted-foreground">{member.cgLabel}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function VipSection({ report }: { report: ComsulReport }) {
  return (
    <section className="flex flex-col gap-4">
      <SectionHeader
        icon={UserPlus}
        title="VIP Berpotensi"
        description={`${report.vipPotential.length} dari ${report.vipAllCount} prospek masih pending / berpotensi`}
      />
      <div className="overflow-x-auto rounded-2xl border border-border bg-card/70 shadow-sm backdrop-blur-xl">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-medium">Nama</th>
              <th className="px-4 py-3 font-medium">CG</th>
              <th className="px-4 py-3 font-medium">No WA</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Follow Up Oleh</th>
              <th className="px-4 py-3 font-medium">Keterangan</th>
            </tr>
          </thead>
          <tbody>
            {report.vipPotential.map((vip) => (
              <tr key={vip.id} className="border-b border-border/60 last:border-0">
                <td className="px-4 py-3 font-medium text-foreground">{vip.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{vip.cgLabel}</td>
                <td className="px-4 py-3 text-muted-foreground">{vip.phone ?? "-"}</td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium",
                      VIP_STATUS_TONES[vip.status],
                    )}
                  >
                    {VIP_STATUS_LABELS[vip.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{vip.followUpByName ?? "-"}</td>
                <td className="px-4 py-3 text-muted-foreground">{vip.notes ?? "-"}</td>
              </tr>
            ))}
            {report.vipPotential.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                  Tidak ada VIP berstatus pending atau berpotensi saat ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function KeuanganSection({ report }: { report: ComsulReport }) {
  const maxBalance = Math.max(1, ...report.kasAccounts.map((account) => Math.abs(account.balance)));

  return (
    <section className="flex flex-col gap-4">
      <SectionHeader
        icon={Wallet}
        title="Keuangan Coach & CG"
        description={`Total saldo gabungan ${formatCurrencyIDR(report.overview.totalBalance)}`}
      />
      <div className="rounded-2xl border border-border bg-card/70 p-5 shadow-sm backdrop-blur-xl">
        <div className="flex flex-col gap-3">
          {report.kasAccounts.map((account, index) => {
            const widthPercentage = (Math.abs(account.balance) / maxBalance) * 100;
            return (
              <div key={account.accountId} className="flex items-center gap-3">
                <span className="w-20 shrink-0 text-xs font-medium text-muted-foreground">
                  {account.label}
                </span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${widthPercentage}%`,
                      backgroundColor:
                        account.accountType === "coach"
                          ? "var(--chart-1)"
                          : CHART_COLORS[(index + 1) % CHART_COLORS.length],
                    }}
                  />
                </div>
                <span className="w-32 shrink-0 text-right text-xs font-semibold text-foreground">
                  {formatCurrencyIDR(account.balance)}
                </span>
              </div>
            );
          })}
          {report.kasAccounts.length === 0 && (
            <p className="text-sm text-muted-foreground">Belum ada akun kas.</p>
          )}
        </div>
      </div>
    </section>
  );
}

function RetentionSection({ report }: { report: ComsulReport }) {
  const { retention } = report;
  const retentionRate =
    retention.totalActive + retention.totalFormer > 0
      ? Math.round((retention.totalActive / (retention.totalActive + retention.totalFormer)) * 100)
      : 100;

  return (
    <section className="flex flex-col gap-4">
      <SectionHeader
        icon={UserMinus}
        title="Retensi & Alumni"
        description={`${retention.totalFormer} anggota sudah keluar sepanjang waktu, ${retention.leftLast90d} di antaranya dalam 90 hari terakhir`}
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card/70 p-5 shadow-sm backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">Tingkat Retensi</p>
            <span className="font-display text-2xl font-bold text-foreground">{retentionRate}%</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${retentionRate}%` }} />
          </div>
          <p className="text-xs text-muted-foreground">
            {retention.totalActive} anggota aktif berbanding {retention.totalFormer} yang pernah keluar
            sepanjang sejarah komsel.
          </p>

          <div className="flex flex-col gap-2 pt-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Alasan Keluar
            </p>
            {retention.reasonBreakdown.map((reason, index) => (
              <div key={reason.reason} className="flex items-center gap-3">
                <span className="w-32 shrink-0 text-xs text-muted-foreground">{reason.label}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(reason.count / Math.max(1, retention.totalFormer)) * 100}%`,
                      backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                    }}
                  />
                </div>
                <span className="w-6 shrink-0 text-right text-xs font-semibold text-foreground">
                  {reason.count}
                </span>
              </div>
            ))}
            {retention.reasonBreakdown.length === 0 && (
              <p className="text-xs text-muted-foreground">Belum ada anggota yang keluar.</p>
            )}
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-border bg-card/70 shadow-sm backdrop-blur-xl">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-medium">Nama</th>
                <th className="px-4 py-3 font-medium">CG</th>
                <th className="px-4 py-3 font-medium">Alasan</th>
                <th className="px-4 py-3 font-medium">Tanggal Keluar</th>
              </tr>
            </thead>
            <tbody>
              {retention.recentLeavers.map((leaver) => (
                <tr key={leaver.id} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-3 font-medium text-foreground">{leaver.fullName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{leaver.cgLabel}</td>
                  <td className="px-4 py-3 text-muted-foreground">{leaver.reasonLabel}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {leaver.leftDate ? formatDateLabel(leaver.leftDate) : "-"}
                  </td>
                </tr>
              ))}
              {retention.recentLeavers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                    Belum ada riwayat anggota keluar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function BirthdaySection({ report }: { report: ComsulReport }) {
  const monthLabel = new Intl.DateTimeFormat("id-ID", { month: "long" }).format(new Date());

  return (
    <section className="flex flex-col gap-4">
      <SectionHeader
        icon={PartyPopper}
        title={`Ulang Tahun Bulan ${monthLabel}`}
        description={`${report.birthdaysThisMonth.length} anggota berulang tahun bulan ini`}
      />
      <div className="overflow-x-auto rounded-2xl border border-border bg-card/70 shadow-sm backdrop-blur-xl">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-medium">Tanggal</th>
              <th className="px-4 py-3 font-medium">Nama</th>
              <th className="px-4 py-3 font-medium">CG</th>
              <th className="px-4 py-3 font-medium">Usia</th>
            </tr>
          </thead>
          <tbody>
            {report.birthdaysThisMonth.map((birthday) => (
              <tr key={birthday.id} className="border-b border-border/60 last:border-0">
                <td className="px-4 py-3 font-medium text-foreground">{birthday.day}</td>
                <td className="px-4 py-3 text-foreground">{birthday.fullName}</td>
                <td className="px-4 py-3 text-muted-foreground">{birthday.cgLabel}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {birthday.age !== null ? `${birthday.age} th` : "-"}
                </td>
              </tr>
            ))}
            {report.birthdaysThisMonth.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                  Tidak ada anggota yang berulang tahun bulan ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function formatDateLabel(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(parsed);
}

function RoleDistributionSection({ report }: { report: ComsulReport }) {
  const { roleDistribution } = report.overview;
  const total = roleDistribution.reduce((sum, item) => sum + item.count, 0);

  const gradientStops = roleDistribution.reduce<{ segments: string[]; cursor: number }>(
    (acc, item, index) => {
      const percentage = total > 0 ? (item.count / total) * 100 : 0;
      const end = acc.cursor + percentage;
      acc.segments.push(`${CHART_COLORS[index % CHART_COLORS.length]} ${acc.cursor}% ${end}%`);
      return { segments: acc.segments, cursor: end };
    },
    { segments: [], cursor: 0 },
  ).segments;

  const donutStyle: React.CSSProperties =
    gradientStops.length > 0
      ? { background: `conic-gradient(${gradientStops.join(", ")})` }
      : { background: "var(--muted)" };

  return (
    <section className="flex flex-col gap-4">
      <SectionHeader
        icon={ChartPie}
        title="Distribusi Role & Kelengkapan Data"
        description="Sebaran peran anggota di seluruh organisasi"
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex items-center gap-6 rounded-2xl border border-border bg-card/70 p-5 shadow-sm backdrop-blur-xl">
          <div className="relative h-32 w-32 shrink-0 rounded-full" style={donutStyle}>
            <div className="absolute inset-3 flex flex-col items-center justify-center rounded-full bg-card">
              <span className="font-display text-lg font-bold text-foreground">{total}</span>
              <span className="text-[10px] text-muted-foreground">Total</span>
            </div>
          </div>
          <ul className="flex flex-1 flex-col gap-2">
            {roleDistribution.map((item, index) => (
              <li key={item.role} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-foreground">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                  />
                  {item.label}
                </span>
                <span className="text-muted-foreground">{item.count}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col justify-center gap-3 rounded-2xl border border-border bg-card/70 p-5 shadow-sm backdrop-blur-xl">
          <p className="text-sm font-medium text-foreground">Kelengkapan Data NIJ</p>
          <div className="h-2.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{
                width:
                  report.overview.totalPeople > 0
                    ? `${((report.overview.totalPeople - report.overview.nijMissingCount) / report.overview.totalPeople) * 100}%`
                    : "0%",
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {report.overview.totalPeople - report.overview.nijMissingCount} dari{" "}
            {report.overview.totalPeople} anggota sudah punya NIJ. NIJ memang opsional, jadi angka ini
            hanya sebagai insight, bukan target wajib.
          </p>
        </div>
      </div>
    </section>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-4.5 w-4.5" strokeWidth={2} />
      </span>
      <div>
        <h2 className="font-display text-base font-bold tracking-tight text-foreground">{title}</h2>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
