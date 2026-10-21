import { sql } from "drizzle-orm";
import {
  index,
  integer,
  real,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import { projects } from "./app.schema";
import { organization } from "./better-auth-schema";

export const billingCustomerStatus = sqliteTable("billing_customer_status", {
  organizationId: text("organization_id")
    .primaryKey()
    .references(() => organization.id, { onDelete: "cascade" }),
  isPaying: integer("is_paying", { mode: "boolean" }).notNull().default(false),
  paidPlanId: text("paid_plan_id"),
  paidPlanStatus: text("paid_plan_status"),
  // Full Autumn customer payload — escape hatch for any field we don't flatten,
  // queryable via json_extract so we never have to widen this table.
  customerJson: text("customer_json").notNull(),
  syncedAt: text("synced_at").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

// What each research job cost the agency, by project (spec 0017). Written
// whether or not billing is on, so an agency can see what each client costs
// it; Autumn stays the record of what was charged.
export const usageEvents = sqliteTable(
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
    createdAt: text("created_at")
      .notNull()
      .default(sql`(current_timestamp)`),
  },
  (table) => [
    index("usage_events_organization_created_idx").on(
      table.organizationId,
      table.createdAt,
    ),
  ],
);
