import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Home from "../../page";
import { prisma } from "@/lib/prisma";
import { invitationName } from "@/lib/invitation";

type InvitationProps = { params: Promise<{ slug: string }> };

const guestFor = async (params: InvitationProps["params"]) => {
  const { slug } = await params;
  return prisma.expectedGuest.findUnique({ where: { slug }, select: { namePrefix: true, name: true, addition: true, invitedPersons: true, slug: true, party: { select: { by: true } } } });
};

export async function generateMetadata({ params }: InvitationProps): Promise<Metadata> {
  const guest = await guestFor(params);
  return { title: guest ? `${invitationName(guest)} — Hiruni & Ravindu` : "Invitation not found" };
}

export default async function InvitationPage({ params }: InvitationProps) {
  const guest = await guestFor(params);
  if (!guest) notFound();
  return <Home inviteeName={invitationName(guest)} invitedBy={guest.party.by ?? undefined} invitationSlug={guest.slug} />;
}
