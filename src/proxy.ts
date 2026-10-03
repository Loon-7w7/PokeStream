// Protege el panel: sin cookie de sesión redirige a /login.
// Públicos: login, beta (preregistro), privacidad, widget, su stream, /api/auth (OAuth), /api/dex y archivos estáticos (iconos).
// Es solo una comprobación optimista (no verifica la firma); la autorización real es requireUser() en getCurrentRun/mutateRun.
// Excepción documentada: lee process.env directamente (no puede importar módulos server-only).
import { NextResponse, type NextRequest } from "next/server";

export function proxy(req: NextRequest) {
  if (!process.env.GOOGLE_CLIENT_ID) return NextResponse.next();
  if (req.cookies.has("session")) return NextResponse.next();
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!login|beta|privacidad|widget/|api/stream/|api/auth/|api/dex|_next/|.*\\.(?:svg|png|ico|txt)$).*)"],
};
