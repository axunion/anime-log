import { z } from "zod";

export const idParam = z.coerce.number().int().positive();

// Input size caps shared across validation schemas. Defense in depth: bound
// per-request payload size even for token-authenticated write endpoints.
export const MAX_NAME_LENGTH = 200;
export const MAX_CAST_PER_TITLE = 500;
export const MAX_IMPORT_ROWS = 10000;
