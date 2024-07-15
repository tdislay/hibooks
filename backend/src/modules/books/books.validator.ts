import { z } from "zod";

export const searchBookSchema = z.object({
  query: z.string().optional(),
});

export const getBookSchema = z.object({
  id: z.number().min(1),
});
