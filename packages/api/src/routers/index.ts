import { protectedProcedure, publicProcedure, router } from "../index";
import { registrationRouter } from "./registration";
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
  registration: registrationRouter,
});
export type AppRouter = typeof appRouter;
