// Protege el panel: sin cookie válida redirige a /login.
// El widget (/widget/*), su stream (/api/stream/*) y /api/dex son públicos.
// Las server actions además validan con requireAdmin().
import { NextResponse, type NextRequest } from "next/server";

export function proxy(req: NextRequest) {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) return NextResponse.next();
  if (req.cookies.get("admin_token")?.value === expected) return NextResponse.next();
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!login|widget|api/stream|api/dex|_next|favicon.ico).*)"],
};
