import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const article = body?.article;
    const siteId = String(body?.siteId || "").trim();
    const keywordId = String(body?.keywordId || "").trim();

    if (!siteId || !keywordId || !article?.title || !article?.contentMarkdown) {
      return Response.json(
        { error: "Site, palavra-chave e artigo são obrigatórios." },
        { status: 400 }
      );
    }

    const record = {
      site_id: siteId,
      keyword_id: keywordId,
      title: String(article.title),
      slug: String(article.slug || ""),
      meta_description: String(article.metaDescription || ""),
      excerpt: String(article.excerpt || ""),
      content: String(article.contentMarkdown),
      primary_keyword: String(article.primaryKeyword || ""),
      secondary_keywords: Array.isArray(article.secondaryKeywords)
        ? article.secondaryKeywords
        : [],
      faq: Array.isArray(article.faq) ? article.faq : [],
      word_count: Number(article.wordCount || 0),
      seo_score: Number(article.seoScore || 0),
      status: "draft",
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("articles")
      .upsert(record, { onConflict: "keyword_id" })
      .select("id,title,status,seo_score,word_count,created_at")
      .single();

    if (error) {
      console.error("Article save error:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ article: data }, { status: 201 });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro ao salvar o artigo.",
      },
      { status: 500 }
    );
  }
}
