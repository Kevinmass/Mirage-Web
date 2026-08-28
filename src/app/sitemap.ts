import type { MetadataRoute } from "next";
import { DOMINIO_CANONICO } from "@/lib/dominio";

const base = `https://${DOMINIO_CANONICO}`;

export default function sitemap(): MetadataRoute.Sitemap {
  const rutas = ["", "/servicios", "/casos", "/contacto"];

  return rutas.map((ruta) => ({
    url: `${base}${ruta}`,
    lastModified: new Date(),
  }));
}
