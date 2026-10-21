import { getRequest } from "@tanstack/react-start/server";
import { APIError } from "better-auth/api";
import { getAuth, getHostedBaseUrl } from "@/lib/auth";
import type { EnsuredUserContext } from "@/middleware/ensure-user/types";
import { consumeInvitationSendBudget } from "@/server/auth/invitation-send-limit";
import { AuthRepository } from "@/server/auth/repositories/AuthRepository";
import {
  isInvitationEmailConfigured,
  sendHostedInvitationEmail,
} from "@/server/email/loops";
import { AppError } from "@/server/lib/errors";

// Invite (or re-invite) a teammate or a client contact. better-auth creates the
// pending invitation — its server-side checks (inviter must be a member with
// invite permission, the role/team shape in beforeCreateInvitation, the
// 20-pending cap) all still run — but the email is sent here rather than via
// the plugin's sendInvitationEmail callback: better-auth swallows throws from
// that callback, so a failed send would still read as "sent". Here it fails
// the call. resend: true re-mails an existing pending invitation with the same
// link and a refreshed expiry. Without an email provider the link is returned
// for the inviter to share. The caller checks invitation:create first.
export async function createAndDeliverInvitation(
  context: EnsuredUserContext,
  invitee: { email: string; role: "admin" | "client"; teamId?: string },
) {
  await consumeInvitationSendBudget(context.organizationId, invitee.email);

  const invitation = await getAuth()
    .api.createInvitation({
      headers: getRequest().headers,
      body: {
        email: invitee.email,
        role: invitee.role,
        resend: true,
        ...(invitee.teamId ? { teamId: invitee.teamId } : {}),
        // Bind the invitation to the request's resolved org, not the session's
        // active-organization hint, which can be stale after a switch.
        organizationId: context.organizationId,
      },
    })
    .catch((error: unknown) => {
      // The invite dialog shows this one inline, next to the email.
      if (
        error instanceof APIError &&
        error.body?.code === "USER_IS_ALREADY_A_MEMBER_OF_THIS_ORGANIZATION"
      ) {
        throw new AppError("CONFLICT");
      }
      throw error;
    });

  const inviteUrl = `${getHostedBaseUrl()}/accept-invitation/${invitation.id}`;
  if (!isInvitationEmailConfigured()) {
    return { invitationId: invitation.id, inviteUrl, emailed: false };
  }

  const [inviter, memberships] = await Promise.all([
    AuthRepository.getHostedUser(context.userId),
    AuthRepository.listMembershipsForUser(context.userId),
  ]);
  const organizationName =
    memberships.find(
      (membership) => membership.organizationId === context.organizationId,
    )?.organizationName ?? "Organization";

  try {
    await sendHostedInvitationEmail({
      email: invitee.email,
      inviteUrl,
      organizationName,
      inviterName: inviter?.name?.trim() || context.userEmail,
      inviterEmail: context.userEmail,
    });
  } catch (error) {
    // The invitation row exists and stays pending — surface the send
    // failure so the inviter retries instead of assuming it landed.
    console.error("Invitation email send failed:", error);
    throw new AppError("UPSTREAM_UNAVAILABLE");
  }

  return { invitationId: invitation.id, inviteUrl, emailed: true };
}
