import { AuthRepository } from "@/server/auth/repositories/AuthRepository";
import { isBillingEnabled } from "@/server/billing/billing-mode";
import { getOptionalEnvValue } from "@/server/lib/runtime-env";

async function isAllowlisted(email: string) {
  const value = (await getOptionalEnvValue("SIGNUP_ALLOWED_EMAILS")) ?? "";
  return value
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .includes(email.trim().toLowerCase());
}

// With billing off nothing caps what an account can spend on the operator's
// DataForSEO key, so sign-up is invite-only: a pending invitation, or an
// address in SIGNUP_ALLOWED_EMAILS (how the first accounts get in).
export async function canCreateAccount(email: string) {
  if (await isBillingEnabled()) return true;
  if (await isAllowlisted(email)) return true;
  return AuthRepository.hasPendingInvitationForEmail(email);
}

// The same allowance minus the invitation clause: an invited person joins the
// inviter's workspace instead of founding one, so they can't get a workspace
// of their own (and unmetered research) by never accepting.
export async function canFoundOrganization(email: string) {
  if (await isBillingEnabled()) return true;
  return isAllowlisted(email);
}
