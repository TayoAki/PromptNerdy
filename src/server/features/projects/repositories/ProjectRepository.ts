import { and, count, desc, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { projects, teamMember } from "@/db/schema";
import { isClientRole } from "@/lib/org-permissions";
import { AppError } from "@/server/lib/errors";

async function listProjects(organizationId: string) {
  return db.query.projects.findMany({
    where: and(
      eq(projects.organizationId, organizationId),
      isNull(projects.archivedAt),
    ),
    orderBy: [desc(projects.createdAt), desc(projects.id)],
  });
}

async function countProjects(organizationId: string) {
  const [row] = await db
    .select({ value: count() })
    .from(projects)
    .where(
      and(
        eq(projects.organizationId, organizationId),
        isNull(projects.archivedAt),
      ),
    );
  return row?.value ?? 0;
}

async function getProjectForOrganization(
  projectId: string,
  organizationId: string,
) {
  const [project] = await db
    .select()
    .from(projects)
    .where(
      and(
        eq(projects.id, projectId),
        eq(projects.organizationId, organizationId),
        isNull(projects.archivedAt),
      ),
    )
    .limit(1);
  return project ?? null;
}

// The canonical project access rule (spec 0017): the project is in the
// caller's organization and, for a client contact, assigned to one of their
// client teams. Staff see every project in the organization.
async function getProjectForMember(
  projectId: string,
  caller: { organizationId: string; userId: string; role: string },
) {
  const project = await getProjectForOrganization(
    projectId,
    caller.organizationId,
  );
  if (!project || !isClientRole(caller.role)) return project;
  if (!project.clientTeamId) return null;
  const [membership] = await db
    .select({ id: teamMember.id })
    .from(teamMember)
    .where(
      and(
        eq(teamMember.teamId, project.clientTeamId),
        eq(teamMember.userId, caller.userId),
      ),
    )
    .limit(1);
  return membership ? project : null;
}

// A client's live projects (spec 0017), for the portal. Scoped by organization
// too, so a client id alone never reaches another organization's projects.
async function listProjectsForClient(
  clientTeamId: string,
  organizationId: string,
) {
  return db
    .select({ id: projects.id, name: projects.name, domain: projects.domain })
    .from(projects)
    .where(
      and(
        eq(projects.clientTeamId, clientTeamId),
        eq(projects.organizationId, organizationId),
        isNull(projects.archivedAt),
      ),
    )
    .orderBy(projects.name, projects.id);
}

// Assigns a project to one of the organization's clients, or back to
// agency-internal with null. The caller has checked the client is in the org.
async function setClientTeam(
  projectId: string,
  organizationId: string,
  clientTeamId: string | null,
) {
  await db
    .update(projects)
    .set({ clientTeamId })
    .where(
      and(
        eq(projects.id, projectId),
        eq(projects.organizationId, organizationId),
      ),
    );
}

// The archived counterpart of getProjectForOrganization, for the surfaces that
// owe the reader "this project is archived" instead of a bare not-found. Still
// org-scoped, so it adds no cross-org existence oracle.
async function getArchivedProjectForOrganization(
  projectId: string,
  organizationId: string,
) {
  const [project] = await db
    .select()
    .from(projects)
    .where(
      and(
        eq(projects.id, projectId),
        eq(projects.organizationId, organizationId),
        isNotNull(projects.archivedAt),
      ),
    )
    .limit(1);
  return project ?? null;
}

// Look up a project by id alone (no org scoping). Only for trusted server
// contexts that have already authorized access another way — e.g. the
// SAM chat Durable Object, whose connections are authorized in the Worker
// before they reach the DO, and which derives its org from the project.
async function getProjectById(projectId: string) {
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), isNull(projects.archivedAt)))
    .limit(1);
  return project ?? null;
}

async function createProject(
  organizationId: string,
  name: string,
  domain?: string,
  // Omitted keeps the column defaults.
  market?: { locationCode: number; languageCode: string },
) {
  const id = crypto.randomUUID();
  const [row] = await db
    .insert(projects)
    .values({ id, organizationId, name, domain, ...market })
    .returning();
  return row;
}

async function updateProject(
  projectId: string,
  organizationId: string,
  input: {
    name: string;
    domain?: string;
    // Omitted leaves the market columns untouched.
    market?: { locationCode: number; languageCode: string };
  },
) {
  const [row] = await db
    .update(projects)
    .set({ name: input.name, domain: input.domain ?? null, ...input.market })
    .where(
      and(
        eq(projects.id, projectId),
        eq(projects.organizationId, organizationId),
        isNull(projects.archivedAt),
      ),
    )
    .returning();

  if (!row) {
    throw new AppError("NOT_FOUND");
  }

  return row;
}

// Save website setup atomically without rewriting the project name.
async function updateProjectWebsite(
  projectId: string,
  organizationId: string,
  domain: string,
  market: { locationCode: number; languageCode: string },
) {
  const [row] = await db
    .update(projects)
    .set({ domain, ...market })
    .where(
      and(
        eq(projects.id, projectId),
        eq(projects.organizationId, organizationId),
        isNull(projects.archivedAt),
      ),
    )
    .returning();

  if (!row) {
    throw new AppError("NOT_FOUND");
  }

  return row;
}

// Saves the key only if the project has none, so concurrent first uses can't
// leave the site's key file pointing at a key that was overwritten.
async function setIndexNowKeyIfMissing(
  projectId: string,
  organizationId: string,
  key: string,
) {
  await db
    .update(projects)
    .set({ indexnowKey: key })
    .where(
      and(
        eq(projects.id, projectId),
        eq(projects.organizationId, organizationId),
        isNull(projects.indexnowKey),
      ),
    );
}

async function tryCreateDefaultProject(organizationId: string) {
  const id = crypto.randomUUID();
  const inserted = await db
    .insert(projects)
    .values({
      id,
      organizationId,
      name: "Default",
      domain: null,
    })
    .onConflictDoNothing()
    .returning({ id: projects.id });
  return inserted.length > 0 ? id : null;
}

async function listArchivedProjects(organizationId: string) {
  return db.query.projects.findMany({
    where: and(
      eq(projects.organizationId, organizationId),
      isNotNull(projects.archivedAt),
    ),
    orderBy: [desc(projects.archivedAt), desc(projects.id)],
  });
}

async function restoreProject(projectId: string, organizationId: string) {
  const [row] = await db
    .update(projects)
    .set({ archivedAt: null })
    .where(
      and(
        eq(projects.id, projectId),
        eq(projects.organizationId, organizationId),
        isNotNull(projects.archivedAt),
      ),
    )
    .returning({ id: projects.id });

  if (!row) {
    throw new AppError("NOT_FOUND");
  }
}

async function archiveProject(projectId: string, organizationId: string) {
  const [row] = await db
    .update(projects)
    .set({ archivedAt: sql`(current_timestamp)` })
    .where(
      and(
        eq(projects.id, projectId),
        eq(projects.organizationId, organizationId),
        isNull(projects.archivedAt),
      ),
    )
    .returning({ id: projects.id });

  if (!row) {
    throw new AppError("NOT_FOUND");
  }
}

export const ProjectRepository = {
  listProjects,
  listArchivedProjects,
  countProjects,
  getProjectForOrganization,
  getProjectForMember,
  setClientTeam,
  listProjectsForClient,
  getArchivedProjectForOrganization,
  getProjectById,
  createProject,
  updateProject,
  updateProjectWebsite,
  setIndexNowKeyIfMissing,
  tryCreateDefaultProject,
  archiveProject,
  restoreProject,
} as const;
