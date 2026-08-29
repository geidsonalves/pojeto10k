import { GoogleGenAI } from "@google/genai";
import type { SerpResearch } from "@/lib/dataforseo";

const DEFAULT_MODEL = "gemini-3.6-flash";

function client() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY não configurada na Vercel.");
  }
  return new GoogleGenAI({ apiKey: key });
}

function parseJson(text: string) {
  const clean = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}");
  if (start < 0 || end < start) {
    throw new Error("O Gemini não retornou um JSON válido.");
  }
  return JSON.parse(clean.slice(start, end + 1));
}

export async function researchKeyword(
  keyword: string,
  serp: SerpResearch
) {
  const ai = client();
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const serpEvidence = JSON.stringify(serp, null, 2);

  const prompt = `
Você é um pesquisador e estrategista SEO. Analise a palavra-chave:
"${keyword}"

Abaixo estão 10 resultados orgânicos reais do Google Brasil, obtidos agora
pelo DataForSEO. Selecione os 5 resultados que representam conteúdos
concorrentes mais relevantes para a intenção de busca. Evite priorizar anúncios,
resultados pouco relacionados, páginas institucionais sem conteúdo, vídeos,
fóruns ou PDFs quando houver artigos concorrentes melhores.

DADOS REAIS DA SERP:
${serpEvidence}

Use somente os títulos, URLs, domínios e descrições fornecidos como evidência
da SERP. Não afirme que leu ou auditou o conteúdo completo das páginas.
Headings e tópicos que não puderem ser confirmados devem ser inferidos com
cautela e identificados como sugestões, nunca como fatos observados.
Não copie textos e não invente URLs, métricas, estatísticas ou fontes.

Depois informe: intenção de busca, explicação da intenção, tópicos comuns,
lacunas de conteúdo, oportunidades de diferenciação, palavras-chave
relacionadas, perguntas frequentes e estrutura H2/H3 recomendada.

Retorne SOMENTE JSON válido seguindo exatamente esta estrutura:
{
  "keyword": "${keyword}",
  "intent": "",
  "intentExplanation": "",
  "topResults": [
    {
      "position": 1,
      "title": "",
      "url": "",
      "domain": "",
      "summary": "",
      "headings": [],
      "topics": []
    }
  ],
  "commonTopics": [],
  "gaps": [],
  "opportunities": [],
  "relatedKeywords": [],
  "questions": [],
  "recommendedOutline": [],
  "sources": [{"title": "", "url": ""}]
}
`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    });

    const text = response.text?.trim();
    if (!text) throw new Error("O Gemini não retornou conteúdo.");
    return parseJson(text);
  } catch (error: any) {
    const message = String(error?.message || error);
    if (
      message.includes("429") ||
      message.includes("RESOURCE_EXHAUSTED") ||
      message.toLowerCase().includes("quota")
    ) {
      throw new Error(
        `A cota do Gemini foi atingida. Aguarde a renovação ou verifique a chave. Modelo atual: ${model}.`
      );
    }
    throw error;
  }
}
