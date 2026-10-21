import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { BarChart3, HeartPulse, Search } from "lucide-react";
import { CardShell } from "@/client/components/CardShell";
import { MetricsTable, percentChange } from "@/client/components/MetricsTable";
import { QueryState } from "@/client/components/QueryState";
import { buttonVariants } from "@/client/components/ui/button";
import { formatDate } from "@/client/features/audit/shared";
import {
  PercentChange,
  PortalSiteSection,
  PortalSites,
  SeverityCounts,
} from "@/client/features/portal/PortalParts";
import {
  portalOverviewQueryOptions,
  type PortalOverview,
} from "@/client/features/portal/portalQueries";
import { formatCount } from "@/client/features/search-performance/SearchPerformanceColumns";

export const Route = createFileRoute("/portal/$clientId/")({
  component: PortalOverviewPage,
});

type Site = PortalOverview["sites"][number];

const moreClass = buttonVariants({ variant: "ghost", size: "xs" });

function PortalOverviewPage() {
  const { clientId } = Route.useParams();
  const query = useQuery(portalOverviewQueryOptions(clientId));

  return (
    <QueryState query={query} errorFallback="We couldn't load this overview.">
      {(data) => (
        <PortalSites sites={data.sites}>
          {(site) => (
            <PortalSiteSection key={site.id} site={site}>
              <div className="grid gap-4 lg:grid-cols-3">
                <SearchCard search={site.search} />
                <RankingsCard clientId={clientId} rankings={site.rankings} />
                <HealthCard clientId={clientId} health={site.health} />
              </div>
            </PortalSiteSection>
          )}
        </PortalSites>
      )}
    </QueryState>
  );
}

function SearchCard({ search }: { search: Site["search"] }) {
  return (
    <CardShell title="Google search, last 28 days" icon={<Search />}>
      {search ? (
        <MetricsTable
          showChange
          rows={[
            {
              label: "Clicks",
              value: formatCount(search.clicks),
              change: (
                <PercentChange
                  change={percentChange(search.clicks, search.previousClicks)}
                />
              ),
            },
            {
              label: "Impressions",
              value: formatCount(search.impressions),
              change: (
                <PercentChange
                  change={percentChange(
                    search.impressions,
                    search.previousImpressions,
                  )}
                />
              ),
            },
          ]}
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          Search data isn&rsquo;t available for this site yet.
        </p>
      )}
    </CardShell>
  );
}

function RankingsCard({
  clientId,
  rankings,
}: {
  clientId: string;
  rankings: Site["rankings"];
}) {
  return (
    <CardShell
      title="Rankings"
      icon={<BarChart3 />}
      action={
        rankings ? (
          <Link
            to="/portal/$clientId/rankings"
            params={{ clientId }}
            className={moreClass}
          >
            All keywords
          </Link>
        ) : null
      }
    >
      {rankings ? (
        <div className="space-y-3">
          <MetricsTable
            rows={[
              { label: "Keywords tracked", value: rankings.tracked },
              { label: "In the top 10", value: rankings.top10 },
              { label: "Moved up", value: rankings.improved },
              { label: "Moved down", value: rankings.declined },
            ]}
          />
          {rankings.topGains.length > 0 ? (
            <ul className="space-y-1 text-sm">
              {rankings.topGains.map((gain) => (
                <li key={gain.keyword} className="flex justify-between gap-3">
                  <span className="truncate">{gain.keyword}</span>
                  <span className="shrink-0 tabular-nums text-success">
                    +{gain.gain} to #{gain.position}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
          {rankings.lastCheckedAt ? (
            <p className="text-xs text-muted-foreground">
              Checked {formatDate(rankings.lastCheckedAt)}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No keywords are being tracked for this site yet.
        </p>
      )}
    </CardShell>
  );
}

function HealthCard({
  clientId,
  health,
}: {
  clientId: string;
  health: Site["health"];
}) {
  return (
    <CardShell
      title="Site health"
      icon={<HeartPulse />}
      action={
        health ? (
          <Link
            to="/portal/$clientId/health"
            params={{ clientId }}
            className={moreClass}
          >
            All issues
          </Link>
        ) : null
      }
    >
      {health ? (
        <div className="space-y-3">
          <SeverityCounts health={health} />
          <p className="text-xs text-muted-foreground">
            {formatCount(health.pagesScanned)} pages scanned on{" "}
            {formatDate(health.scannedAt)}
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          This site hasn&rsquo;t been scanned yet.
        </p>
      )}
    </CardShell>
  );
}
