import { beforeEach, describe, expect, it, vi } from "vitest";
import { PortalService } from "./PortalService";

const repository = vi.hoisted(() => ({
  clientsForContact: vi.fn(),
  sites: vi.fn(),
  trackers: vi.fn(),
  latestResults: vi.fn(),
  audits: vi.fn(),
  blockedPages: vi.fn(),
  issues: vi.fn(),
}));

vi.mock("@/server/auth/repositories/AuthRepository", () => ({
  AuthRepository: {},
}));
vi.mock("@/server/features/reports/repositories/ReportRepository", () => ({
  ReportRepository: { listClientVisibleReports: async () => [] },
}));
vi.mock("@/server/features/clients/repositories/ClientRepository", () => ({
  ClientRepository: { listClientsForContact: repository.clientsForContact },
}));
vi.mock("@/server/features/projects/repositories/ProjectRepository", () => ({
  ProjectRepository: { listProjectsForClient: repository.sites },
}));
vi.mock("@/server/features/gsc/repositories/GscConnectionRepository", () => ({
  GscConnectionRepository: { getByProjectId: async () => null },
}));
vi.mock("@/server/features/gsc/services/GscService", async () => ({
  ...(await import("@/server/lib/gscErrors")),
  GscService: {},
}));
vi.mock("@/server/features/dashboard/services/DashboardCacheService", () => ({
  DashboardCacheService: {},
}));
vi.mock(
  "@/server/features/rank-tracking/repositories/RankTrackingRepository",
  () => ({
    RankTrackingRepository: { getConfigsForProject: repository.trackers },
  }),
);
vi.mock("@/server/features/rank-tracking/services/rankTrackingResults", () => ({
  getLatestResults: repository.latestResults,
}));
vi.mock("@/server/features/audit/repositories/AuditRepository", () => ({
  AuditRepository: {
    getAuditsByProject: repository.audits,
    countPagesByFetchClass: repository.blockedPages,
  },
}));
vi.mock("@/server/features/audit/repositories/auditSummaryQueries", () => ({
  getIssueTypePageCountsForAudit: repository.issues,
}));

const contact = {
  userId: "acme-contact",
  userEmail: "contact@acme.test",
  emailVerified: true,
  organizationId: "agency",
  role: "client",
};
const acme = { id: "team-acme", name: "Acme" };

const tracker = (id: string, domain: string) => ({
  id,
  domain,
  devices: "both",
  scheduleInterval: "weekly",
  locationName: null,
  locationCode: 2840,
});

const device = (position: number | null, previousPosition: number | null) => ({
  position,
  previousPosition,
  rankingUrl: null,
  serpFeatures: [],
});

const keyword = (
  name: string,
  desktop: ReturnType<typeof device>,
  mobile = device(null, null),
) => ({ keyword: name, desktop, mobile });

const completedAudit = {
  id: "audit",
  status: "completed",
  startUrl: "https://www.acme.com/",
  completedAt: "2026-10-01T00:00:00.000Z",
  pagesCrawled: 10,
};

beforeEach(() => {
  repository.clientsForContact.mockResolvedValue([acme]);
  repository.sites.mockResolvedValue([
    { id: "acme-site", name: "Acme", domain: "www.acme.com" },
  ]);
  repository.trackers.mockResolvedValue([]);
  repository.latestResults.mockResolvedValue({ rows: [], run: null });
  repository.audits.mockResolvedValue([completedAudit]);
  repository.blockedPages.mockResolvedValue(0);
  repository.issues.mockResolvedValue([]);
});

describe("PortalService", () => {
  it.each([
    "listReports",
    "getOverview",
    "getRankings",
    "getSiteHealth",
  ] as const)("%s refuses a client the contact isn't on", async (read) => {
    await expect(
      PortalService[read](contact, "team-other"),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("shows only the site's own rank trackers, not competitors'", async () => {
    repository.trackers.mockResolvedValue([
      tracker("own", "acme.com"),
      tracker("competitor", "rival.com"),
    ]);

    const { sites } = await PortalService.getRankings(contact, acme.id);

    expect(sites[0].trackers.map((entry) => entry.id)).toEqual(["own"]);
  });

  it("counts each keyword's movement once, including new and dropped", async () => {
    repository.trackers.mockResolvedValue([tracker("own", "acme.com")]);
    repository.latestResults.mockResolvedValue({
      run: null,
      rows: [
        // Mobile fell, but each keyword counts on the first tracked device.
        keyword("plumber", device(3, 8), device(9, 2)),
        keyword("drain", device(5, null)),
        keyword("boiler", device(null, 4)),
        keyword("heater", device(12, 12)),
      ],
    });

    const { sites } = await PortalService.getOverview(contact, acme.id);

    expect(sites[0].rankings).toMatchObject({
      tracked: 4,
      top10: 2,
      improved: 2,
      declined: 1,
      topGains: [{ keyword: "plumber", position: 3, gain: 5 }],
    });
  });

  it("leaves crawl problems out of site health", async () => {
    repository.blockedPages.mockResolvedValue(1);
    repository.issues.mockResolvedValue([
      { issueType: "blocked-page", severity: "critical", pages: 1 },
      { issueType: "broken-internal-link", severity: "critical", pages: 4 },
    ]);

    const { sites } = await PortalService.getSiteHealth(contact, acme.id);

    expect(sites[0].health).toMatchObject({
      critical: 1,
      issues: [{ issueType: "broken-internal-link", pages: 4 }],
    });
  });

  it("shows no health for a scan the site mostly blocked", async () => {
    repository.blockedPages.mockResolvedValue(6);

    const { sites } = await PortalService.getSiteHealth(contact, acme.id);

    expect(sites[0].health).toBeNull();
  });
});
