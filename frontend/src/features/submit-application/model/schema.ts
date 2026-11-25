import { z } from "zod";

const stripped = (min: number, max: number) =>
  z
    .string()
    .transform((value) => value.trim())
    .pipe(z.string().min(min).max(max));

export const applicationFormSchema = z.object({
  name: stripped(2, 120),
  contact: stripped(3, 200),
  kind: z.enum(["job", "order"]),
  message: stripped(10, 2000),
  privacyConsent: z.boolean().refine((accepted) => accepted, { message: "privacy_required" }),
});

export type ApplicationFormValues = z.input<typeof applicationFormSchema>;
export type ApplicationFormParsed = z.output<typeof applicationFormSchema>;
