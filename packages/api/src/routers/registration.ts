import { db, eq } from "@badminton-app/db";
import { user } from "@badminton-app/db/schema/auth";
import { sessionRegistration } from "@badminton-app/db/schema/registration";
import { badmintonSession } from "@badminton-app/db/schema/session";
import { TRPCError } from "@trpc/server";
import { and, asc, count } from "drizzle-orm";
import { z } from "zod";

import { adminProcedure, protectedProcedure, router } from "../index";

export const registrationRouter = router({
  getParticipants: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input }) => {
      const registrations = await db
        .select({
          id: sessionRegistration.id,
          userId: sessionRegistration.userId,
          hasPaid: sessionRegistration.hasPaid,
          registeredAt: sessionRegistration.registeredAt,
          user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            image: user.image,
          },
        })
        .from(sessionRegistration)
        .innerJoin(user, eq(sessionRegistration.userId, user.id))
        .where(eq(sessionRegistration.sessionId, input.sessionId))
        .orderBy(asc(sessionRegistration.registeredAt));

      return registrations;
    }),

  register: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [session] = await db
        .select()
        .from(badmintonSession)
        .where(eq(badmintonSession.id, input.sessionId));

      if (!session) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Session not found",
        });
      }

      const existingRegistration = await db
        .select()
        .from(sessionRegistration)
        .where(
          and(
            eq(sessionRegistration.sessionId, input.sessionId),
            eq(sessionRegistration.userId, ctx.session.user.id)
          )
        );

      if (existingRegistration.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You are already registered for this session",
        });
      }

      const [newRegistration] = await db
        .insert(sessionRegistration)
        .values({
          sessionId: input.sessionId,
          userId: ctx.session.user.id,
        })
        .returning();

      return newRegistration;
    }),

  unregister: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [registration] = await db
        .select()
        .from(sessionRegistration)
        .where(
          and(
            eq(sessionRegistration.sessionId, input.sessionId),
            eq(sessionRegistration.userId, ctx.session.user.id)
          )
        );

      if (!registration) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "You are not registered for this session",
        });
      }

      await db
        .delete(sessionRegistration)
        .where(eq(sessionRegistration.id, registration.id));

      return { success: true };
    }),

  markAsPaid: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [session] = await db
        .select()
        .from(badmintonSession)
        .where(eq(badmintonSession.id, input.sessionId));

      if (!session) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Session not found",
        });
      }

      const registrations = await db
        .select()
        .from(sessionRegistration)
        .where(eq(sessionRegistration.sessionId, input.sessionId))
        .orderBy(asc(sessionRegistration.registeredAt));

      const userRegistrationIndex = registrations.findIndex(
        (r) => r.userId === ctx.session.user.id
      );

      if (userRegistrationIndex === -1) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "You are not registered for this session",
        });
      }

      if (userRegistrationIndex >= session.places) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are in the queue and cannot mark as paid yet",
        });
      }

      const [updatedRegistration] = await db
        .update(sessionRegistration)
        .set({ hasPaid: true })
        .where(
          and(
            eq(sessionRegistration.sessionId, input.sessionId),
            eq(sessionRegistration.userId, ctx.session.user.id)
          )
        )
        .returning();

      return updatedRegistration;
    }),

  removeParticipant: adminProcedure
    .input(z.object({ registrationId: z.string() }))
    .mutation(async ({ input }) => {
      const [registration] = await db
        .select()
        .from(sessionRegistration)
        .where(eq(sessionRegistration.id, input.registrationId));

      if (!registration) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Registration not found",
        });
      }

      await db
        .delete(sessionRegistration)
        .where(eq(sessionRegistration.id, input.registrationId));

      return { success: true };
    }),

  getRegistrationCount: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input }) => {
      const [result] = await db
        .select({ count: count() })
        .from(sessionRegistration)
        .where(eq(sessionRegistration.sessionId, input.sessionId));

      return result?.count ?? 0;
    }),
});
