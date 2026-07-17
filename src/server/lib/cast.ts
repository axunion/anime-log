import { MAX_NAME_LENGTH } from "@shared/schemas/common";
import type { BatchItem } from "drizzle-orm/batch";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import type { DB } from "../db/client";
import { cast_members } from "../db/schema";

export const castMemberInput = createInsertSchema(cast_members, {
  actor_name: z.string().min(1).max(MAX_NAME_LENGTH),
  character_name: z.string().min(1).max(MAX_NAME_LENGTH),
}).pick({ actor_name: true, character_name: true });

export function buildCastInsertStmts(
  db: DB,
  titleId: number,
  members: { actor_name: string; character_name: string }[],
): BatchItem<"sqlite">[] {
  return members.map((m, i) =>
    db.insert(cast_members).values({
      title_id: titleId,
      actor_name: m.actor_name,
      character_name: m.character_name,
      sort_order: i,
    }),
  ) as BatchItem<"sqlite">[];
}
