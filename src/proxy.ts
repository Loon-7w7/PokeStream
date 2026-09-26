// Protege el panel: sin cookie válida redirige a /login.
// Públicos: widget, su stream, /api/dex y archivos estáticos (iconos).
// Es solo una comprobación optimista; la autorización real es requireAdmin() en mutateRun.
// Excepción documentada: lee process.env directamente (no puede importar módulos server-only).
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
  matcher: ["/((?!login|widget/|api/stream/|api/dex|_next/|.*\\.(?:svg|png|ico|txt)$).*)"],
};
