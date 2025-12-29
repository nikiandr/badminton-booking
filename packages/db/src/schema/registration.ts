import { relations } from "drizzle-orm";
import { boolean, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { badmintonSession } from "./session";

export const sessionRegistration = pgTable(
  "session_registration",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    sessionId: text("session_id")
      .notNull()
      .references(() => badmintonSession.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    hasPaid: boolean("has_paid").default(false).notNull(),
    registeredAt: timestamp("registered_at").defaultNow().notNull(),
  },
  (table) => [unique().on(table.sessionId, table.userId)]
);

export const sessionRegistrationRelations = relations(
  sessionRegistration,
  ({ one }) => ({
    session: one(badmintonSession, {
      fields: [sessionRegistration.sessionId],
      references: [badmintonSession.id],
    }),
    user: one(user, {
      fields: [sessionRegistration.userId],
      references: [user.id],
    }),
  })
);
