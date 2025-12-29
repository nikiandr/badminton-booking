import { db, eq } from "@badminton-app/db";
import { user } from "@badminton-app/db/schema/auth";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { adminProcedure, protectedProcedure, router } from "../index";

export const userRouter = router({
  completeProfile: protectedProcedure
    .input(
      z.object({
        firstName: z.string().min(1, "First name is required"),
        lastName: z.string().min(1, "Last name is required"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [updatedUser] = await db
        .update(user)
        .set({
          firstName: input.firstName,
          lastName: input.lastName,
          profileCompleted: true,
        })
        .where(eq(user.id, ctx.session.user.id))
        .returning();

      return updatedUser;
    }),

  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const [currentUser] = await db
      .select()
      .from(user)
      .where(eq(user.id, ctx.session.user.id));

    return currentUser;
  }),

  // Admin routes for user management
  listAll: adminProcedure.query(async () => {
    const users = await db
      .select({
        id: user.id,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        isAdmin: user.isAdmin,
        isApproved: user.isApproved,
        profileCompleted: user.profileCompleted,
        image: user.image,
        createdAt: user.createdAt,
      })
      .from(user)
      .orderBy(user.createdAt);

    return users;
  }),

  approve: adminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (input.userId === ctx.session.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot modify your own approval status",
        });
      }

      const [updatedUser] = await db
        .update(user)
        .set({ isApproved: true })
        .where(eq(user.id, input.userId))
        .returning();

      if (!updatedUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      return updatedUser;
    }),

  revoke: adminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (input.userId === ctx.session.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot modify your own approval status",
        });
      }

      const [updatedUser] = await db
        .update(user)
        .set({ isApproved: false })
        .where(eq(user.id, input.userId))
        .returning();

      if (!updatedUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      return updatedUser;
    }),

  setAdmin: adminProcedure
    .input(z.object({ userId: z.string(), isAdmin: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      if (input.userId === ctx.session.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot modify your own admin status",
        });
      }

      const [updatedUser] = await db
        .update(user)
        .set({ isAdmin: input.isAdmin })
        .where(eq(user.id, input.userId))
        .returning();

      if (!updatedUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      return updatedUser;
    }),
});
