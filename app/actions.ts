"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rsvpGuestCount } from "@/lib/invitation";
import { normalizeSriLankanPhone, SRI_LANKAN_PHONE_NUMBER } from "@/lib/phone";

const rsvpSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(120),
  phoneNumber: z.string().transform(normalizeSriLankanPhone)
    .pipe(z.string().regex(SRI_LANKAN_PHONE_NUMBER, "Enter a valid Sri Lankan phone number")),
  email: z.string().trim().max(254).refine(
    (value) => value === "" || z.email().safeParse(value).success,
    "Enter a valid email address",
  ),
  attending: z.enum(["yes", "no"], { error: "Choose whether you will attend" }),
  whoAttending: z.enum(["ONLY_MYSELF", "MYSELF_AND_OTHER_INVITEES", "COMPLICATED"]).optional(),
  message: z.string().trim().max(1000, "Keep your message under 1,000 characters"),
  invitationSlug: z.string().trim().optional(),
}).superRefine((data, context) => {
  if (data.attending === "yes" && !data.whoAttending) {
    context.addIssue({
      code: "custom",
      path: ["whoAttending"],
      message: "Choose who will be attending",
    });
  }
});

export type RsvpState = {
  status: "idle" | "error" | "success";
  message?: string;
  errors?: Record<string, string[]>;
};

export async function submitRsvp(
  _previousState: RsvpState,
  formData: FormData,
): Promise<RsvpState> {
  const result = rsvpSchema.safeParse({
    fullName: formData.get("fullName"),
    phoneNumber: formData.get("phoneNumber"),
    email: formData.get("email") ?? "",
    attending: formData.get("attending"),
    whoAttending: formData.get("whoAttending") ?? undefined,
    message: formData.get("message") ?? "",
    invitationSlug: formData.get("invitationSlug") ?? undefined,
  });

  if (!result.success) {
    return {
      status: "error",
      message: "Please check the highlighted fields.",
      errors: result.error.flatten().fieldErrors,
    };
  }

  const { attending, whoAttending, email, message, invitationSlug, ...data } = result.data;

  try {
    const expectedGuest = invitationSlug
      ? await prisma.expectedGuest.findUnique({ where: { slug: invitationSlug }, select: { id: true, invitedPersons: true } })
      : null;
    const isAttending = attending === "yes";

    await prisma.rsvp.create({
      data: {
        ...data,
        attending: isAttending,
        whoAttending: isAttending ? whoAttending : null,
        guestCount: rsvpGuestCount(isAttending, whoAttending, expectedGuest?.invitedPersons),
        email: email || null,
        message: message || null,
        expectedGuestId: expectedGuest?.id ?? null,
      },
    });
    return { status: "success", message: "Thank you! Your RSVP has been received." };
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return {
        status: "error",
        message: "An RSVP already exists for this phone number. Please contact the bride or groom directly for any changes.",
      };
    }

    return {
      status: "error",
      message: "We couldn't save your RSVP. Please try again.",
    };
  }
}
