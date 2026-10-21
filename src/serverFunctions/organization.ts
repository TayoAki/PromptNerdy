import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { getAuth } from "@/lib/auth";
import { hasOrgPermission, isClientRole } from "@/lib/org-permissions";
import { requireOrgPermission } from "@/server/auth/org-gate";
import { transferOrganizationOwnership } from "@/server/auth/ownership-transfer";
import { AuthRepository } from "@/server/auth/repositories/AuthRepository";
import { createAndDeliverInvitation } from "@/server/auth/invitations";
import { AppError } from "@/server/lib/errors";
import { requireAuthenticatedContext } from "@/serverFunctions/middleware";

// The client's source of truth for "who am I in this organization": the active
// org, the caller's role from their member row (resolved server-side by
// ensure-user), and every organization they belong to (for the switcher). Used
// to gate billing/team UI; the server functions and better-auth endpoints
// re-enforce every permission regardless.
export const getOrganizationContext = createServerFn({ method: "GET" })
  .middleware(requireAuthenticatedContext)
  .handler(async ({ context }) => {
    const memberships = await AuthRepository.listMembershipsForUser(
      context.userId,
    );
    const active = memberships.find(
      (membership) => membership.organizationId === context.organizationId,
    );

    return {
      organizationId: context.organizationId,
      organizationName: active?.organizationName ?? "Organization",
      role: context.role,
      organizations: memberships,
    };
  });

// Team data for the organization settings tab. Pending invitations are
// sensitive (invitee emails, inviter ids) and should only be visible to callers
// who can manage invitations; the server filters them here so the client cannot
// bypass the gate by calling the underlying endpoint directly.
export const getTeam = createServerFn({ method: "GET" })
  .middleware(requireAuthenticatedContext)
  .handler(async ({ context }) => {
    const fullOrganization = await getAuth().api.getFullOrganization({
      headers: getRequest().headers,
      query: { organizationId: context.organizationId },
    });
    if (!fullOrganization) {
      throw new AppError("NOT_FOUND");
    }

    const canViewInvitations = hasOrgPermission(context.role, {
      invitation: ["create"],
    });
    const now = Date.now();
    // Client contacts (spec 0017) are managed on the Clients page, not here.
    const pendingInvitations = canViewInvitations
      ? (fullOrganization.invitations ?? []).filter(
          (invitation) =>
            invitation.status === "pending" &&
            invitation.role !== "client" &&
            new Date(invitation.expiresAt).getTime() > now,
        )
      : [];

    return {
      members: (fullOrganization.members ?? []).filter(
        (member) => !isClientRole(member.role),
      ),
      pendingInvitations,
    };
  });

const switchOrganizationSchema = z.object({
  organizationId: z.string().min(1),
});

// Switch the active organization and persist the choice so the next sign-in
// lands in the same org (session hook reads user.lastActiveOrganizationId).
export const switchOrganization = createServerFn({ method: "POST" })
  .middleware(requireAuthenticatedContext)
  .validator(switchOrganizationSchema)
  .handler(async ({ data, context }) => {
    const membership = await AuthRepository.getMembership(
      context.userId,
      data.organizationId,
    );
    if (!membership) {
      throw new AppError("NOT_FOUND");
    }

    await getAuth().api.setActiveOrganization({
      headers: getRequest().headers,
      body: { organizationId: data.organizationId },
    });
    await AuthRepository.setLastActiveOrganization(
      context.userId,
      data.organizationId,
    );

    return { organizationId: data.organizationId };
  });

const sendInvitationSchema = z.object({ email: z.string().email() });

// Invite (or re-invite) a teammate. See createAndDeliverInvitation for why the
// email is sent here and not by better-auth.
export const sendTeamInvitation = createServerFn({ method: "POST" })
  .middleware(requireAuthenticatedContext)
  .validator(sendInvitationSchema)
  .handler(async ({ data, context }) => {
    // Defense in depth: fail-closed locally before touching the rate-limit
    // budget or calling the plugin, so the budget cannot be exhausted by
    // low-privilege callers.
    requireOrgPermission(context, { invitation: ["create"] });
    return createAndDeliverInvitation(context, {
      email: data.email,
      role: "admin",
    });
  });

const transferOwnershipSchema = z.object({ memberId: z.string().min(1) });

// Owner-only. Runs here rather than through better-auth's update-member-role,
// which can't swap two roles atomically and refuses owner grants (see the
// beforeUpdateMemberRole hook in auth.ts).
export const transferOwnership = createServerFn({ method: "POST" })
  .middleware(requireAuthenticatedContext)
  .validator(transferOwnershipSchema)
  .handler(async ({ data, context }) => {
    await transferOrganizationOwnership(context, data.memberId);
    return { memberId: data.memberId };
  });
