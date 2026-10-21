import type { ReactNode } from "react";
import { EmptyState } from "@/client/components/EmptyState";
import { SeverityBadge } from "@/client/features/audit/shared";

// Building blocks shared by the client portal's pages (spec 0017).

export function PortalSites<T extends { id: string }>({
  sites,
  children,
}: {
  sites: T[];
  children: (site: T) => ReactNode;
}) {
  if (sites.length === 0) {
    return (
      <EmptyState
        title="No websites here yet"
        description="Your agency hasn't added a website to this portal yet."
      />
    );
  }
  return <div className="space-y-8">{sites.map(children)}</div>;
}

export function PortalSiteSection({
  site,
  children,
}: {
  site: { name: string; domain: string | null };
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold">{site.name}</h2>
        {site.domain && site.domain !== site.name ? (
          <p className="text-sm text-muted-foreground">{site.domain}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

const changeClass = (change: number) =>
  change > 0
    ? "text-success"
    : change < 0
      ? "text-destructive"
      : "text-muted-foreground";

export function PercentChange({ change }: { change: number | null }) {
  if (change === null) return <span className="text-muted-foreground">—</span>;
  return (
    <span className={changeClass(change)}>
      {change > 0 ? "+" : ""}
      {change}%
    </span>
  );
}

// Positions fall as rankings improve, so moving from 8 to 3 reads as +5.
export function RankChange({
  position,
  previousPosition,
}: {
  position: number | null;
  previousPosition: number | null;
}) {
  if (position === null && previousPosition === null) {
    return <span className="text-muted-foreground">—</span>;
  }
  if (previousPosition === null)
    return <span className="text-success">New</span>;
  if (position === null) return <span className="text-destructive">Lost</span>;
  const change = previousPosition - position;
  if (change === 0) return <span className="text-muted-foreground">—</span>;
  return (
    <span className={changeClass(change)}>
      {change > 0 ? "+" : ""}
      {change}
    </span>
  );
}

export function SeverityCounts({
  health,
}: {
  health: { critical: number; warning: number; info: number };
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <SeverityBadge severity="critical">
        {health.critical} critical
      </SeverityBadge>
      <SeverityBadge severity="warning">
        {health.warning} {health.warning === 1 ? "warning" : "warnings"}
      </SeverityBadge>
      <SeverityBadge severity="info">
        {health.info} {health.info === 1 ? "notice" : "notices"}
      </SeverityBadge>
    </div>
  );
}
