import { customerHasPaidPlan } from "@/server/billing/subscription";
import { AppError } from "@/server/lib/errors";
import { isBillingEnabled } from "@/server/billing/billing-mode";

/** Prompt tracking only needs credits; the costlier AI searches need the plan. */
export async function assertPaidAiSearchPlan(
  organizationId: string,
  feature: string,
) {
  if (!(await isBillingEnabled())) return;
  if (await customerHasPaidPlan(organizationId)) return;
  throw new AppError(
    "PAYMENT_REQUIRED",
    `Upgrade to the paid plan to use ${feature}`,
  );
}
