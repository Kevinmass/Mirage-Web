import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { DOMINIO_CANONICO, DOMINIO_STORE } from "@/lib/dominio";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0];

  if (host === DOMINIO_STORE || host === `www.${DOMINIO_STORE}`) {
    const destino = new URL(
      request.nextUrl.pathname + request.nextUrl.search,
      `https://${DOMINIO_CANONICO}`,
    );
    return NextResponse.redirect(destino, 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Todo salvo assets internos de Next.
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
