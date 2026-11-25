import { z } from "zod";

const stripped = (min: number, max: number) =>
  z
    .string()
    .transform((value) => value.trim())
    .pipe(z.string().min(min).max(max));

export const reviewFormSchema = z.object({
  name: stripped(2, 120),
  text: stripped(10, 2000),
  rating: z.coerce.number().int().min(1).max(5),
  privacyConsent: z.boolean().refine((accepted) => accepted, { message: "privacy_required" }),
});

export type ReviewFormValues = z.input<typeof reviewFormSchema>;
export type ReviewFormParsed = z.output<typeof reviewFormSchema>;
