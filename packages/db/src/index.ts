import { env } from "@badminton-app/env/server";
import { drizzle } from "drizzle-orm/node-postgres";

import * as schema from "./schema";

export const db = drizzle(env.DATABASE_URL, { schema });

export { eq } from "drizzle-orm";
