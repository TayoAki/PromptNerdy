import { env } from "cloudflare:workers";
import { AuthRepository } from "@/server/auth/repositories/AuthRepository";
import { isBillingEnabled } from "@/server/billing/billing-mode";

function allowedSignupEmails() {
  const value: unknown = Reflect.get(env, "SIGNUP_ALLOWED_EMAILS");
  if (typeof value !== "string") return [];
  return value
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

// With billing off nothing caps what an account can spend on the operator's
// DataForSEO key, so sign-up is invite-only: a pending invitation, or an
// address in SIGNUP_ALLOWED_EMAILS (how the first accounts get in).
export async function canCreateAccount(email: string) {
  if (await isBillingEnabled()) return true;
  if (allowedSignupEmails().includes(email.trim().toLowerCase())) return true;
  return AuthRepository.hasPendingInvitationForEmail(email);
}
