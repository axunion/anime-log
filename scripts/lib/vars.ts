import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));

export function readVarsFileToken(
	filePath: string,
	key: string,
): string | undefined {
	try {
		const content = readFileSync(filePath, "utf-8");
		return content.match(new RegExp(`^${key}\\s*=\\s*(.+)$`, "m"))?.[1]?.trim();
	} catch {
		return undefined;
	}
}
