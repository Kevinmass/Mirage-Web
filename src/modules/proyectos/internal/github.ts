// Cliente mínimo de la API REST de GitHub — solo lectura, solo lo que
// necesita el snapshot (diseño §6.3): total de commits, PRs abiertas y
// cerradas, contribuyentes, fecha del último commit. Sin dependencia
// (octokit, etc.): son 4 GET.
//
// GITHUB_TOKEN es opcional acá a propósito: sin él, GitHub igual
// responde para repos públicos (con un rate limit más bajo) — no hace
// falta bloquear el desarrollo esperando el token fino de organización
// (S0.5 en el plan, es un permiso a pedir, no código). Con repos
// privados sí hace falta.
export interface DatosGitHub {
  commitsTotal: number;
  prsAbiertas: number;
  prsCerradas: number;
  contribuyentes: number;
  ultimoCommitEn: Date | null;
}

function cabeceras(): HeadersInit {
  const base: HeadersInit = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const token = process.env.GITHUB_TOKEN;
  return token ? { ...base, Authorization: `Bearer ${token}` } : base;
}

// Truco estándar para no descargar todas las páginas solo para
// contarlas: con per_page=1, el header Link trae rel="last" con el
// número de la última página — que es el total de elementos.
function totalDesdeLinkHeader(respuesta: Response, siPocos: number): number {
  const link = respuesta.headers.get("link");
  if (!link) return siPocos;
  const match = /[?&]page=(\d+)>;\s*rel="last"/.exec(link);
  return match ? Number(match[1]) : siPocos;
}

async function pedir(fetchImpl: typeof fetch, url: string): Promise<Response> {
  const respuesta = await fetchImpl(url, { headers: cabeceras() });
  if (!respuesta.ok) {
    throw new Error(
      `GitHub respondió ${respuesta.status} en ${url.replace("https://api.github.com", "")}`,
    );
  }
  return respuesta;
}

export async function obtenerDatosDeRepositorio(
  owner: string,
  repo: string,
  fetchImpl: typeof fetch = fetch,
): Promise<DatosGitHub> {
  const base = `https://api.github.com/repos/${owner}/${repo}`;

  const [commitsRes, abiertasRes, cerradasRes, contribuyentesRes] =
    await Promise.all([
      pedir(fetchImpl, `${base}/commits?per_page=1`),
      pedir(
        fetchImpl,
        `https://api.github.com/search/issues?q=repo:${owner}/${repo}+type:pr+state:open`,
      ),
      pedir(
        fetchImpl,
        `https://api.github.com/search/issues?q=repo:${owner}/${repo}+type:pr+state:closed`,
      ),
      pedir(fetchImpl, `${base}/contributors?per_page=1&anon=true`),
    ]);

  const commits = (await commitsRes.json()) as {
    commit?: { author?: { date?: string } };
  }[];
  const abiertas = (await abiertasRes.json()) as { total_count: number };
  const cerradas = (await cerradasRes.json()) as { total_count: number };
  const contribuyentes = (await contribuyentesRes.json()) as unknown[];

  const fechaUltimoCommit = commits[0]?.commit?.author?.date;

  return {
    commitsTotal: totalDesdeLinkHeader(commitsRes, commits.length),
    prsAbiertas: abiertas.total_count,
    prsCerradas: cerradas.total_count,
    contribuyentes: totalDesdeLinkHeader(
      contribuyentesRes,
      contribuyentes.length,
    ),
    ultimoCommitEn: fechaUltimoCommit ? new Date(fechaUltimoCommit) : null,
  };
}
