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


export type GeneratedArticle = {
  title: string;
  slug: string;
  metaDescription: string;
  excerpt: string;
  contentMarkdown: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  faq: Array<{ question: string; answer: string }>;
  wordCount: number;
  seoScore: number;
};

function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function calculateSeoScore(
  article: Omit<GeneratedArticle, "wordCount" | "seoScore">,
  keyword: string
) {
  const normalizedKeyword = keyword.toLocaleLowerCase("pt-BR");
  const title = article.title.toLocaleLowerCase("pt-BR");
  const content = article.contentMarkdown.toLocaleLowerCase("pt-BR");
  const firstSection = content.slice(0, 700);
  const words = countWords(article.contentMarkdown);
  let score = 0;

  if (title.includes(normalizedKeyword)) score += 20;
  if (firstSection.includes(normalizedKeyword)) score += 15;
  if (content.includes(normalizedKeyword)) score += 10;
  if (words >= 1200) score += 20;
  else if (words >= 900) score += 10;
  if (article.metaDescription.length >= 120 && article.metaDescription.length <= 160) score += 15;
  if ((article.secondaryKeywords || []).length >= 5) score += 10;
  if ((article.faq || []).length >= 4) score += 10;

  return Math.min(100, score);
}

export async function generateSeoArticle(
  keyword: string,
  research: Record<string, unknown>
): Promise<GeneratedArticle> {
  const ai = client();
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const briefing = JSON.stringify(research, null, 2);

  const prompt = `
Você é um redator SEO sênior. Crie um artigo original em português do Brasil
para a palavra-chave principal: "${keyword}".

Use o briefing abaixo, produzido a partir de uma SERP real do Google Brasil:
${briefing}

Requisitos obrigatórios:
- Entre 1.200 e 1.800 palavras no campo contentMarkdown.
- Responder diretamente à intenção de busca.
- Introdução curta e objetiva, sem frases genéricas.
- Usar H2 e H3 em Markdown, listas quando ajudarem e conclusão prática.
- Incluir a palavra-chave no título, na introdução e naturalmente no texto.
- Incorporar lacunas e oportunidades do briefing.
- Não copiar concorrentes, não inventar pesquisas, leis, preços ou estatísticas.
- Quando a informação exigir validação externa, escrever de forma cautelosa.
- Criar de 4 a 6 perguntas frequentes com respostas úteis.
- Meta description entre 120 e 160 caracteres.
- Slug curto, sem acentos, em letras minúsculas e separado por hífens.
- Não incluir o título H1 novamente dentro de contentMarkdown.
- Retornar SOMENTE JSON válido.

Estrutura:
{
  "title": "",
  "slug": "",
  "metaDescription": "",
  "excerpt": "",
  "contentMarkdown": "",
  "primaryKeyword": "${keyword}",
  "secondaryKeywords": [],
  "faq": [
    {"question": "", "answer": ""}
  ]
}
`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      temperature: 0.35,
      responseMimeType: "application/json",
      maxOutputTokens: 12000,
    },
  });

  const text = response.text?.trim();
  if (!text) throw new Error("O Gemini não retornou o artigo.");
  const raw = parseJson(text);

  const base = {
    title: String(raw.title || ""),
    slug: String(raw.slug || ""),
    metaDescription: String(raw.metaDescription || ""),
    excerpt: String(raw.excerpt || ""),
    contentMarkdown: String(raw.contentMarkdown || ""),
    primaryKeyword: String(raw.primaryKeyword || keyword),
    secondaryKeywords: Array.isArray(raw.secondaryKeywords)
      ? raw.secondaryKeywords.map(String)
      : [],
    faq: Array.isArray(raw.faq)
      ? raw.faq.map((item: any) => ({
          question: String(item?.question || ""),
          answer: String(item?.answer || ""),
        }))
      : [],
  };

  if (!base.title || !base.contentMarkdown) {
    throw new Error("O Gemini retornou um artigo incompleto.");
  }

  const wordCount = countWords(base.contentMarkdown);
  return {
    ...base,
    wordCount,
    seoScore: calculateSeoScore(base, keyword),
  };
}
