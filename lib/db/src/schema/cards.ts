import { pgTable, text, serial, integer, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const cardsTable = pgTable("cards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  type: text("type").notNull().default("standard"),
  cardNumber: text("card_number").notNull().unique(),
  balance: numeric("balance", { precision: 12, scale: 2 }).notNull().default("0"),
  status: text("status").notNull().default("pending"),
  studentId: text("student_id"),
  documentUrl: text("document_url"),
  holderName: text("holder_name"),
  holderLastName: text("holder_last_name"),
  nationalId: text("national_id"),
  schoolCertUrl: text("school_cert_url"),
  workCardUrl: text("work_card_url"),
  disabilityCertUrl: text("disability_cert_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertCardSchema = createInsertSchema(cardsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCard = z.infer<typeof insertCardSchema>;
export type Card = typeof cardsTable.$inferSelect;
