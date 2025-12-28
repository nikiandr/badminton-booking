import { db, eq } from "@badminton-app/db";
import { user } from "@badminton-app/db/schema/auth";
import { z } from "zod";

import { protectedProcedure, router } from "../index";

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
});
