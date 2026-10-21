import { sql } from "drizzle-orm";
import { boolean, index, pgTable, real, text } from "drizzle-orm/pg-core";
import { projects } from "./app.schema";
import { organization } from "./better-auth-schema";

// See src/db/pg/app.schema.ts for why timestamps are ISO-8601 UTC text.
const isoNow = sql`to_char(now() AT TIME ZONE 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`;

export const billingCustomerStatus = pgTable("billing_customer_status", {
  organizationId: text("organization_id")
    .primaryKey()
    .references(() => organization.id, { onDelete: "cascade" }),
  isPaying: boolean("is_paying").notNull().default(false),
  paidPlanId: text("paid_plan_id"),
  paidPlanStatus: text("paid_plan_status"),
  // Full Autumn customer payload — escape hatch for any field we don't flatten,
  // queryable via json_extract so we never have to widen this table.
  customerJson: text("customer_json").notNull(),
  syncedAt: text("synced_at").notNull(),
  createdAt: text("created_at").notNull().default(isoNow),
  updatedAt: text("updated_at").notNull().default(isoNow),
});

// What each research job cost the agency, by project (spec 0017). Written
// whether or not billing is on, so an agency can see what each client costs
// it; Autumn stays the record of what was charged.
export const usageEvents = pgTable(
  "usage_events",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    // Null for organization-level work, or once the project is deleted.
    projectId: text("project_id").references(() => projects.id, {
      onDelete: "set null",
    }),
    provider: text("provider", {
      enum: ["dataforseo", "openrouter", "context"],
    }).notNull(),
    creditFeature: text("credit_feature").notNull(),
    // The provider's own price, before any billing markup.
    costUsd: real("cost_usd").notNull(),
    createdAt: text("created_at").notNull().default(isoNow),
  },
  (table) => [
    index("usage_events_organization_created_idx").on(
      table.organizationId,
      table.createdAt,
    ),
  ],
);
