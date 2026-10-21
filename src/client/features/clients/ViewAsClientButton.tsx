import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Eye } from "lucide-react";
import { Button } from "@/client/components/ui/button";
import { isHostedClientAuthMode } from "@/lib/auth-mode";
import { getProjectClient } from "@/serverFunctions/clients";

// Opens the client portal as the project's client sees it (spec 0017). Renders
// nothing for an agency-internal project, or on self-host, which has no
// clients.
export function ViewAsClientButton({ projectId }: { projectId: string }) {
  const clientQuery = useQuery({
    queryKey: ["project-client", projectId],
    queryFn: () => getProjectClient({ data: { projectId } }),
    enabled: isHostedClientAuthMode(),
  });
  const client = clientQuery.data;
  if (!client) return null;

  return (
    <Button
      variant="outline"
      nativeButton={false}
      render={<Link to="/portal/$clientId" params={{ clientId: client.id }} />}
    >
      <Eye />
      View as client
    </Button>
  );
}
