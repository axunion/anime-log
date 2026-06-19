import type { BatchItem } from "drizzle-orm/batch";
import type { DB } from "../db/client";

export function asBatch(
  items: BatchItem<"sqlite">[],
): [BatchItem<"sqlite">, ...BatchItem<"sqlite">[]] {
  return items as [BatchItem<"sqlite">, ...BatchItem<"sqlite">[]];
}

export async function batchAll(
  db: DB,
  stmts: BatchItem<"sqlite">[],
): Promise<void> {
  for (let i = 0; i < stmts.length; i += 100) {
    await db.batch(asBatch(stmts.slice(i, i + 100)));
  }
}
