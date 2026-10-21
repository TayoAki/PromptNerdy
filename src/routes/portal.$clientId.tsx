import { useQuery } from "@tanstack/react-query";
import { Link, Outlet, createFileRoute } from "@tanstack/react-router";
import { EmptyState } from "@/client/components/EmptyState";
import { NavTab, NavTabs } from "@/client/components/NavTabs";
import { PageHeader } from "@/client/components/PageHeader";
import { Button } from "@/client/components/ui/button";
import { portalHomeQueryOptions } from "@/client/features/portal/portalQueries";

export const Route = createFileRoute("/portal/$clientId")({
  component: PortalClientLayout,
});

const tabs = [
  { to: "/portal/$clientId" as const, label: "Overview", exact: true },
  { to: "/portal/$clientId/reports" as const, label: "Reports" },
  { to: "/portal/$clientId/rankings" as const, label: "Rankings" },
  { to: "/portal/$clientId/health" as const, label: "Site health" },
];

// One client's view-only portal (spec 0017), tabbed like the app's settings.
function PortalClientLayout() {
  const { clientId } = Route.useParams();
  const { data } = useQuery(portalHomeQueryOptions());
  const client = data?.clients.find((candidate) => candidate.id === clientId);

  // A removed contact, a stale bookmark or another client's link.
  if (data && !client) {
    return (
      <EmptyState
        variant="card"
        title="This portal isn't available"
        description="It may have been removed, or it belongs to another client."
        action={
          <Button nativeButton={false} render={<Link to="/portal" />}>
            Your portal
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <PageHeader title={client?.name ?? "Client"} />
        <NavTabs label="Portal sections">
          {tabs.map((tab) => (
            <NavTab
              key={tab.to}
              to={tab.to}
              params={{ clientId }}
              activeOptions={{ exact: tab.exact ?? false }}
            >
              {tab.label}
            </NavTab>
          ))}
        </NavTabs>
      </div>
      <Outlet />
    </div>
  );
}
