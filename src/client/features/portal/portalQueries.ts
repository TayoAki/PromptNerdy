import { queryOptions } from "@tanstack/react-query";
import {
  getPortalHome,
  getPortalOverview,
  getPortalRankings,
  getPortalSiteHealth,
  listPortalReports,
} from "@/serverFunctions/portal";

export const portalHomeQueryOptions = () =>
  queryOptions({
    queryKey: ["portal-home"],
    queryFn: () => getPortalHome(),
  });

export const portalReportsQueryOptions = (clientId: string) =>
  queryOptions({
    queryKey: ["portal-reports", clientId],
    queryFn: () => listPortalReports({ data: { clientId } }),
  });

export const portalOverviewQueryOptions = (clientId: string) =>
  queryOptions({
    queryKey: ["portal-overview", clientId],
    queryFn: () => getPortalOverview({ data: { clientId } }),
  });

export const portalRankingsQueryOptions = (clientId: string) =>
  queryOptions({
    queryKey: ["portal-rankings", clientId],
    queryFn: () => getPortalRankings({ data: { clientId } }),
  });

export const portalSiteHealthQueryOptions = (clientId: string) =>
  queryOptions({
    queryKey: ["portal-site-health", clientId],
    queryFn: () => getPortalSiteHealth({ data: { clientId } }),
  });

export type PortalOverview = Awaited<ReturnType<typeof getPortalOverview>>;
export type PortalRankings = Awaited<ReturnType<typeof getPortalRankings>>;
