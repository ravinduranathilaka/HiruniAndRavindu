export const slugify = (name: string) =>
  name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const createInvitationSlug = (name: string, suffix: string) => {
  const base = slugify(name).slice(0, 50).replace(/-$/, "");
  return base ? `${base}-${suffix}` : "";
};
