import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  clientPrefix: "VITE_",
  client: {
    VITE_SERVER_URL: z.url(),
    VITE_APP_URL: z.url(),
  },
  // biome-ignore lint/suspicious/noExplicitAny: Vite's import.meta.env requires type assertion
  runtimeEnv: (import.meta as any).env,
  emptyStringAsUndefined: true,
});
