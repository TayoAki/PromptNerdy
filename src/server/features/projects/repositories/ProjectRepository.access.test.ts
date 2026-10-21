import { createClient, type Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type * as ProjectRepositoryModule from "./ProjectRepository";

vi.mock("cloudflare:workers", () => ({ env: { DATABASE_PROVIDER: "d1" } }));

let client: Client;
let ProjectRepository: typeof ProjectRepositoryModule.ProjectRepository;

beforeAll(async () => {
  client = createClient({ url: "file::memory:" });
  // Load the real repository after installing the in-memory database.
  vi.doMock("@/db", () => ({ db: drizzle(client) }));
  await client.executeMultiple(`
    CREATE TABLE projects (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL,
      name TEXT NOT NULL,
      domain TEXT,
      location_code INTEGER NOT NULL DEFAULT 2840,
      language_code TEXT NOT NULL DEFAULT 'en',
      created_at TEXT NOT NULL DEFAULT (current_timestamp),
      archived_at TEXT,
      ai_research_keywords TEXT,
      indexnow_key TEXT,
      client_team_id TEXT
    );
    CREATE TABLE team_member (
      id TEXT PRIMARY KEY,
      team_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      created_at INTEGER
    );
    INSERT INTO projects (id, organization_id, name, client_team_id) VALUES
      ('acme-site', 'agency', 'Acme', 'team-acme'),
      ('other-site', 'agency', 'Other client', 'team-other'),
      ('internal', 'agency', 'Agency site', NULL),
      ('foreign', 'another-agency', 'Foreign', 'team-acme');
    INSERT INTO team_member (id, team_id, user_id) VALUES
      ('tm-1', 'team-acme', 'acme-contact');
  `);
  ({ ProjectRepository } = await import("./ProjectRepository"));
});

afterAll(() => {
  client.close();
});

const staff = { organizationId: "agency", userId: "staff-1", role: "admin" };
const contact = {
  organizationId: "agency",
  userId: "acme-contact",
  role: "client",
};

describe("getProjectForMember", () => {
  it.each([
    ["staff, any project in the organization", staff, "other-site", true],
    ["staff, an agency-internal project", staff, "internal", true],
    ["a contact, their own client's project", contact, "acme-site", true],
    ["a contact, another client's project", contact, "other-site", false],
    ["a contact, an agency-internal project", contact, "internal", false],
    ["a contact, another organization's project", contact, "foreign", false],
  ])("%s", async (_case, caller, projectId, visible) => {
    const project = await ProjectRepository.getProjectForMember(
      projectId,
      caller,
    );
    expect(project?.id ?? null).toBe(visible ? projectId : null);
  });
});
