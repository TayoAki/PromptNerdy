import {
  getOptionalEnvValue,
  isHostedServerAuthMode,
} from "@/server/lib/runtime-env";

// Hosted mode bills usage through Autumn unless BILLING_ENABLED=false — an MVP
// run before there is an Autumn account. Off, usage is unmetered and billing
// UI is hidden, as in the self-hosted modes. The client build reads the same
// variable (isBillingClientEnabled), so keep the two aligned.
export async function isBillingEnabled() {
  if (!(await isHostedServerAuthMode())) return false;
  return (await getOptionalEnvValue("BILLING_ENABLED")) !== "false";
}
