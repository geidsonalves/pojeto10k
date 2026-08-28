import { GoogleGenAI } from "@google/genai";

function client() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY não configurada na Vercel.");
  return new GoogleGenAI({ apiKey: key });
}

export async function researchKeyword(keyword: string) {
  const ai = client();
  const prompt = `Pesquise no Google a SERP para a palavra-chave "${keyword}" usando a Pesquisa Google.
Identifique os 5 resultados orgânicos mais relevantes encontrados. Exclua anúncios quando possível.
Para cada resultado informe posição, título, URL, domínio, resumo, headings importantes e tópicos.
Depois informe: intenção de busca, explicação da intenção, tópicos comuns, lacunas/oportunidades,
palavras-chave relacionadas, perguntas frequentes e uma estrutura H2/H3 recomendada.
Não copie textos. Não invente URLs, estatísticas ou fontes.
Responda SOMENTE JSON válido neste formato:
{"keyword":"...","intent":"...","intentExplanation":"...","topResults":[{"position":1,"title":"...","url":"...","domain":"...","summary":"...","headings":[],"topics":[]}],"commonTopics":[],"gaps":[],"relatedKeywords":[],"questions":[],"recommendedOutline":[],"sources":[{"title":"...","url":"..."}]}`;

  const response = await ai.models.generateContent({
    model: "gemini-3.7-flash",
    contents: prompt,
    config: { tools: [{ googleSearch: {} }], temperature: 0.2 }
  });

  const text = response.text?.trim();
  if (!text) throw new Error("Gemini não retornou conteúdo.");
  const clean = text.replace(/```json/gi,"").replace(/```/g,"").trim();
  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}");
  if (start < 0 || end < start) throw new Error("Gemini não retornou JSON válido.");
  return JSON.parse(clean.slice(start,end+1));
}
