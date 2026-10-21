import { useQuery } from "@tanstack/react-query";
import { billingAccountQueryOptions } from "@/client/features/billing/billingAccountQuery";
import { isBillingClientEnabled } from "@/lib/auth-mode";
import type { PlanStatus } from "@/shared/billing";

// The single client-side plan gate. It is a UX layer only: the server enforces
// every paid-plan limit before it spends anything.
export function useHostedPlanGate(): "loading" | PlanStatus {
  // Without billing (self-hosted, or hosted with BILLING_ENABLED=false) there
  // is no Autumn customer and the server treats the org as paid, so only a
  // billed deployment looks up the plan.
  const billingEnabled = isBillingClientEnabled();
  const accountQuery = useQuery({
    ...billingAccountQueryOptions(),
    enabled: billingEnabled,
  });

  if (!billingEnabled) return "paid";
  if (accountQuery.isPending) return "loading";
  // Fails closed: an account that failed to load resolves to "free".
  return accountQuery.data?.planStatus ?? "free";
}
