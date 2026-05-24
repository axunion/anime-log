import { z } from "zod";

export const castMemberInput = z.object({
	actor_name: z.string().min(1),
	character_name: z.string().min(1),
});
