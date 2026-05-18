import { pgTable, text, serial, integer, timestamp, numeric } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const driverPaymentsTable = pgTable("driver_payments", {
  id: serial("id").primaryKey(),
  driverId: integer("driver_id").notNull().references(() => usersTable.id),
  adminId: integer("admin_id").notNull().references(() => usersTable.id),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  note: text("note"),
  receiptNumber: text("receipt_number").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type DriverPayment = typeof driverPaymentsTable.$inferSelect;
