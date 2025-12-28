import { relations } from "drizzle-orm";
import {
  decimal,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

export const badmintonSession = pgTable("badminton_session", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  date: timestamp("date", { mode: "date" }).notNull(),
  time: text("time").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  costEuros: decimal("cost_euros", { precision: 10, scale: 2 }).notNull(),
  paymentLink: text("payment_link"),
  places: integer("places").notNull(),
  createdById: text("created_by_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const badmintonSessionRelations = relations(
  badmintonSession,
  ({ one }) => ({
    createdBy: one(user, {
      fields: [badmintonSession.createdById],
      references: [user.id],
    }),
  })
);
