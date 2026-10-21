import { env } from "cloudflare:workers";
import { createFileRoute } from "@tanstack/react-router";
import { resolveUserContextFromHeaders } from "@/middleware/ensure-user/resolve";
import { AuthRepository } from "@/server/auth/repositories/AuthRepository";
import { organizationLogoKey } from "@/server/features/clients/organizationLogo";
import { asAppError } from "@/server/lib/errors";

// An agency's logo, for its own staff and client contacts only. One answer
// for "no logo" and "not your agency", so organization ids can't be probed.
const notFound = () => new Response("Not found", { status: 404 });

export async function handleLogoRequest(
  organizationId: string,
  request: Request,
) {
  let context;
  try {
    context = await resolveUserContextFromHeaders(request.headers);
  } catch (error) {
    if (asAppError(error)?.code === "UNAUTHENTICATED") return notFound();
    throw error;
  }
  const membership = await AuthRepository.getMembership(
    context.userId,
    organizationId,
  );
  if (!membership) return notFound();

  const logo = await env.R2.get(organizationLogoKey(organizationId));
  if (!logo) return notFound();
  return new Response(logo.body, {
    headers: {
      "Content-Type":
        logo.httpMetadata?.contentType ?? "application/octet-stream",
      "Cache-Control": "private, max-age=86400",
      "Content-Security-Policy": "default-src 'none'",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export const Route = createFileRoute("/api/organization-logo/$organizationId")({
  server: {
    handlers: {
      GET: ({ params, request }) =>
        handleLogoRequest(params.organizationId, request),
    },
  },
});
