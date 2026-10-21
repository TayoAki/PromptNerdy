import { and, asc, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { invitation, member, team, teamMember, user } from "@/db/schema";

// An agency's clients are Better Auth teams in its organization, and a
// client's contacts are `client`-role members of that team (spec 0017).

async function listClients(organizationId: string) {
  return db
    .select({ id: team.id, name: team.name })
    .from(team)
    .where(eq(team.organizationId, organizationId))
    .orderBy(asc(team.name), asc(team.id));
}

async function getClientForOrganization(
  clientId: string,
  organizationId: string,
) {
  const [row] = await db
    .select({ id: team.id, name: team.name })
    .from(team)
    .where(and(eq(team.id, clientId), eq(team.organizationId, organizationId)))
    .limit(1);
  return row ?? null;
}

async function listContacts(organizationId: string) {
  return db
    .select({
      clientId: teamMember.teamId,
      memberId: member.id,
      userId: user.id,
      name: user.name,
      email: user.email,
    })
    .from(teamMember)
    .innerJoin(team, eq(teamMember.teamId, team.id))
    .innerJoin(user, eq(teamMember.userId, user.id))
    .innerJoin(
      member,
      and(
        eq(member.userId, teamMember.userId),
        eq(member.organizationId, team.organizationId),
      ),
    )
    .where(eq(team.organizationId, organizationId))
    .orderBy(asc(user.email));
}

async function listPendingContactInvitations(organizationId: string) {
  return db
    .select({
      id: invitation.id,
      clientId: invitation.teamId,
      email: invitation.email,
      expiresAt: invitation.expiresAt,
    })
    .from(invitation)
    .where(
      and(
        eq(invitation.organizationId, organizationId),
        eq(invitation.role, "client"),
        eq(invitation.status, "pending"),
        gt(invitation.expiresAt, new Date()),
      ),
    )
    .orderBy(asc(invitation.email));
}

// The clients a contact belongs to in one organization.
async function listClientsForContact(userId: string, organizationId: string) {
  return db
    .select({ id: team.id, name: team.name })
    .from(teamMember)
    .innerJoin(team, eq(teamMember.teamId, team.id))
    .where(
      and(
        eq(teamMember.userId, userId),
        eq(team.organizationId, organizationId),
      ),
    )
    .orderBy(asc(team.name), asc(team.id));
}

export const ClientRepository = {
  listClients,
  getClientForOrganization,
  listContacts,
  listPendingContactInvitations,
  listClientsForContact,
} as const;
