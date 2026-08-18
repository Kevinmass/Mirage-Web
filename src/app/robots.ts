import { headers } from "next/headers";
import type { MetadataRoute } from "next";
import { DOMINIO_CANONICO, esHostCanonico } from "@/lib/dominio";

// noindex en todo lo que no sea el dominio canónico (staging incluido).
// Un solo deploy sirve los tres dominios (diseño §3); lo que decide acá
// es el host de la request, no una variable de entorno por deploy.
export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = (await headers()).get("host");
  const permiteIndexacion = esHostCanonico(host);

  return {
    rules: permiteIndexacion
      ? {
          userAgent: "*",
          allow: "/",
          // /app y /portal no son contenido público aunque estén en el
          // dominio canónico — quedan afuera del índice igual.
          disallow: ["/app", "/portal"],
        }
      : { userAgent: "*", disallow: "/" },
    sitemap: permiteIndexacion
      ? `https://${DOMINIO_CANONICO}/sitemap.xml`
      : undefined,
  };
}
