export type SerpResult = {
  position: number;
  title: string;
  url: string;
  domain: string;
  description: string;
};

export type SerpResearch = {
  keyword: string;
  searchedAt: string | null;
  searchDomain: string;
  costUsd: number | null;
  results: SerpResult[];
};

export async function fetchGoogleSerp(keyword: string): Promise<SerpResearch> {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;

  if (!login || !password) {
    throw new Error("Credenciais do DataForSEO não configuradas na Vercel.");
  }

  const response = await fetch(
    "https://api.dataforseo.com/v3/serp/google/organic/live/advanced",
    {
      method: "POST",
      headers: {
        Authorization:
          "Basic " + Buffer.from(login + ":" + password).toString("base64"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        {
          keyword,
          location_code: 2076,
          language_code: "pt",
          device: "desktop",
          os: "windows",
          depth: 10,
          remove_from_url: ["srsltid"],
        },
      ]),
      cache: "no-store",
    }
  );

  const payload = await response.json().catch(() => ({}));
  const task = payload?.tasks?.[0];

  if (
    !response.ok ||
    payload?.status_code !== 20000 ||
    task?.status_code !== 20000
  ) {
    const detail =
      task?.status_message ||
      payload?.status_message ||
      `Erro ${response.status} na API do DataForSEO.`;
    throw new Error(detail);
  }

  const result = task?.result?.[0];
  const results: SerpResult[] = (result?.items || [])
    .filter((item: any) => item?.type === "organic" && item?.url)
    .slice(0, 10)
    .map((item: any, index: number) => ({
      position: Number(item.rank_group || item.rank_absolute || index + 1),
      title: String(item.title || ""),
      url: String(item.url || ""),
      domain: String(item.domain || ""),
      description: String(item.description || ""),
    }));

  if (!results.length) {
    throw new Error(
      "O DataForSEO não encontrou resultados orgânicos para essa palavra-chave."
    );
  }

  return {
    keyword: String(result?.keyword || keyword),
    searchedAt: result?.datetime || null,
    searchDomain: result?.se_domain || "google.com.br",
    costUsd: typeof task?.cost === "number" ? task.cost : null,
    results,
  };
}
