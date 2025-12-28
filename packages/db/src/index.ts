import { env } from "@badminton-app/env/server";
import { drizzle } from "drizzle-orm/node-postgres";

// biome-ignore lint/performance/noNamespaceImport: Required for drizzle schema inference
import * as schema from "./schema";

export const db = drizzle(env.DATABASE_URL, { schema });

// biome-ignore lint/performance/noBarrelFile: Re-export for convenience
export { eq } from "drizzle-orm";
