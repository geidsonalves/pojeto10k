import { GoogleGenAI } from "@google/genai";

const DEFAULT_MODEL = "gemini-2.5-flash";

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

export async function researchKeyword(keyword: string) {
  const ai = client();
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;

  const prompt = `
Você é um pesquisador SEO. Pesquise na web a SERP para:
"${keyword}"

Use a Pesquisa Google para encontrar até 5 resultados orgânicos relevantes.
Não considere anúncios como resultados orgânicos.

Para cada resultado informe: posição aproximada, título, URL, domínio,
resumo, headings/tópicos importantes e assuntos abordados.

Depois informe: intenção de busca, explicação da intenção, tópicos comuns,
lacunas de conteúdo, oportunidades de diferenciação, palavras-chave
relacionadas, perguntas frequentes e estrutura H2/H3 recomendada.

Não copie textos. Não invente URLs, estatísticas ou fontes.
Se algo não puder ser confirmado, deixe vazio ou explique.
Retorne SOMENTE JSON válido.

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
        tools: [{ googleSearch: {} }],
        temperature: 0.2
      }
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
        "A cota gratuita do Gemini foi atingida. Aguarde a renovação da cota diária. O sistema está usando gemini-2.5-flash."
      );
    }
    throw error;
  }
}
