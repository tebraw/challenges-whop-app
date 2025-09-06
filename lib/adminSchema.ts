import { z } from "zod";

export const challengeAdminSchema = z
  .object({
    title: z.string().min(3),
    description: z.string().min(10),
    startAt: z.coerce.date(),
    endAt: z.coerce.date(),
    proofType: z.enum(["TEXT", "PHOTO", "LINK"]),
    cadence: z.enum(["DAILY", "END_OF_CHALLENGE"]),
    maxParticipants: z.preprocess(
      (val) => val === "" || val === null || val === undefined ? undefined : Number(val),
      z.number().int().positive().optional()
    ),
    rewards: z
      .array(
        z.object({
          place: z.number().int().min(1).max(3),
          title: z.string().min(1),
          desc: z.string().optional(),
        })
      )
      .min(1, "At least one reward is required")
      .max(3),
    policy: z.string().min(10, "Policy/Terms text is required"),
    // allows http(s), local paths OR data URLs
    imageUrl: z
      .string()
      .optional()
      .refine(
        (v) => !v || /^https?:\/\//.test(v) || v.startsWith("/") || v.startsWith("data:"),
        { message: "Image must be http(s), a local path (/uploads/...), or a data URL" }
      ),
    // Marketing & Monetization fields
    tags: z.array(z.string()).max(5).optional(),
    targetAudience: z.string().optional(),
    difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional(),
    category: z.string().optional(),
    monetization: z.object({
      enabled: z.boolean().default(false),
      completionOffer: z.string().optional(),
      milestoneOffers: z.array(z.object({
        milestone: z.string(),
        offer: z.string(),
        discount: z.number().min(0).max(100).optional()
      })).optional(),
      highEngagementOffer: z.string().optional(),
    }).optional(),
  })
  .refine((v) => v.endAt > v.startAt, {
    message: "End must be after start",
    path: ["endAt"],
  });

export type ChallengeAdminInput = z.infer<typeof challengeAdminSchema>;
