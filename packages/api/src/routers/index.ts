import { protectedProcedure, publicProcedure, router } from "../index";
import { sessionRouter } from "./session";
import { userRouter } from "./user";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  privateData: protectedProcedure.query(({ ctx }) => {
    return {
      message: "This is private",
      user: ctx.session.user,
    };
  }),
  user: userRouter,
  session: sessionRouter,
});
export type AppRouter = typeof appRouter;
