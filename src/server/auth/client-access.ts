import { APIError } from "better-auth/api";
import { isClientRole } from "@/lib/org-permissions";
import { AuthRepository } from "@/server/auth/repositories/AuthRepository";

// Better Auth endpoints a client contact (spec 0017) may call. Every other
// organization endpoint either reads org-wide data (members, invitations,
// teams: other clients' contacts) or manages the org, and the plugin checks
// no permission on the reads, so anything not listed is refused. Their own
// session, profile and password endpoints are outside these prefixes.
const CLIENT_ALLOWED_PATHS = new Set([
  "/organization/accept-invitation",
  "/organization/reject-invitation",
  "/organization/get-invitation",
  "/organization/list-user-invitations",
  "/organization/list",
  "/organization/set-active",
  "/organization/get-active-member",
  "/organization/list-user-teams",
  "/organization/set-active-team",
  "/organization/has-permission",
  "/organization/leave",
]);

/** True when a client-role caller must be refused this Better Auth path. */
export function isPathClosedToClients(path: string) {
  return (
    (path.startsWith("/organization/") || path.startsWith("/api-key/")) &&
    !CLIENT_ALLOWED_PATHS.has(path)
  );
}

// Staff invitations carry no team; a client invitation names exactly one
// client team. Anything else is refused before the invitation row exists.
export function assertInvitationShape(invitation: {
  role: string;
  teamIds?: string[];
}) {
  const teamCount = invitation.teamIds?.length ?? 0;
  if (invitation.role === "admin" && teamCount === 0) return;
  if (invitation.role === "client" && teamCount === 1) return;
  throw new APIError("BAD_REQUEST", {
    message:
      invitation.role === "client"
        ? "A client invitation must name one client."
        : "Teammates can only be invited as admins.",
  });
}

function readString(source: unknown, key: string) {
  if (!source || typeof source !== "object") return null;
  const value: unknown = Reflect.get(source, key);
  return typeof value === "string" && value ? value : null;
}

// Before-hook for every Better Auth endpoint: refuses a closed path when the
// caller is a client in the organization the request targets (the explicit
// organizationId or slug, else the session's active organization). Calls
// without a session are server-side system actions and pass through.
export async function refuseClientCaller(
  request: { path: string; body?: unknown; query?: unknown },
  session: {
    user: { id: string };
    session: { activeOrganizationId?: string | null };
  } | null,
) {
  if (!session || !isPathClosedToClients(request.path)) return;
  const slug =
    readString(request.query, "organizationSlug") ??
    readString(request.body, "organizationSlug");
  const organizationId =
    readString(request.body, "organizationId") ??
    readString(request.query, "organizationId") ??
    (slug ? await AuthRepository.getOrganizationIdBySlug(slug) : null) ??
    session.session.activeOrganizationId;
  if (!organizationId) return;
  const membership = await AuthRepository.getMembership(
    session.user.id,
    organizationId,
  );
  if (membership && isClientRole(membership.role)) {
    throw new APIError("FORBIDDEN", {
      message: "This isn't available to client accounts.",
    });
  }
}
