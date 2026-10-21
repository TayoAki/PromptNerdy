import { useQuery } from "@tanstack/react-query";
import { Link, Navigate, createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/client/components/PageHeader";
import { portalHomeQueryOptions } from "@/client/features/portal/portalQueries";

export const Route = createFileRoute("/portal/")({
  component: PortalHome,
});

// One client goes straight to its portal; several get a picker.
function PortalHome() {
  const { data } = useQuery(portalHomeQueryOptions());
  const clients = data?.clients ?? [];

  if (clients.length === 1 && clients[0]) {
    return (
      <Navigate
        to="/portal/$clientId"
        params={{ clientId: clients[0].id }}
        replace
      />
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Your clients" />
      {clients.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nothing has been shared with you yet.
        </p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {clients.map((client) => (
            <li key={client.id}>
              <Link
                to="/portal/$clientId"
                params={{ clientId: client.id }}
                className="block px-4 py-3 font-medium hover:bg-muted/50"
              >
                {client.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
