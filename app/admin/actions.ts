"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createInvitationSlug } from "@/lib/slug";
import { INVITATION_ADDITIONS, invitationGuestCount, NAME_PREFIXES } from "@/lib/invitation";
import { normalizeSriLankanPhone, SRI_LANKAN_PHONE_NUMBER } from "@/lib/phone";
import { createAdminSession, deleteAdminSession, requireAdmin, roleForPassword } from "./auth";

export type LoginState = { error?: string };
export type CreateExpectedGuestState = {
  status: "idle" | "error" | "success";
  message?: string;
  guestId?: string;
};

const text = z.string().trim().min(1).max(120);
const id = z.string().min(1);
const count = z.coerce.number().int().min(0).max(9999);
const expectedGuestSchema = z.object({
  namePrefix: z.enum(NAME_PREFIXES).nullable(),
  name: text,
  addition: z.enum(INVITATION_ADDITIONS).nullable(),
  partyId: id,
  invitedPersons: count.min(1).max(10),
}).transform((data) => ({ ...data, invitedPersons: invitationGuestCount(data.addition, data.invitedPersons) }));
const partySchema = z.object({ name: text, maxGuestCount: count });
const rsvpSchema = z.object({
  fullName: text,
  phoneNumber: z.string().transform(normalizeSriLankanPhone).pipe(z.string().regex(SRI_LANKAN_PHONE_NUMBER)),
  email: z.string().trim().max(254).refine((value) => !value || z.email().safeParse(value).success),
  attending: z.enum(["true", "false"]),
  whoAttending: z.enum(["ONLY_MYSELF", "MYSELF_AND_OTHER_INVITEES", "COMPLICATED"]).optional(),
  guestCount: count,
  expectedGuestId: z.string().optional(),
  message: z.string().trim().max(1000),
});

const destination = (tab: string, notice?: string, error?: string): never => {
  const params = new URLSearchParams({ tab: tab === "stats" ? "stats" : "manage" });
  if (notice) params.set("notice", notice);
  if (error) params.set("error", error);
  redirect(`/admin?${params}`);
};

const databaseError = (error: unknown) => {
  if (typeof error === "object" && error && "code" in error && error.code === "P2002") {
    return "That phone number, party name, or invitation match is already in use.";
  }
  return "The change could not be saved.";
};

export async function login(_state: LoginState, formData: FormData): Promise<LoginState> {
  const role = roleForPassword(String(formData.get("password") ?? ""));
  if (!role) return { error: "That password is not recognised." };
  await createAdminSession(role);
  redirect("/admin");
}

export async function logout() {
  await deleteAdminSession();
  redirect("/admin");
}

export async function createExpectedGuest(
  state: CreateExpectedGuestState,
  formData: FormData,
): Promise<CreateExpectedGuestState> {
  await requireAdmin();
  const result = expectedGuestSchema.safeParse({
    ...Object.fromEntries(formData),
    namePrefix: formData.get("namePrefix") || null,
    addition: formData.get("addition") || null,
  });
  if (!result.success) {
    return { status: "error", message: "Check the invitation name, addition, and guest count.", guestId: state.guestId };
  }
  const slug = createInvitationSlug(result.data.name, randomBytes(6).toString("hex"));
  if (!slug) {
    return { status: "error", message: "The name must contain letters or numbers for its invitation link.", guestId: state.guestId };
  }
  try {
    const guest = await prisma.expectedGuest.create({ data: { ...result.data, slug }, select: { id: true } });
    revalidatePath("/admin");
    return { status: "success", message: "Guest added.", guestId: guest.id };
  } catch (error) {
    return { status: "error", message: databaseError(error), guestId: state.guestId };
  }
}

export async function updateExpectedGuest(guestId: string, formData: FormData) {
  await requireAdmin();
  const result = expectedGuestSchema.safeParse({
    ...Object.fromEntries(formData),
    namePrefix: formData.get("namePrefix") || null,
    addition: formData.get("addition") || null,
  });
  if (!result.success) destination("expected", undefined, "Check the invitation name, addition, and guest count.");
  try {
    await prisma.expectedGuest.update({ where: { id: guestId }, data: result.data! });
  } catch (error) {
    destination("expected", undefined, databaseError(error));
  }
  revalidatePath("/admin");
  destination("expected", "Expected guest updated.");
}

export async function deleteExpectedGuest(guestId: string) {
  await requireAdmin();
  await prisma.expectedGuest.deleteMany({ where: { id: guestId } });
  revalidatePath("/admin");
  destination("expected", "Expected guest deleted.");
}

const parseRsvp = (formData: FormData) => rsvpSchema.safeParse({
  ...Object.fromEntries(formData),
  whoAttending: formData.get("whoAttending") || undefined,
  expectedGuestId: formData.get("expectedGuestId") || undefined,
});

const rsvpData = (data: z.infer<typeof rsvpSchema>) => ({
  fullName: data.fullName,
  phoneNumber: data.phoneNumber,
  email: data.email || null,
  attending: data.attending === "true",
  whoAttending: data.attending === "true" ? data.whoAttending ?? "ONLY_MYSELF" as const : null,
  guestCount: data.attending === "true" ? data.guestCount : 0,
  expectedGuestId: data.expectedGuestId || null,
  message: data.message || null,
});

export async function createRsvp(formData: FormData) {
  await requireAdmin();
  const tab = String(formData.get("returnTab") ?? "rsvp");
  const result = parseRsvp(formData);
  if (!result.success) destination(tab, undefined, "Check the response details and try again.");
  try {
    await prisma.rsvp.create({ data: rsvpData(result.data!) });
  } catch (error) {
    destination(tab, undefined, databaseError(error));
  }
  revalidatePath("/admin");
  destination(tab, "Response added.");
}

export async function updateRsvp(rsvpId: string, formData: FormData) {
  await requireAdmin();
  const tab = String(formData.get("returnTab") ?? "rsvp");
  const result = parseRsvp(formData);
  if (!result.success) destination(tab, undefined, "Check the response details and try again.");
  try {
    await prisma.rsvp.update({ where: { id: rsvpId }, data: rsvpData(result.data!) });
  } catch (error) {
    destination(tab, undefined, databaseError(error));
  }
  revalidatePath("/admin");
  destination(tab, "Response updated.");
}

export async function deleteRsvp(rsvpId: string, formData: FormData) {
  await requireAdmin();
  const tab = String(formData.get("returnTab") ?? "rsvp");
  await prisma.rsvp.deleteMany({ where: { id: rsvpId } });
  revalidatePath("/admin");
  destination(tab, "Response deleted.");
}

export async function createParty(formData: FormData) {
  await requireAdmin(true);
  const result = partySchema.safeParse(Object.fromEntries(formData));
  if (!result.success) destination("parties", undefined, "Enter a party name and maximum guest count.");
  try {
    await prisma.invitingParty.create({ data: result.data! });
  } catch (error) {
    destination("parties", undefined, databaseError(error));
  }
  revalidatePath("/admin");
  destination("parties", "Inviting party added.");
}

export async function updateParty(partyId: string, formData: FormData) {
  await requireAdmin(true);
  const result = partySchema.safeParse(Object.fromEntries(formData));
  if (!result.success) destination("parties", undefined, "Enter a party name and maximum guest count.");
  try {
    await prisma.invitingParty.update({ where: { id: partyId }, data: result.data! });
  } catch (error) {
    destination("parties", undefined, databaseError(error));
  }
  revalidatePath("/admin");
  destination("parties", "Inviting party updated.");
}

export async function deleteParty(partyId: string) {
  await requireAdmin(true);
  await prisma.invitingParty.deleteMany({ where: { id: partyId } });
  revalidatePath("/admin");
  destination("parties", "Inviting party deleted.");
}
