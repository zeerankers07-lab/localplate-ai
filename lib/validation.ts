import { z } from "zod";

export const aiRequestSchema = z
  .object({
    message: z
      .string()
      .trim()
      .min(1, "Message is required.")
      .max(20000, "Message is too long."),
    // Optional. "cook" selects the What Can I Cook? assistant prompt.
    mode: z.enum(["cook"]).optional(),
  })
  .strict();

export function validateAIRequest(body: unknown) {
  return aiRequestSchema.safeParse(body);
}