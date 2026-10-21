import { isBillingEnabled } from "@/server/billing/billing-mode";
import { ClientRepository } from "@/server/features/clients/repositories/ClientRepository";
import { ProjectRepository } from "@/server/features/projects/repositories/ProjectRepository";
import { ReportRepository } from "@/server/features/reports/repositories/ReportRepository";
import { AppError } from "@/server/lib/errors";
import { applyBillingMarkupUsd } from "@/shared/billing";

const USAGE_DAYS = 30;

// The agency's Clients page: every client with its projects, contacts,
// pending invitations and recent research cost, plus the organization's
// projects for assignment.
async function getClientsOverview(organizationId: string) {
  const since = new Date(Date.now() - USAGE_DAYS * 86400_000).toISOString();
  const [clients, contacts, invitations, projects, usage, billing] =
    await Promise.all([
      ClientRepository.listClients(organizationId),
      ClientRepository.listContacts(organizationId),
      ClientRepository.listPendingContactInvitations(organizationId),
      ProjectRepository.listProjects(organizationId),
      ClientRepository.sumUsageByClient(organizationId, since),
      isBillingEnabled(),
    ]);
  // What the agency pays: the marked-up price when this deployment bills,
  // otherwise the provider's own price.
  const usageFor = (clientId: string | null) => {
    const costUsd =
      usage.find((row) => row.clientId === clientId)?.costUsd ?? 0;
    return billing ? applyBillingMarkupUsd(costUsd) : costUsd;
  };

  return {
    usageDays: USAGE_DAYS,
    agencyUsageUsd: usageFor(null),
    clients: clients.map((client) => ({
      ...client,
      usageUsd: usageFor(client.id),
      contacts: contacts.filter((contact) => contact.clientId === client.id),
      pendingInvitations: invitations.filter(
        (invitation) => invitation.clientId === client.id,
      ),
    })),
    projects: projects.map((project) => ({
      id: project.id,
      name: project.name,
      domain: project.domain,
      clientId: project.clientTeamId,
    })),
  };
}

async function requireClient(clientId: string, organizationId: string) {
  const client = await ClientRepository.getClientForOrganization(
    clientId,
    organizationId,
  );
  if (!client) throw new AppError("NOT_FOUND");
  return client;
}

type ClientProject = {
  id: string;
  organizationId: string;
  clientTeamId: string | null;
};

// The client a project belongs to, or null for an agency-internal project.
async function getProjectClient(project: ClientProject) {
  if (!project.clientTeamId) return null;
  return ClientRepository.getClientForOrganization(
    project.clientTeamId,
    project.organizationId,
  );
}

// Whether a report is published to its project's client portal, and to whom.
async function getReportPublication(project: ClientProject, reportId: string) {
  const visibleAt = await ReportRepository.getClientVisibleAt(
    project.id,
    reportId,
  );
  if (visibleAt === undefined) throw new AppError("NOT_FOUND");
  const client = await getProjectClient(project);
  return { client, visibleAt: client ? visibleAt : null };
}

async function setReportPublication(
  project: ClientProject,
  reportId: string,
  visible: boolean,
) {
  // Only a project with a client has a portal to publish to.
  if (visible && !project.clientTeamId) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Assign this project to a client before publishing reports to them.",
    );
  }
  const found = await ReportRepository.setClientVisibility(
    project.id,
    reportId,
    visible,
  );
  if (!found) throw new AppError("NOT_FOUND");
}

export const ClientService = {
  getClientsOverview,
  requireClient,
  getProjectClient,
  getReportPublication,
  setReportPublication,
} as const;
