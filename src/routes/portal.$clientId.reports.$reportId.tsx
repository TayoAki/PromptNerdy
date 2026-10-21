import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { BackLink } from "@/client/components/PageHeader";
import { ReportViewer } from "@/client/features/reports/ReportViewer";
import { portalReportsQueryOptions } from "@/client/features/portal/portalQueries";

export const Route = createFileRoute("/portal/$clientId/reports/$reportId")({
  component: PortalReport,
});

// The document itself comes from /r/<reportId>, which serves a client contact
// only reports published to one of their clients.
function PortalReport() {
  const { clientId, reportId } = Route.useParams();
  const { data } = useQuery(portalReportsQueryOptions(clientId));
  const report = data?.reports.find((candidate) => candidate.id === reportId);

  return (
    <div className="flex h-[calc(100dvh-16rem)] min-h-96 flex-col gap-3">
      <div className="flex items-center gap-3">
        <BackLink to="/portal/$clientId/reports" params={{ clientId }}>
          All reports
        </BackLink>
        <h1 className="truncate font-semibold">{report?.title ?? "Report"}</h1>
      </div>
      <div className="min-h-0 flex-1">
        <ReportViewer
          src={`/r/${encodeURIComponent(reportId)}`}
          title={report?.title ?? "Report"}
        />
      </div>
    </div>
  );
}
