import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { EmptyState } from "@/client/components/EmptyState";
import { QueryState } from "@/client/components/QueryState";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/client/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/client/components/ui/table";
import { formatDate } from "@/client/features/audit/shared";
import {
  PortalSiteSection,
  PortalSites,
  RankChange,
} from "@/client/features/portal/PortalParts";
import {
  portalRankingsQueryOptions,
  type PortalRankings,
} from "@/client/features/portal/portalQueries";

export const Route = createFileRoute("/portal/$clientId/rankings")({
  component: PortalRankingsPage,
});

type Tracker = PortalRankings["sites"][number]["trackers"][number];

const DEVICE_LABELS = { desktop: "Desktop", mobile: "Mobile" } as const;
const CHANGE_LABELS = {
  "1d": "Change since the previous day",
  "7d": "Change over the last 7 days",
  "30d": "Change over the last 30 days",
  "90d": "Change over the last 90 days",
} as const;

function PortalRankingsPage() {
  const { clientId } = Route.useParams();
  const query = useQuery(portalRankingsQueryOptions(clientId));

  return (
    <QueryState query={query} errorFallback="We couldn't load these rankings.">
      {(data) => (
        <PortalSites sites={data.sites}>
          {(site) => (
            <PortalSiteSection key={site.id} site={site}>
              {site.trackers.length === 0 ? (
                <EmptyState
                  title="No keywords tracked yet"
                  description="Rankings appear here once your agency starts tracking keywords for this site."
                />
              ) : (
                site.trackers.map((tracker) => (
                  <TrackerCard key={tracker.id} tracker={tracker} />
                ))
              )}
            </PortalSiteSection>
          )}
        </PortalSites>
      )}
    </QueryState>
  );
}

function TrackerCard({ tracker }: { tracker: Tracker }) {
  const details = [
    tracker.location,
    tracker.devices.map((device) => DEVICE_LABELS[device]).join(" and "),
    tracker.lastCheckedAt
      ? `checked ${formatDate(tracker.lastCheckedAt)}`
      : "not checked yet",
  ].filter(Boolean);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h3>Google rankings</h3>
        </CardTitle>
        <CardDescription>
          {details.join(" · ")}. {CHANGE_LABELS[tracker.comparePeriod]}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Keyword</TableHead>
              {tracker.devices.flatMap((device) => [
                <TableHead key={device} className="text-right">
                  {DEVICE_LABELS[device]}
                </TableHead>,
                <TableHead key={`${device}-change`} className="text-right">
                  Change
                </TableHead>,
              ])}
            </TableRow>
          </TableHeader>
          <TableBody>
            {tracker.keywords.map((keyword) => (
              <TableRow key={keyword.keyword}>
                <TableCell className="max-w-80 truncate">
                  {keyword.keyword}
                </TableCell>
                {tracker.devices.flatMap((device) => [
                  <TableCell
                    key={device}
                    className="text-right tabular-nums"
                    title={keyword[device].rankingUrl ?? undefined}
                  >
                    {keyword[device].position ?? "—"}
                  </TableCell>,
                  <TableCell
                    key={`${device}-change`}
                    className="text-right tabular-nums"
                  >
                    <RankChange
                      position={keyword[device].position}
                      previousPosition={keyword[device].previousPosition}
                    />
                  </TableCell>,
                ])}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
