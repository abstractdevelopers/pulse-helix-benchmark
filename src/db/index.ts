import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const client = postgres(process.env.DATABASE_URL ?? "postgres://pulse:pulse123@localhost:5432/pulse");
export const db = drizzle(client, { schema });