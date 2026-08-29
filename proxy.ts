import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const rootDomain = process.env.ROOT_DOMAIN?.toLowerCase().replace(/^www\./, "");
  if (!rootDomain) return NextResponse.next();

  const hostname = (request.headers.get("host") ?? "").split(":")[0].toLowerCase();
  if (!hostname.endsWith(`.${rootDomain}`)) return NextResponse.next();

  const slug = hostname.slice(0, -(rootDomain.length + 1));
  if (!slug || slug === "www" || slug.includes(".")) return NextResponse.next();

  return NextResponse.rewrite(new URL(`/invite/${encodeURIComponent(slug)}`, request.url));
}

export const config = { matcher: "/" };
