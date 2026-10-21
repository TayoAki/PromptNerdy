import { db } from "@/db";
import { usageEvents } from "@/db/schema";
import {
  type CreditFeature,
  mapDataforseoPathToCreditFeature,
} from "@/shared/billing-credit-features";
import type { DataforseoApiCallCost } from "@/server/lib/dataforseo/envelope";

type UsageCost = {
  provider: "dataforseo" | "openrouter" | "context";
  creditFeature: CreditFeature;
  costUsd: number;
};

// Records what research cost, by project, for the Clients page's per-client
// usage (spec 0017). Runs whether or not billing is on. Never throws: a
// ledger failure must not fail research that already ran.
export async function recordUsage(
  owner: { organizationId: string; projectId?: string },
  costs: UsageCost[],
) {
  const rows = costs.filter((cost) => cost.costUsd > 0);
  if (rows.length === 0) return;
  const createdAt = new Date().toISOString();
  try {
    await db.insert(usageEvents).values(
      rows.map((cost) => ({
        id: crypto.randomUUID(),
        organizationId: owner.organizationId,
        projectId: owner.projectId ?? null,
        provider: cost.provider,
        creditFeature: cost.creditFeature,
        costUsd: cost.costUsd,
        createdAt,
      })),
    );
  } catch (error) {
    console.error("usage ledger write failed", {
      organizationId: owner.organizationId,
      projectId: owner.projectId,
      error,
    });
  }
}

// A batch of DataForSEO calls as one ledger row per credit feature.
export function dataforseoUsageCosts(
  costs: DataforseoApiCallCost[],
  creditFeature?: CreditFeature,
): UsageCost[] {
  const byFeature = new Map<CreditFeature, number>();
  for (const cost of costs) {
    const feature =
      creditFeature ?? mapDataforseoPathToCreditFeature(cost.path);
    byFeature.set(feature, (byFeature.get(feature) ?? 0) + cost.costUsd);
  }
  return [...byFeature].map(([feature, costUsd]) => ({
    provider: "dataforseo",
    creditFeature: feature,
    costUsd,
  }));
}
