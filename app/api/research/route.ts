import { researchKeyword } from "@/lib/gemini";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const keyword = String(body?.keyword || "").trim();
    if (!keyword) return Response.json({error:"Informe uma palavra-chave."},{status:400});
    return Response.json({research: await researchKeyword(keyword)});
  } catch (e) {
    return Response.json({error:e instanceof Error ? e.message : "Erro na pesquisa."},{status:500});
  }
}
