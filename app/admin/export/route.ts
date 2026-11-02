import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { invitationName } from "@/lib/invitation";
import { getAdminRole } from "../auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!(await getAdminRole())) return new Response("Unauthorized", { status: 401 });

  const by = new URL(request.url).searchParams.get("by")?.trim();
  if (!by) return new Response("Missing guest list", { status: 400 });

  const allGuests = await prisma.expectedGuest.findMany({
    include: { party: true, rsvp: true },
    orderBy: { name: "asc" },
  });
  const guests = allGuests.filter((guest) => (guest.party.by?.trim() || "Unspecified") === by);
  if (!guests.length) return new Response("Guest list not found", { status: 404 });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Guests");
  sheet.columns = [
    { header: "Name", key: "name", width: 38 },
    { header: "Invitation", key: "invitation", width: 62 },
    { header: "Party", key: "party", width: 20 },
    { header: "Invited", key: "invited", width: 12 },
    { header: "Status", key: "status", width: 20 },
    { header: "RSVP name", key: "rsvpName", width: 38 },
    { header: "Phone", key: "phone", width: 20 },
    { header: "Email", key: "email", width: 32 },
    { header: "Attendance", key: "attendance", width: 27 },
    { header: "Actual guests", key: "actual", width: 16 },
    { header: "Message", key: "message", width: 50 },
    { header: "Received", key: "received", width: 18 },
  ];

  const origin = new URL(request.url).origin;
  for (const guest of guests) {
    const rsvp = guest.rsvp;
    sheet.addRow({
      name: invitationName(guest),
      invitation: process.env.ROOT_DOMAIN ? `https://${guest.slug}.${process.env.ROOT_DOMAIN}` : `${origin}/invite/${guest.slug}`,
      party: guest.party.name,
      invited: guest.invitedPersons,
      status: !rsvp ? "Await" : !rsvp.attending ? "Denied" : rsvp.whoAttending === "COMPLICATED" ? "Requested changes" : "Confirmed",
      rsvpName: rsvp?.fullName ?? "",
      phone: rsvp?.phoneNumber ?? "",
      email: rsvp?.email ?? "",
      attendance: rsvp?.whoAttending === "ONLY_MYSELF" ? "Only myself" : rsvp?.whoAttending === "MYSELF_AND_OTHER_INVITEES" ? "With other invitees" : rsvp?.whoAttending === "COMPLICATED" ? "Complicated" : "",
      actual: rsvp?.guestCount ?? "",
      message: rsvp?.message ?? "",
      received: rsvp?.createdAt ?? "",
    });
  }

  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4A2D0F" } };
  sheet.getColumn("received").numFmt = "dd mmm yyyy";
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  sheet.autoFilter = { from: "A1", to: `L${guests.length + 1}` };

  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `guests-by-${by.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "unspecified"}.xlsx`;
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
