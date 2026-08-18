import type { MetadataRoute } from "next";

// noindex por defecto (staging incluido). El dominio canónico habilita
// indexación seteando ALLOW_INDEXING=true (PR 1.4).
export default function robots(): MetadataRoute.Robots {
  const permiteIndexacion = process.env.ALLOW_INDEXING === "true";

  return {
    rules: {
      userAgent: "*",
      allow: permiteIndexacion ? "/" : undefined,
      disallow: permiteIndexacion ? undefined : "/",
    },
  };
}
