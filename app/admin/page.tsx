import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Icon } from "../icons";
import { getAdminRole } from "./auth";
import {
  createParty,
  createRsvp,
  deleteExpectedGuest,
  deleteParty,
  deleteRsvp,
  logout,
  updateExpectedGuest,
  updateParty,
  updateRsvp,
} from "./actions";
import { LoginForm } from "./login-form";
import { ExpectedGuestFields } from "./expected-guest-fields";
import { AddExpectedGuestForm } from "./add-expected-guest-form";
import { invitationName } from "@/lib/invitation";
import { AdminModal, AdminSubmitButton, CopyInvitationLink } from "./admin-controls";

export const metadata: Metadata = { title: "Guest ledger — Hiruni & Ravindu" };

type Tab = "manage" | "stats";
type GuestOption = { id: string; name: string; party: { name: string } };
type ResponseRecord = {
  id: string;
  fullName: string;
  phoneNumber: string;
  email: string | null;
  attending: boolean;
  whoAttending: "ONLY_MYSELF" | "MYSELF_AND_OTHER_INVITEES" | "COMPLICATED" | null;
  guestCount: number;
  expectedGuestId: string | null;
  message: string | null;
};

const attendanceLabels = {
  ONLY_MYSELF: "Only myself",
  MYSELF_AND_OTHER_INVITEES: "With other invitees",
  COMPLICATED: "Complicated",
} as const;

const rsvpStatus = (response?: Pick<ResponseRecord, "attending" | "whoAttending"> | null) => {
  if (!response) return { label: "Await", className: "waiting" };
  if (!response.attending) return { label: "Denied", className: "no" };
  if (response.whoAttending === "COMPLICATED") return { label: "Requested changes", className: "changes" };
  return { label: "Confirmed", className: "yes" };
};

function RsvpFields({
  response,
  guests,
  returnTab,
  defaultGuest,
  defaultName,
  defaultCount = 1,
}: {
  response?: ResponseRecord;
  guests: GuestOption[];
  returnTab: Tab;
  defaultGuest?: string;
  defaultName?: string;
  defaultCount?: number;
}) {
  return (
    <div className="admin-form-grid">
      <input type="hidden" name="returnTab" value={returnTab} suppressHydrationWarning />
      <label suppressHydrationWarning>Full name<input name="fullName" defaultValue={response?.fullName ?? defaultName ?? ""} required maxLength={120} suppressHydrationWarning /></label>
      <label suppressHydrationWarning>Phone<input name="phoneNumber" type="tel" defaultValue={response?.phoneNumber ?? "+94"} required suppressHydrationWarning /></label>
      <label suppressHydrationWarning>Email<input name="email" type="email" defaultValue={response?.email ?? ""} suppressHydrationWarning /></label>
      <label suppressHydrationWarning>Response
        <select name="attending" defaultValue={String(response?.attending ?? true)} suppressHydrationWarning>
          <option value="true">Attending</option>
          <option value="false">Declined</option>
        </select>
      </label>
      <label suppressHydrationWarning>Attendance group
        <select name="whoAttending" defaultValue={response?.whoAttending ?? "ONLY_MYSELF"} suppressHydrationWarning>
          {Object.entries(attendanceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      <label suppressHydrationWarning>Actual guests<input name="guestCount" type="number" min="0" max="9999" defaultValue={response?.guestCount ?? defaultCount} required suppressHydrationWarning /></label>
      <label className="admin-span-2" suppressHydrationWarning>Match to invitation
        <select name="expectedGuestId" defaultValue={response?.expectedGuestId ?? defaultGuest ?? ""} suppressHydrationWarning>
          <option value="">Unmatched</option>
          {guests.map((guest) => <option key={guest.id} value={guest.id}>{guest.name} — {guest.party.name}</option>)}
        </select>
      </label>
      <label className="admin-span-2" suppressHydrationWarning>Message<textarea name="message" rows={2} defaultValue={response?.message ?? ""} maxLength={1000} suppressHydrationWarning /></label>
    </div>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <div className="admin-empty"><Icon name="sparkles" /><p>{children}</p></div>;
}

function PieChart({
  title,
  values,
  center,
}: {
  title: string;
  values: { label: string; value: number; color: string }[];
  center: string;
}) {
  const total = values.reduce((sum, item) => sum + item.value, 0);
  let cursor = 0;
  const stops = values.map((item) => {
    const start = cursor;
    cursor += total ? item.value / total * 100 : 0;
    return `${item.color} ${start}% ${cursor}%`;
  });

  return (
    <article className="admin-chart-card">
      <div className="admin-pie" style={{ background: total ? `conic-gradient(${stops.join(",")})` : "#ded9ce" }} role="img" aria-label={`${title}: ${values.map((item) => `${item.label} ${item.value}`).join(", ")}`}>
        <span><strong>{center}</strong><small>Total</small></span>
      </div>
      <div><h2>{title}</h2><ul>{values.map((item) => <li key={item.label}><i style={{ background: item.color }} /><span>{item.label}</span><strong>{item.value}</strong></li>)}</ul></div>
    </article>
  );
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const role = await getAdminRole();

  if (!role) {
    return (
      <main className="admin-login-page">
        <section className="admin-login-card">
          <p className="admin-kicker">Hiruni &amp; Ravindu</p>
          <div className="admin-monogram" aria-hidden="true">H<span>&amp;</span>R</div>
          <h1>Guest ledger</h1>
          <p>Enter the admin password to manage invitations and responses.</p>
          <LoginForm />
          <Link href="/"><Icon name="arrow-left" />Return to invitation</Link>
        </section>
      </main>
    );
  }

  const query = await searchParams;
  const requestedTab = Array.isArray(query.tab) ? query.tab[0] : query.tab;
  const tab: Tab = requestedTab === "stats" ? "stats" : "manage";
  const notice = Array.isArray(query.notice) ? query.notice[0] : query.notice;
  const error = Array.isArray(query.error) ? query.error[0] : query.error;

  const [parties, expectedGuests, responses] = await Promise.all([
    prisma.invitingParty.findMany({
      include: { expectedGuests: { include: { rsvp: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.expectedGuest.findMany({
      include: { party: true, rsvp: true },
      orderBy: [{ party: { name: "asc" } }, { name: "asc" }],
    }),
    prisma.rsvp.findMany({
      include: { expectedGuest: { include: { party: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const guestOptions: GuestOption[] = expectedGuests.map((guest) => ({ id: guest.id, name: invitationName(guest), party: guest.party }));
  const totalInvited = expectedGuests.reduce((sum, guest) => sum + guest.invitedPersons, 0);
  const totalConfirmed = responses.reduce((sum, response) => sum + (response.attending ? response.guestCount : 0), 0);
  const unmatchedResponses = responses.filter((response) => !response.expectedGuestId);
  const requestedResponses = responses.filter((response) => response.attending && response.whoAttending === "COMPLICATED").length;
  const confirmedResponses = responses.filter((response) => response.attending).length - requestedResponses;
  const declinedResponses = responses.filter((response) => !response.attending).length;
  const requestedInvitations = expectedGuests.filter((guest) => guest.rsvp?.attending && guest.rsvp.whoAttending === "COMPLICATED").length;
  const confirmedInvitations = expectedGuests.filter((guest) => guest.rsvp?.attending).length - requestedInvitations;
  const declinedInvitations = expectedGuests.filter((guest) => guest.rsvp && !guest.rsvp.attending).length;
  const awaitingInvitations = expectedGuests.length - confirmedInvitations - declinedInvitations - requestedInvitations;

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="admin-kicker">Wedding operations · 14 December 2026</p>
          <h1>Guest ledger</h1>
          <p>{expectedGuests.length} invitations · {totalInvited} invited · {totalConfirmed} confirmed</p>
        </div>
        <div className="admin-header-actions">
          <span className="admin-role">{role === "super" ? "Super admin" : "Admin"}</span>
          <form action={logout} suppressHydrationWarning><AdminSubmitButton className="admin-quiet-button">Sign out</AdminSubmitButton></form>
        </div>
      </header>

      <nav className="admin-tabs" aria-label="Admin sections">
        <a className={tab === "manage" ? "active" : ""} href="?tab=manage">Guests <span>{expectedGuests.length}</span></a>
        <a className={tab === "stats" ? "active" : ""} href="?tab=stats">RSVP stats <span>{responses.length}</span></a>
      </nav>

      {notice && <p className="admin-alert success" role="status">{notice}</p>}
      {error && <p className="admin-alert error" role="alert">{error}</p>}

      {tab === "manage" && (
        <section className="admin-panel">
          <div className="admin-section-heading">
            <div><p className="admin-kicker">Invitation list</p><h2>Guests</h2></div>
            <details className="admin-create">
              <summary>Add guest</summary>
              <AddExpectedGuestForm parties={parties} />
            </details>
          </div>

          {!expectedGuests.length ? <Empty>No guests yet. Add the first invitation above.</Empty> : (
            <div className="admin-table-wrap">
              <table className="admin-table admin-guests-table">
                <thead><tr><th>Name</th><th>Invitation</th><th>Party</th><th>Invited</th><th>Status</th><th>RSVP details</th><th>Actual</th><th>Message</th><th>Received</th><th><span className="sr-only">Actions</span></th></tr></thead>
                <tbody>{expectedGuests.map((guest) => {
                  const status = rsvpStatus(guest.rsvp);
                  const inviteUrl = process.env.ROOT_DOMAIN ? `https://${guest.slug}.${process.env.ROOT_DOMAIN}` : `/invite/${guest.slug}`;
                  return (
                    <tr key={guest.id}>
                      <td className="admin-primary-cell">{invitationName(guest)}</td>
                      <td className="admin-invitation-link"><a href={inviteUrl} target="_blank" rel="noreferrer">Open</a><CopyInvitationLink url={inviteUrl} /></td>
                      <td>{guest.party.name}</td>
                      <td>{guest.invitedPersons}</td>
                      <td><span className={`admin-status ${status.className}`}>{status.label}</span></td>
                      <td>{guest.rsvp ? <>{guest.rsvp.fullName}<small>{guest.rsvp.phoneNumber}{guest.rsvp.email ? ` · ${guest.rsvp.email}` : ""}<br />{guest.rsvp.whoAttending ? attendanceLabels[guest.rsvp.whoAttending] : "—"}</small></> : "—"}</td>
                      <td className={guest.rsvp && guest.rsvp.guestCount > guest.invitedPersons ? "admin-over-count" : ""}>{guest.rsvp?.guestCount ?? "—"}</td>
                      <td className="admin-message">{guest.rsvp?.message || "—"}</td>
                      <td>{guest.rsvp?.createdAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) ?? "—"}</td>
                      <td><AdminModal title={`Edit ${invitationName(guest)}`}>
                        <section className="admin-dialog-section"><h3>Invitation</h3><form action={updateExpectedGuest.bind(null, guest.id)} suppressHydrationWarning><ExpectedGuestFields guest={guest} parties={parties} /><div className="admin-form-actions"><AdminSubmitButton>Save invitation</AdminSubmitButton><AdminSubmitButton className="danger" formAction={deleteExpectedGuest.bind(null, guest.id)}>Delete guest</AdminSubmitButton></div></form></section>
                        <section className="admin-dialog-section"><h3>RSVP</h3>{guest.rsvp ? <form action={updateRsvp.bind(null, guest.rsvp.id)} suppressHydrationWarning><RsvpFields response={guest.rsvp} guests={guestOptions} returnTab="manage" /><div className="admin-form-actions"><AdminSubmitButton>Save RSVP</AdminSubmitButton><AdminSubmitButton className="danger" formAction={deleteRsvp.bind(null, guest.rsvp.id)}>Delete RSVP</AdminSubmitButton></div></form> : <form action={createRsvp} suppressHydrationWarning><RsvpFields guests={guestOptions} returnTab="manage" defaultGuest={guest.id} defaultName={invitationName(guest)} defaultCount={guest.invitedPersons} /><AdminSubmitButton>Add RSVP</AdminSubmitButton></form>}</section>
                      </AdminModal></td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {tab === "manage" && (
        <section className="admin-panel">
          <div className="admin-section-heading">
            <div><p className="admin-kicker">Unmatched submissions</p><h2>Unknown RSVP</h2></div>
            <details className="admin-create"><summary>Add response</summary><form action={createRsvp} suppressHydrationWarning><RsvpFields guests={guestOptions} returnTab="manage" /><AdminSubmitButton>Add response</AdminSubmitButton></form></details>
          </div>

          {!unmatchedResponses.length ? <Empty>No unknown RSVP submissions.</Empty> : (
            <div className="admin-table-wrap">
              <table className="admin-table admin-rsvp-table">
                <thead><tr><th>Guest</th><th>Status</th><th>Attendance</th><th>Guests</th><th>Message</th><th>Received</th><th><span className="sr-only">Actions</span></th></tr></thead>
                <tbody>{unmatchedResponses.map((response) => {
                  const status = rsvpStatus(response);
                  return <tr key={response.id}>
                    <td className="admin-primary-cell">{response.fullName}<small>{response.phoneNumber}{response.email ? ` · ${response.email}` : ""}</small></td>
                    <td><span className={`admin-status ${status.className}`}>{status.label}</span></td>
                    <td>{response.whoAttending ? attendanceLabels[response.whoAttending] : "—"}</td>
                    <td>{response.guestCount}</td>
                    <td className="admin-message">{response.message || "—"}</td>
                    <td>{response.createdAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</td>
                    <td><AdminModal title={`Edit RSVP from ${response.fullName}`}><form action={updateRsvp.bind(null, response.id)} suppressHydrationWarning><RsvpFields response={response} guests={guestOptions} returnTab="manage" /><div className="admin-form-actions"><AdminSubmitButton>Save RSVP</AdminSubmitButton><AdminSubmitButton className="danger" formAction={deleteRsvp.bind(null, response.id)}>Delete RSVP</AdminSubmitButton></div></form></AdminModal></td>
                  </tr>;
                })}</tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {tab === "manage" && role === "super" && (
        <section className="admin-panel">
          <div className="admin-section-heading">
            <div><p className="admin-kicker">Super admin</p><h2>Inviting party management</h2></div>
            <details className="admin-create"><summary>Add inviting party</summary><form action={createParty} suppressHydrationWarning><div className="admin-form-grid"><label suppressHydrationWarning>Party name<input name="name" required maxLength={120} suppressHydrationWarning /></label><label suppressHydrationWarning>By<input name="by" maxLength={120} suppressHydrationWarning /></label><label suppressHydrationWarning>Maximum guests<input name="maxGuestCount" type="number" min="0" max="9999" required suppressHydrationWarning /></label></div><AdminSubmitButton>Add party</AdminSubmitButton></form></details>
          </div>
          {!parties.length ? <Empty>No inviting parties yet. Add the first one above.</Empty> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Inviting party</th><th>By</th><th>Guest entries</th><th>Invited persons</th><th>Maximum guests</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{parties.map((party) => <tr key={party.id}><td className="admin-primary-cell">{party.name}</td><td>{party.by || "—"}</td><td>{party.expectedGuests.length}</td><td>{party.expectedGuests.reduce((sum, guest) => sum + guest.invitedPersons, 0)}</td><td>{party.maxGuestCount}</td><td><AdminModal title={`Edit ${party.name}`}><form action={updateParty.bind(null, party.id)} suppressHydrationWarning><div className="admin-form-grid"><label suppressHydrationWarning>Name<input name="name" defaultValue={party.name} required suppressHydrationWarning /></label><label suppressHydrationWarning>By<input name="by" defaultValue={party.by ?? ""} maxLength={120} suppressHydrationWarning /></label><label suppressHydrationWarning>Maximum guests<input name="maxGuestCount" type="number" min="0" defaultValue={party.maxGuestCount} required suppressHydrationWarning /></label></div><div className="admin-form-actions"><AdminSubmitButton>Save party</AdminSubmitButton><AdminSubmitButton className="danger" formAction={deleteParty.bind(null, party.id)}>Delete party</AdminSubmitButton></div><p className="admin-form-hint">Deleting a party also removes its guest entries. Matched RSVP responses remain unmatched.</p></form></AdminModal></td></tr>)}</tbody></table></div>}
        </section>
      )}

      {tab === "stats" && (
        <section className="admin-stats">
          <div className="admin-stats-heading">
            <p className="admin-kicker">At a glance</p>
            <h2>RSVP statistics</h2>
            <p>Live totals from invitation records and submitted responses.</p>
          </div>
          <div className="admin-chart-grid">
            <PieChart
              title="Invitation status"
              center={String(expectedGuests.length)}
              values={[
                { label: "Await", value: awaitingInvitations, color: "#a9a59d" },
                { label: "Confirmed", value: confirmedInvitations, color: "#315f53" },
                { label: "Denied", value: declinedInvitations, color: "#9c493f" },
                { label: "Requested changes", value: requestedInvitations, color: "#c6922d" },
              ]}
            />
            <PieChart
              title="Submitted responses"
              center={String(responses.length)}
              values={[
                { label: "Confirmed", value: confirmedResponses, color: "#315f53" },
                { label: "Denied", value: declinedResponses, color: "#9c493f" },
                { label: "Requested changes", value: requestedResponses, color: "#c6922d" },
              ]}
            />
            <PieChart
              title="Guest headcount"
              center={`${totalConfirmed}/${totalInvited}`}
              values={[
                { label: "Confirmed", value: Math.min(totalConfirmed, totalInvited), color: "#9a7440" },
                { label: "Places remaining", value: Math.max(0, totalInvited - totalConfirmed), color: "#d8cdb8" },
                { label: "Over invited total", value: Math.max(0, totalConfirmed - totalInvited), color: "#9c493f" },
              ]}
            />
          </div>
        </section>
      )}
    </main>
  );
}
