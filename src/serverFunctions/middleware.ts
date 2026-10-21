import { createMiddleware } from "@tanstack/react-start";
import { z } from "zod";
import { AppError } from "@/server/lib/errors";
import { errorHandlingMiddleware } from "@/middleware/errorHandling";
import type { EnsuredUserContext } from "@/middleware/ensure-user/types";
import { ensureUserMiddleware } from "@/middleware/ensureUser";
import { isClientRole } from "@/lib/org-permissions";

const ensuredUserContextSchema: z.ZodType<EnsuredUserContext> = z.object({
  userId: z.string(),
  userEmail: z.string(),
  emailVerified: z.boolean(),
  organizationId: z.string(),
  role: z.string(),
  project: z.any().optional(),
});

function getAuthenticatedContext(context: unknown): EnsuredUserContext {
  const result = ensuredUserContextSchema.safeParse(context);
  if (!result.success) {
    throw new AppError(
      "INTERNAL_ERROR",
      "Authenticated server function context missing",
    );
  }
  return result.data;
}

export const globalServerFunctionMiddleware = [
  errorHandlingMiddleware,
  ensureUserMiddleware,
] as const;

// Client contacts (spec 0017) are denied every app server function by default;
// the portal's functions use requirePortalContext instead.
function getStaffContext(context: unknown): EnsuredUserContext {
  const authenticatedContext = getAuthenticatedContext(context);
  if (isClientRole(authenticatedContext.role)) {
    throw new AppError("FORBIDDEN");
  }
  return authenticatedContext;
}

export const requireAuthenticatedContext = [
  createMiddleware({ type: "function" }).server(async ({ next, context }) => {
    const authenticatedContext = getStaffContext(context);

    return next({
      context: authenticatedContext,
    });
  }),
] as const;

export const requireProjectContext = [
  createMiddleware({ type: "function" }).server(async ({ next, context }) => {
    const authenticatedContext = getStaffContext(context);

    if (!authenticatedContext.project) {
      throw new AppError(
        "INTERNAL_ERROR",
        "Project context missing from authenticated server function",
      );
    }

    return next({
      context: {
        ...authenticatedContext,
        project: authenticatedContext.project,
        projectId: authenticatedContext.project.id,
      },
    });
  }),
] as const;

// Admits client contacts as well as staff, for the portal's read-only server
// functions. Every portal query must scope to the caller's client teams.
export const requirePortalContext = [
  createMiddleware({ type: "function" }).server(async ({ next, context }) => {
    return next({ context: getAuthenticatedContext(context) });
  }),
] as const;
