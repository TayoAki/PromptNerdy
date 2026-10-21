import { createClient, type Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { afterAll, beforeAll, expect, it, vi } from "vitest";
import type * as ClientRepositoryModule from "./ClientRepository";

vi.mock("cloudflare:workers", () => ({ env: { DATABASE_PROVIDER: "d1" } }));

let client: Client;
let ClientRepository: typeof ClientRepositoryModule.ClientRepository;

const daysAgo = (days: number) =>
  new Date(Date.now() - days * 86400_000).toISOString();

beforeAll(async () => {
  client = createClient({ url: "file::memory:" });
  // Load the real repository after installing the in-memory database.
  vi.doMock("@/db", () => ({ db: drizzle(client) }));
  await client.executeMultiple(`
    CREATE TABLE projects (id TEXT PRIMARY KEY, client_team_id TEXT);
    CREATE TABLE usage_events (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL,
      project_id TEXT,
      cost_usd REAL NOT NULL,
      created_at TEXT NOT NULL
    );
    INSERT INTO projects (id, client_team_id) VALUES
      ('acme-site', 'team-acme'),
      ('agency-site', NULL);
    INSERT INTO usage_events (id, organization_id, project_id, cost_usd, created_at) VALUES
      ('u1', 'agency', 'acme-site', 1.0, '${daysAgo(1)}'),
      ('u2', 'agency', 'acme-site', 0.5, '${daysAgo(29)}'),
      ('u3', 'agency', 'acme-site', 9.0, '${daysAgo(40)}'),
      ('u4', 'agency', 'agency-site', 2.0, '${daysAgo(2)}'),
      ('u5', 'agency', NULL, 0.25, '${daysAgo(3)}'),
      ('u6', 'another-agency', 'acme-site', 5.0, '${daysAgo(1)}');
  `);
  ({ ClientRepository } = await import("./ClientRepository"));
});

afterAll(() => {
  client.close();
});

it("sums recent cost per client, with the agency's own work as the null group", async () => {
  const rows = await ClientRepository.sumUsageByClient("agency", daysAgo(30));

  expect(rows).toEqual(
    expect.arrayContaining([
      { clientId: "team-acme", costUsd: 1.5 },
      { clientId: null, costUsd: 2.25 },
    ]),
  );
  expect(rows).toHaveLength(2);
});
