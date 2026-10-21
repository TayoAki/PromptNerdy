import { sort } from "remeda";
import { isClientRole } from "@/lib/org-permissions";
import type { EnsuredUserContext } from "@/middleware/ensure-user/types";
import { AuthRepository } from "@/server/auth/repositories/AuthRepository";
import { ClientRepository } from "@/server/features/clients/repositories/ClientRepository";
import { ProjectRepository } from "@/server/features/projects/repositories/ProjectRepository";
import { ReportRepository } from "@/server/features/reports/repositories/ReportRepository";
import { AppError } from "@/server/lib/errors";
import { PortalSiteReads } from "./portalSiteReads";

// The client portal's reads (spec 0017). Every one scopes to the clients the
// caller may see: a contact's own clients, or every client for agency staff
// previewing the portal. Stored data and free Search Console reads only:
// nothing here calls a paid provider.

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

async function requireVisibleClient(
  context: EnsuredUserContext,
  clientId: string,
) {
  const clients = await listVisibleClients(context);
  const client = clients.find((candidate) => candidate.id === clientId);
  if (!client) throw new AppError("NOT_FOUND");
  return client;
}

// The client's websites, after the caller is confirmed to see the client.
async function listClientSites(context: EnsuredUserContext, clientId: string) {
  const client = await requireVisibleClient(context, clientId);
  return ProjectRepository.listProjectsForClient(
    client.id,
    context.organizationId,
  );
}

async function listReports(context: EnsuredUserContext, clientId: string) {
  const client = await requireVisibleClient(context, clientId);
  return {
    client,
    reports: await ReportRepository.listClientVisibleReports(
      clientId,
      context.organizationId,
    ),
  };
}

type Trackers = Awaited<ReturnType<typeof PortalSiteReads.getRankings>>;

// Movement on each tracker's first device, so a keyword tracked on desktop
// and mobile counts once.
function summarizeRankings(trackers: Trackers) {
  const summary = { tracked: 0, top10: 0, improved: 0, declined: 0 };
  const gains: { keyword: string; position: number; gain: number }[] = [];
  for (const tracker of trackers) {
    for (const keyword of tracker.keywords) {
      const { position, previousPosition } = keyword[tracker.devices[0]];
      summary.tracked += 1;
      if (position !== null && position <= 10) summary.top10 += 1;
      if (position === null) {
        if (previousPosition !== null) summary.declined += 1;
      } else if (previousPosition === null || position < previousPosition) {
        summary.improved += 1;
        if (previousPosition !== null) {
          gains.push({
            keyword: keyword.keyword,
            position,
            gain: previousPosition - position,
          });
        }
      } else if (position > previousPosition) {
        summary.declined += 1;
      }
    }
  }
  // Rank timestamps share one format, so the string order is time order.
  const lastCheckedAt = trackers.reduce<string | null>(
    (latest, tracker) =>
      tracker.lastCheckedAt && (!latest || tracker.lastCheckedAt > latest)
        ? tracker.lastCheckedAt
        : latest,
    null,
  );
  return {
    ...summary,
    lastCheckedAt,
    topGains: sort(gains, (a, b) => b.gain - a.gain).slice(0, 3),
  };
}

// One Search Console fault shouldn't blank the client's whole overview; the
// site shows as having no search data until the next successful read.
async function readSearchTotals(
  site: { id: string; domain: string | null },
  organizationId: string,
) {
  try {
    return await PortalSiteReads.getSearchTotals(site, organizationId);
  } catch (error) {
    console.error("portal.search-totals failed:", error);
    return null;
  }
}

async function getOverview(context: EnsuredUserContext, clientId: string) {
  const sites = await listClientSites(context, clientId);
  return {
    sites: await Promise.all(
      sites.map(async (site) => {
        const [search, trackers, health] = await Promise.all([
          readSearchTotals(site, context.organizationId),
          PortalSiteReads.getRankings(site),
          PortalSiteReads.getHealth(site),
        ]);
        return {
          ...site,
          search,
          rankings: trackers.length > 0 ? summarizeRankings(trackers) : null,
          health,
        };
      }),
    ),
  };
}

async function getRankings(context: EnsuredUserContext, clientId: string) {
  const sites = await listClientSites(context, clientId);
  return {
    sites: await Promise.all(
      sites.map(async (site) => ({
        ...site,
        trackers: await PortalSiteReads.getRankings(site),
      })),
    ),
  };
}

async function getSiteHealth(context: EnsuredUserContext, clientId: string) {
  const sites = await listClientSites(context, clientId);
  return {
    sites: await Promise.all(
      sites.map(async (site) => ({
        ...site,
        health: await PortalSiteReads.getHealth(site),
      })),
    ),
  };
}

export const PortalService = {
  getHome,
  listReports,
  getOverview,
  getRankings,
  getSiteHealth,
} as const;
