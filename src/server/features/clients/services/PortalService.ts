import { isClientRole } from "@/lib/org-permissions";
import type { EnsuredUserContext } from "@/middleware/ensure-user/types";
import { AuthRepository } from "@/server/auth/repositories/AuthRepository";
import { ClientRepository } from "@/server/features/clients/repositories/ClientRepository";
import { ReportRepository } from "@/server/features/reports/repositories/ReportRepository";
import { AppError } from "@/server/lib/errors";

// The client portal's reads (spec 0017). Every one scopes to the clients the
// caller may see: a contact's own clients, or every client for agency staff
// previewing the portal. Stored data only: nothing here calls a provider.

function listVisibleClients(context: EnsuredUserContext) {
  return isClientRole(context.role)
    ? ClientRepository.listClientsForContact(
        context.userId,
        context.organizationId,
      )
    : ClientRepository.listClients(context.organizationId);
}

async function getHome(context: EnsuredUserContext) {
  const [agency, clients] = await Promise.all([
    AuthRepository.getOrganizationBranding(context.organizationId),
    listVisibleClients(context),
  ]);
  return {
    agencyName: agency?.name ?? "Your agency",
    agencyLogo: agency?.logo ?? null,
    clients,
  };
}

async function listReports(context: EnsuredUserContext, clientId: string) {
  const clients = await listVisibleClients(context);
  const client = clients.find((candidate) => candidate.id === clientId);
  if (!client) throw new AppError("NOT_FOUND");
  return {
    client,
    reports: await ReportRepository.listClientVisibleReports(clientId),
  };
}

export const PortalService = { getHome, listReports } as const;
