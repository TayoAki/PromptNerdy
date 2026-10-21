import { sort } from "remeda";
import { z } from "zod";
import { AuditRepository } from "@/server/features/audit/repositories/AuditRepository";
import { getIssueTypePageCountsForAudit } from "@/server/features/audit/repositories/auditSummaryQueries";
import { DashboardCacheService } from "@/server/features/dashboard/services/DashboardCacheService";
import { GscConnectionRepository } from "@/server/features/gsc/repositories/GscConnectionRepository";
import {
  GscNotConnectedError,
  GscService,
  isExpectedGrantFailure,
} from "@/server/features/gsc/services/GscService";
import { resolveDateRange } from "@/server/features/gsc/searchAnalytics";
import {
  previousPeriod,
  sumSearchTotals,
} from "@/server/features/gsc/searchPerformanceReport";
import { RankTrackingRepository } from "@/server/features/rank-tracking/repositories/RankTrackingRepository";
import { getLatestResults } from "@/server/features/rank-tracking/services/rankTrackingResults";
import {
  getIssueDescriptor,
  ISSUE_SEVERITY_ORDER,
} from "@/shared/audit-issues";
import {
  formatLocationLabel,
  LOCATION_OPTIONS,
} from "@/shared/keyword-locations";
import { defaultComparePeriod } from "@/shared/rank-tracking";
import { safeHostname } from "@/shared/safe-url";
import type { RankTrackingDeviceResult } from "@/types/schemas/rank-tracking";

// What the client portal shows for one client website (spec 0017). Each read
// is stored data or free Search Console data, never a paid provider call, so
// a client contact opening the portal can't spend the agency's credits.

type PortalSite = { id: string; domain: string | null };
type Device = "desktop" | "mobile";

const searchTotalsSchema = z
  .object({
    startDate: z.string(),
    endDate: z.string(),
    clicks: z.number(),
    impressions: z.number(),
    previousClicks: z.number(),
    previousImpressions: z.number(),
  })
  .nullable();

// Clicks and impressions for the last 28 days against the 28 before, cached
// for a day like the dashboard's Search Console cards. Null when the site has
// no working Search Console connection.
async function getSearchTotals(site: PortalSite, organizationId: string) {
  const connection = await GscConnectionRepository.getByProjectId(site.id);
  if (!connection) return null;
  const result = await DashboardCacheService.readThrough({
    namespace: DashboardCacheService.gscNamespace(site.id, "portal-totals"),
    organizationId,
    params: {
      projectId: site.id,
      siteUrl: connection.siteUrl,
      accountId: connection.gscAccountId,
      updatedAt: connection.updatedAt,
    },
    schema: searchTotalsSchema,
    maxAgeMs: 86400_000,
    load: async () => {
      const { startDate, endDate } = resolveDateRange({
        dateRange: "last_28_days",
      });
      const previous = previousPeriod(startDate, endDate);
      try {
        const [current, prior] = await Promise.all([
          GscService.getPerformance({
            projectId: site.id,
            startDate,
            endDate,
            dimensions: ["date"],
          }),
          GscService.getPerformance({
            projectId: site.id,
            ...previous,
            dimensions: ["date"],
          }),
        ]);
        const now = sumSearchTotals(current.rows);
        const before = sumSearchTotals(prior.rows);
        return {
          startDate,
          endDate,
          clicks: now.clicks,
          impressions: now.impressions,
          previousClicks: before.clicks,
          previousImpressions: before.impressions,
        };
      } catch (error) {
        if (
          error instanceof GscNotConnectedError ||
          isExpectedGrantFailure(error)
        )
          return null;
        throw error;
      }
    },
  });
  return result.value && { ...result.value, fetchedAt: result.fetchedAt };
}

function toPortalPosition(result: RankTrackingDeviceResult) {
  return {
    position: result.position,
    previousPosition: result.previousPosition,
    rankingUrl: result.rankingUrl,
  };
}

// The site's own rank trackers. Trackers on other domains in the project
// follow competitors, which is the agency's working data, not the client's.
async function getRankings(site: PortalSite) {
  if (!site.domain) return [];
  const domain = site.domain.replace(/^www\./, "");
  const configs = (
    await RankTrackingRepository.getConfigsForProject(site.id)
  ).filter((config) => config.domain === domain);

  return Promise.all(
    configs.map(async (config) => {
      const comparePeriod = defaultComparePeriod(config.scheduleInterval);
      const { rows, run } = await getLatestResults(
        config.id,
        site.id,
        comparePeriod,
      );
      const devices: Device[] =
        config.devices === "both" ? ["desktop", "mobile"] : [config.devices];
      const keywords = rows.map((row) => ({
        keyword: row.keyword,
        desktop: toPortalPosition(row.desktop),
        mobile: toPortalPosition(row.mobile),
      }));
      const primary = devices[0];
      return {
        id: config.id,
        location: config.locationName
          ? formatLocationLabel(config.locationName, 2)
          : (LOCATION_OPTIONS.find(
              (option) => option.code === config.locationCode,
            )?.label ?? null),
        devices,
        comparePeriod,
        lastCheckedAt: run?.lastCheckedAt ?? null,
        // Best ranked first; keywords not yet in the results go last.
        keywords: sort(
          keywords,
          (a, b) =>
            (a[primary].position ?? Infinity) -
              (b[primary].position ?? Infinity) ||
            a.keyword.localeCompare(b.keyword),
        ),
      };
    }),
  );
}

// These describe the crawl rather than the site: the agency's to sort out
// before an audit means anything, and noise to a client.
const CRAWL_LIMIT_ISSUES = new Set([
  "blocked-page",
  "rate-limited-page",
  "crawl-rate-limited",
  "javascript-rendering-suspected",
]);

// The latest finished audit of the site's own domain, as issue counts.
async function getHealth(site: PortalSite) {
  const hostname = site.domain ? safeHostname(`https://${site.domain}`) : null;
  if (!hostname) return null;
  const audit = (await AuditRepository.getAuditsByProject(site.id)).find(
    (candidate) =>
      candidate.status === "completed" &&
      safeHostname(candidate.startUrl) === hostname,
  );
  if (!audit?.completedAt) return null;

  const [issueRows, blockedPages] = await Promise.all([
    getIssueTypePageCountsForAudit(audit.id),
    AuditRepository.countPagesByFetchClass(audit.id, "blocked"),
  ]);
  // A crawl the site mostly turned away says nothing about its health.
  if (blockedPages * 2 >= audit.pagesCrawled) return null;

  const issues = sort(
    issueRows
      .filter((row) => !CRAWL_LIMIT_ISSUES.has(row.issueType))
      .map((row) => ({
        issueType: row.issueType,
        title: getIssueDescriptor(row.issueType)?.title ?? row.issueType,
        severity: row.severity,
        pages: row.pages,
      })),
    (a, b) =>
      ISSUE_SEVERITY_ORDER[a.severity] - ISSUE_SEVERITY_ORDER[b.severity] ||
      b.pages - a.pages,
  );
  const countOf = (severity: string) =>
    issues.filter((issue) => issue.severity === severity).length;

  return {
    scannedAt: audit.completedAt,
    pagesScanned: audit.pagesCrawled,
    critical: countOf("critical"),
    warning: countOf("warning"),
    info: countOf("info"),
    issues,
  };
}

export const PortalSiteReads = { getSearchTotals, getRankings, getHealth };
