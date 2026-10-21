import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { isClientRole } from "@/lib/org-permissions";
import { PortalService } from "@/server/features/clients/services/PortalService";
import { requirePortalContext } from "@/serverFunctions/middleware";

// The client portal's server functions (spec 0017). requirePortalContext is
// the only middleware that admits client contacts; every handler here scopes
// through PortalService.

// Lets the app shell send a client contact to the portal before it calls any
// server function the contact would be refused.
export const getPortalViewer = createServerFn({ method: "GET" })
  .middleware(requirePortalContext)
  .handler(({ context }) => ({ isClient: isClientRole(context.role) }));

export const getPortalHome = createServerFn({ method: "GET" })
  .middleware(requirePortalContext)
  .handler(({ context }) => PortalService.getHome(context));

const clientInputSchema = z.object({ clientId: z.string().min(1) });

export const listPortalReports = createServerFn({ method: "GET" })
  .middleware(requirePortalContext)
  .validator(clientInputSchema)
  .handler(({ data, context }) =>
    PortalService.listReports(context, data.clientId),
  );

export const getPortalOverview = createServerFn({ method: "GET" })
  .middleware(requirePortalContext)
  .validator(clientInputSchema)
  .handler(({ data, context }) =>
    PortalService.getOverview(context, data.clientId),
  );

export const getPortalRankings = createServerFn({ method: "GET" })
  .middleware(requirePortalContext)
  .validator(clientInputSchema)
  .handler(({ data, context }) =>
    PortalService.getRankings(context, data.clientId),
  );

export const getPortalSiteHealth = createServerFn({ method: "GET" })
  .middleware(requirePortalContext)
  .validator(clientInputSchema)
  .handler(({ data, context }) =>
    PortalService.getSiteHealth(context, data.clientId),
  );
