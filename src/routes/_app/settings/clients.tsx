import { createFileRoute, notFound } from "@tanstack/react-router";
import { ClientsSettings } from "@/client/features/clients/ClientsSettings";
import { isHostedClientAuthMode } from "@/lib/auth-mode";

export const Route = createFileRoute("/_app/settings/clients")({
  // Clients are organization teams, which only hosted mode has.
  beforeLoad: () => {
    if (!isHostedClientAuthMode()) {
      throw notFound();
    }
  },
  component: ClientsSettings,
});
