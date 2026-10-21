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
import { formatDate, SeverityBadge } from "@/client/features/audit/shared";
import {
  PortalSiteSection,
  PortalSites,
  SeverityCounts,
} from "@/client/features/portal/PortalParts";
import { portalSiteHealthQueryOptions } from "@/client/features/portal/portalQueries";
import { formatCount } from "@/client/features/search-performance/SearchPerformanceColumns";

export const Route = createFileRoute("/portal/$clientId/health")({
  component: PortalSiteHealthPage,
});

const SEVERITY_LABELS = {
  critical: "Critical",
  warning: "Warning",
  info: "Notice",
} as const;

function PortalSiteHealthPage() {
  const { clientId } = Route.useParams();
  const query = useQuery(portalSiteHealthQueryOptions(clientId));

  return (
    <QueryState query={query} errorFallback="We couldn't load site health.">
      {(data) => (
        <PortalSites sites={data.sites}>
          {({ health, ...site }) => (
            <PortalSiteSection key={site.id} site={site}>
              {health ? (
                <Card>
                  <CardHeader>
                    <CardTitle>
                      <h3>Latest site scan</h3>
                    </CardTitle>
                    <CardDescription>
                      {formatCount(health.pagesScanned)} pages scanned on{" "}
                      {formatDate(health.scannedAt)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <SeverityCounts health={health} />
                    {health.issues.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        The last scan found no issues.
                      </p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Issue</TableHead>
                            <TableHead>Severity</TableHead>
                            <TableHead className="text-right">
                              Pages affected
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {health.issues.map((issue) => (
                            <TableRow key={issue.issueType}>
                              <TableCell>{issue.title}</TableCell>
                              <TableCell>
                                <SeverityBadge severity={issue.severity}>
                                  {SEVERITY_LABELS[issue.severity]}
                                </SeverityBadge>
                              </TableCell>
                              <TableCell className="text-right tabular-nums">
                                {formatCount(issue.pages)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <EmptyState
                  title="No site scan yet"
                  description="Site health appears here after your agency scans this site."
                />
              )}
            </PortalSiteSection>
          )}
        </PortalSites>
      )}
    </QueryState>
  );
}
