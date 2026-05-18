import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";

export const distributorBalanceRequestsTable = pgTable("distributor_balance_requests", {
  id:            serial("id").primaryKey(),
  distributorId: integer("distributor_id").notNull(),
  amount:        text("amount").notNull(),
  phone:         text("phone").notNull(),
  status:        text("status").notNull().default("pending"),
  note:          text("note"),
  adminId:       integer("admin_id"),
  createdAt:     timestamp("created_at").notNull().defaultNow(),
  updatedAt:     timestamp("updated_at").notNull().defaultNow(),
});
