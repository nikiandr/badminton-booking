import { db, eq } from "@badminton-app/db";
import { badmintonSession } from "@badminton-app/db/schema/session";
import { and, asc, desc, gte, lte } from "drizzle-orm";
import { z } from "zod";

import { adminProcedure, protectedProcedure, router } from "../index";

const sessionInputSchema = z.object({
  date: z.coerce.date(),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  durationMinutes: z.number().int().positive(),
  costEuros: z.string(),
  paymentLink: z.string().url().optional().or(z.literal("")),
  places: z.number().int().positive(),
});

export const sessionRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        type: z.enum(["upcoming", "past"]),
        date: z.coerce.date().optional(),
      })
    )
    .query(async ({ input }) => {
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      const conditions = [];

      if (input.type === "upcoming") {
        conditions.push(gte(badmintonSession.date, now));
      } else {
        conditions.push(lte(badmintonSession.date, now));
      }

      if (input.date) {
        const startOfDay = new Date(input.date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(input.date);
        endOfDay.setHours(23, 59, 59, 999);
        conditions.push(gte(badmintonSession.date, startOfDay));
        conditions.push(lte(badmintonSession.date, endOfDay));
      }

      const sessions = await db
        .select()
        .from(badmintonSession)
        .where(and(...conditions))
        .orderBy(
          input.type === "upcoming"
            ? asc(badmintonSession.date)
            : desc(badmintonSession.date)
        );

      return sessions;
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const [session] = await db
        .select()
        .from(badmintonSession)
        .where(eq(badmintonSession.id, input.id));
      return session;
    }),

  create: adminProcedure
    .input(sessionInputSchema)
    .mutation(async ({ ctx, input }) => {
      const [newSession] = await db
        .insert(badmintonSession)
        .values({
          ...input,
          paymentLink: input.paymentLink || null,
          createdById: ctx.session.user.id,
        })
        .returning();
      return newSession;
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        data: sessionInputSchema.partial(),
      })
    )
    .mutation(async ({ input }) => {
      const updateData = { ...input.data };
      if (updateData.paymentLink === "") {
        updateData.paymentLink = undefined;
      }

      const [updatedSession] = await db
        .update(badmintonSession)
        .set(updateData)
        .where(eq(badmintonSession.id, input.id))
        .returning();
      return updatedSession;
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db
        .delete(badmintonSession)
        .where(eq(badmintonSession.id, input.id));
      return { success: true };
    }),

  getSessionDates: protectedProcedure
    .input(
      z.object({
        month: z.number().min(0).max(11),
        year: z.number(),
      })
    )
    .query(async ({ input }) => {
      const startDate = new Date(input.year, input.month, 1);
      const endDate = new Date(input.year, input.month + 1, 0, 23, 59, 59, 999);

      const sessions = await db
        .select({ date: badmintonSession.date })
        .from(badmintonSession)
        .where(
          and(
            gte(badmintonSession.date, startDate),
            lte(badmintonSession.date, endDate)
          )
        );

      return sessions.map((s) => s.date);
    }),
});
