import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { DOMINIO_CANONICO, DOMINIO_STORE } from "@/lib/dominio";
import { decidirAcceso } from "@/kernel/identidad/reglas-acceso";
import { obtenerSesion } from "@/kernel/identidad/sesion";

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0];

  if (host === DOMINIO_STORE || host === `www.${DOMINIO_STORE}`) {
    const destino = new URL(
      request.nextUrl.pathname + request.nextUrl.search,
      `https://${DOMINIO_CANONICO}`,
    );
    return NextResponse.redirect(destino, 301);
  }

  const sesion = await obtenerSesion(request);
  const decision = decidirAcceso(request.nextUrl.pathname, sesion);

  if (decision === "no-encontrado") {
    // Rewrite a una ruta inexistente en vez de un 403: la regla (diseño
    // §3) es que un contacto_cliente pidiendo /app (o viceversa) no debe
    // poder distinguir "no tenés acceso" de "esto no existe".
    const noEncontrado = new URL(request.nextUrl.pathname, request.url);
    noEncontrado.pathname = "/__no-encontrado__";
    return NextResponse.rewrite(noEncontrado);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Todo salvo assets internos de Next.
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
