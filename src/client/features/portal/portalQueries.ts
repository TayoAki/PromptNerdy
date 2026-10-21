import { queryOptions } from "@tanstack/react-query";
import { getPortalHome, listPortalReports } from "@/serverFunctions/portal";

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
