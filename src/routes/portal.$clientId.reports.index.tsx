import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { QueryError } from "@/client/components/QueryState";
import { SkeletonCard } from "@/client/components/SkeletonPresets";
import { portalReportsQueryOptions } from "@/client/features/portal/portalQueries";
import { formatRelativeTime } from "@/client/lib/relative-time";

export const Route = createFileRoute("/portal/$clientId/reports/")({
  component: PortalClientReports,
});

// The summary is markdown; the list shows its first non-heading line as plain
// text.
function firstLine(markdown: string) {
  return markdown
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("#"))
    .map((line) => line.replace(/^[>*\-\s]+/, "").trim())
    .find(Boolean);
}

function PortalClientReports() {
  const { clientId } = Route.useParams();
  const reportsQuery = useQuery(portalReportsQueryOptions(clientId));

  if (reportsQuery.isError) {
    return (
      <QueryError
        error={reportsQuery.error}
        fallback="We couldn't load these reports right now."
        onRetry={() => void reportsQuery.refetch()}
        isRetrying={reportsQuery.isFetching}
      />
    );
  }
  if (!reportsQuery.data) return <SkeletonCard />;

  const { reports } = reportsQuery.data;
  return (
    <div className="space-y-4">
      {reports.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No reports have been shared yet.
        </p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {reports.map((report) => (
            <li key={report.id}>
              <Link
                to="/portal/$clientId/reports/$reportId"
                params={{ clientId, reportId: report.id }}
                className="block space-y-1 px-4 py-3 hover:bg-muted/50"
              >
                <span className="block font-medium">{report.title}</span>
                <span className="block text-sm text-muted-foreground">
                  {report.projectDomain ?? report.projectName}
                  {report.clientVisibleAt
                    ? ` · Shared ${formatRelativeTime(report.clientVisibleAt)}`
                    : null}
                </span>
                {firstLine(report.summary) ? (
                  <span className="block text-sm text-muted-foreground">
                    {firstLine(report.summary)}
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
