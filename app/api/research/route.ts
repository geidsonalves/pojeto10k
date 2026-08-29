import { fetchGoogleSerp } from "@/lib/dataforseo";
import { researchKeyword } from "@/lib/gemini";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const keyword = String(body?.keyword || "").trim();

    if (!keyword) {
      return Response.json(
        { error: "Informe uma palavra-chave." },
        { status: 400 }
      );
    }

    if (keyword.length > 200) {
      return Response.json(
        { error: "A palavra-chave deve ter no máximo 200 caracteres." },
        { status: 400 }
      );
    }

    const serp = await fetchGoogleSerp(keyword);
    const research = await researchKeyword(keyword, serp);

    return Response.json({
      research,
      serpMeta: {
        searchedAt: serp.searchedAt,
        searchDomain: serp.searchDomain,
        organicResultsFound: serp.results.length,
        costUsd: serp.costUsd,
      },
    });
  } catch (e) {
    console.error("SERP research error:", e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Erro na pesquisa." },
      { status: 500 }
    );
  }
}
