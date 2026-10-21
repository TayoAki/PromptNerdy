import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { getAuth } from "@/lib/auth";
import { isClientRole } from "@/lib/org-permissions";
import { createAndDeliverInvitation } from "@/server/auth/invitations";
import { requireOrgPermission } from "@/server/auth/org-gate";
import { AuthRepository } from "@/server/auth/repositories/AuthRepository";
import { ClientService } from "@/server/features/clients/services/ClientService";
import { ProjectRepository } from "@/server/features/projects/repositories/ProjectRepository";
import { AppError } from "@/server/lib/errors";
import {
  requireAuthenticatedContext,
  requireProjectContext,
} from "@/serverFunctions/middleware";

// The agency's side of the client portal (spec 0017). Clients are Better Auth
// teams; the plugin's own permission checks run on every team call too.

const clientNameSchema = z.string().trim().min(1).max(80);

export const getClients = createServerFn({ method: "GET" })
  .middleware(requireAuthenticatedContext)
  .handler(({ context }) =>
    ClientService.getClientsOverview(context.organizationId),
  );

export const createClient = createServerFn({ method: "POST" })
  .middleware(requireAuthenticatedContext)
  .validator(z.object({ name: clientNameSchema }))
  .handler(async ({ data, context }) => {
    requireOrgPermission(context, { team: ["create"] });
    const client = await getAuth().api.createTeam({
      headers: getRequest().headers,
      body: { name: data.name, organizationId: context.organizationId },
    });
    return { id: client.id };
  });

export const renameClient = createServerFn({ method: "POST" })
  .middleware(requireAuthenticatedContext)
  .validator(z.object({ clientId: z.string().min(1), name: clientNameSchema }))
  .handler(async ({ data, context }) => {
    requireOrgPermission(context, { team: ["update"] });
    await ClientService.requireClient(data.clientId, context.organizationId);
    await getAuth().api.updateTeam({
      headers: getRequest().headers,
      body: { teamId: data.clientId, data: { name: data.name } },
    });
  });

// Assigning a project to a client is what lets that client's contacts see it;
// null makes it agency-internal again.
export const assignProjectClient = createServerFn({ method: "POST" })
  .middleware(requireProjectContext)
  .validator(
    z.object({ projectId: z.string().min(1), clientId: z.string().nullable() }),
  )
  .handler(async ({ data, context }) => {
    requireOrgPermission(context, { team: ["update"] });
    if (data.clientId) {
      await ClientService.requireClient(data.clientId, context.organizationId);
    }
    await ProjectRepository.setClientTeam(
      context.projectId,
      context.organizationId,
      data.clientId,
    );
  });

export const inviteClientContact = createServerFn({ method: "POST" })
  .middleware(requireAuthenticatedContext)
  .validator(
    z.object({ clientId: z.string().min(1), email: z.string().email() }),
  )
  .handler(async ({ data, context }) => {
    requireOrgPermission(context, { invitation: ["create"] });
    await ClientService.requireClient(data.clientId, context.organizationId);
    return createAndDeliverInvitation(context, {
      email: data.email,
      role: "client",
      teamId: data.clientId,
    });
  });

// Removing a contact removes their organization membership, which also drops
// their client team membership; access ends on their next request.
export const removeClientContact = createServerFn({ method: "POST" })
  .middleware(requireAuthenticatedContext)
  .validator(z.object({ memberId: z.string().min(1) }))
  .handler(async ({ data, context }) => {
    requireOrgPermission(context, { member: ["delete"] });
    const contact = await AuthRepository.getMemberInOrganization(
      data.memberId,
      context.organizationId,
    );
    // Only contacts: teammates leave through the organization's Team page.
    if (!contact || !isClientRole(contact.role)) {
      throw new AppError("NOT_FOUND");
    }
    await getAuth().api.removeMember({
      headers: getRequest().headers,
      body: {
        memberIdOrEmail: data.memberId,
        organizationId: context.organizationId,
      },
    });
  });

const reportPublicationSchema = z.object({
  projectId: z.string().min(1),
  reportId: z.string().min(1),
});

export const getReportPublication = createServerFn({ method: "GET" })
  .middleware(requireProjectContext)
  .validator(reportPublicationSchema)
  .handler(({ data, context }) =>
    ClientService.getReportPublication(context.project, data.reportId),
  );

// The agency decides which reports a client sees: reports stay agency-only
// until published here.
export const setReportPublication = createServerFn({ method: "POST" })
  .middleware(requireProjectContext)
  .validator(reportPublicationSchema.extend({ visible: z.boolean() }))
  .handler(({ data, context }) =>
    ClientService.setReportPublication(
      context.project,
      data.reportId,
      data.visible,
    ),
  );

export const getProjectClient = createServerFn({ method: "GET" })
  .middleware(requireProjectContext)
  .validator(z.object({ projectId: z.string().min(1) }))
  .handler(({ context }) => ClientService.getProjectClient(context.project));
