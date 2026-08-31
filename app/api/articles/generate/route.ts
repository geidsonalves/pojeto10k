import { generateSeoArticle } from "@/lib/gemini";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const keyword = String(body?.keyword || "").trim();
    const research = body?.research;

    if (!keyword || !research || typeof research !== "object") {
      return Response.json(
        { error: "Faça a pesquisa SERP antes de gerar o artigo." },
        { status: 400 }
      );
    }

    const article = await generateSeoArticle(keyword, research);
    return Response.json({ article });
  } catch (error) {
    console.error("Article generation error:", error);
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro durante a geração do artigo.",
      },
      { status: 500 }
    );
  }
}
