"use client";

import { useEffect, useState } from "react";
import Shell from "@/components/Shell";

type Site = { id: string; name: string };
type KeywordItem = {
  id: string;
  keyword: string;
  category: string | null;
  priority: string;
  status: string;
};
type Research = {
  keyword: string;
  intent: string;
  intentExplanation: string;
  topResults: any[];
  commonTopics: string[];
  gaps: string[];
  opportunities?: string[];
  relatedKeywords: string[];
  questions: string[];
  recommendedOutline: string[];
  sources: any[];
};
type Article = {
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

async function readJsonResponse(response: Response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(text.slice(0, 300) || `Falha HTTP ${response.status}`);
  }
}

export default function Keywords() {
  const [sites, setSites] = useState<Site[]>([]);
  const [items, setItems] = useState<KeywordItem[]>([]);
  const [siteId, setSiteId] = useState("");
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("medium");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [research, setResearch] = useState<Research | null>(null);
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState("");
  const [generatingArticle, setGeneratingArticle] = useState(false);

  async function load() {
    const [sitesResponse, keywordsResponse] = await Promise.all([
      fetch("/api/sites"),
      fetch("/api/keywords"),
    ]);
    const sitesJson = await sitesResponse.json();
    const keywordsJson = await keywordsResponse.json();
    setSites(sitesJson.sites || []);
    setItems(keywordsJson.keywords || []);
    if (!siteId && sitesJson.sites?.[0]) setSiteId(sitesJson.sites[0].id);
  }

  useEffect(() => {
    load();
  }, []);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/keywords", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        site_id: siteId,
        keyword,
        category,
        priority,
      }),
    });
    const json = await response.json();
    if (!response.ok) {
      setError(json.error || "Erro");
      return;
    }
    setKeyword("");
    setCategory("");
    setMessage("Palavra-chave adicionada à fila.");
    load();
  }

  async function remove(id: string) {
    if (confirm("Excluir esta palavra-chave?")) {
      await fetch("/api/keywords/" + id, { method: "DELETE" });
      load();
    }
  }

  async function researchSerp(value: string) {
    setLoading(value);
    setError("");
    setMessage("");
    setResearch(null);
    setArticle(null);
    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: value }),
      });
      const json = await readJsonResponse(response);
      if (!response.ok) {
        throw new Error(json.error || `Falha HTTP ${response.status}`);
      }
      setResearch(json.research);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Erro na pesquisa."
      );
    } finally {
      setLoading("");
    }
  }

  async function generateArticle() {
    if (!research) return;
    setGeneratingArticle(true);
    setError("");
    setMessage("");
    setArticle(null);
    try {
      const response = await fetch("/api/articles/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: research.keyword,
          research,
        }),
      });
      const json = await readJsonResponse(response);
      if (!response.ok) {
        throw new Error(json.error || `Falha HTTP ${response.status}`);
      }
      setArticle(json.article);
      setMessage("Artigo gerado com sucesso.");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Erro durante a geração do artigo."
      );
    } finally {
      setGeneratingArticle(false);
    }
  }

  return (
    <Shell>
      <div className="title">Palavras-chave</div>
      <p className="subtitle">
        Fila SEO com SERP real do Google via DataForSEO + análise do Gemini.
      </p>

      {error && <div className="error">{error}</div>}
      {message && <div className="success">{message}</div>}

      <section className="section card">
        <form className="form" onSubmit={save}>
          <label>
            Site
            <select
              className="input"
              required
              value={siteId}
              onChange={(event) => setSiteId(event.target.value)}
            >
              <option value="">Selecione</option>
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Palavra-chave
            <input
              className="input"
              required
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="curso técnico em segurança do trabalho"
            />
          </label>
          <label>
            Categoria
            <input
              className="input"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            />
          </label>
          <label>
            Prioridade
            <select
              className="input"
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
            >
              <option value="high">Alta</option>
              <option value="medium">Média</option>
              <option value="low">Baixa</option>
            </select>
          </label>
          <button className="button" disabled={!sites.length}>
            Adicionar à fila
          </button>
        </form>
      </section>

      <section className="section card">
        <h2>Fila</h2>
        {items.length ? (
          <table className="table">
            <thead>
              <tr>
                <th>Keyword</th>
                <th>Categoria</th>
                <th>Prioridade</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.keyword}</td>
                  <td>{item.category || "—"}</td>
                  <td>{item.priority}</td>
                  <td>
                    <span className="status">{item.status}</span>
                  </td>
                  <td>
                    <button
                      className="button"
                      disabled={loading === item.keyword}
                      onClick={() => researchSerp(item.keyword)}
                    >
                      {loading === item.keyword
                        ? "Pesquisando..."
                        : "Pesquisar SERP"}
                    </button>{" "}
                    <button
                      className="button danger"
                      onClick={() => remove(item.id)}
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="muted">Nenhuma palavra-chave cadastrada.</p>
        )}
      </section>

      {research && (
        <section className="section card">
          <h2>Briefing SEO: {research.keyword}</h2>
          <p>
            <strong>Intenção:</strong> {research.intent}
          </p>
          <p>{research.intentExplanation}</p>

          <h3>5 resultados selecionados</h3>
          <ol>
            {research.topResults?.slice(0, 5).map((result: any) => (
              <li key={result.position} style={{ marginBottom: 18 }}>
                <strong>
                  {result.position}. {result.title}
                </strong>
                <br />
                <a href={result.url} target="_blank" rel="noreferrer">
                  {result.url}
                </a>
                <p>{result.summary}</p>
              </li>
            ))}
          </ol>

          <h3>Tópicos em comum</h3>
          <ul>
            {research.commonTopics?.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>

          <h3>Lacunas e oportunidades</h3>
          <ul>
            {[...(research.gaps || []), ...(research.opportunities || [])].map(
              (item, index) => (
                <li key={index}>{item}</li>
              )
            )}
          </ul>

          <h3>Palavras relacionadas</h3>
          <p>{research.relatedKeywords?.join(" • ")}</p>

          <h3>Perguntas</h3>
          <ul>
            {research.questions?.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>

          <h3>Estrutura recomendada</h3>
          <ul>
            {research.recommendedOutline?.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>

          <button
            className="button"
            disabled={generatingArticle}
            onClick={generateArticle}
          >
            {generatingArticle
              ? "Gerando artigo..."
              : "Gerar artigo completo"}
          </button>
        </section>
      )}

      {article && (
        <section className="section card">
          <h2>{article.title}</h2>
          <p className="muted">
            {article.wordCount} palavras • Score SEO {article.seoScore}/100
          </p>
          <p>
            <strong>Slug:</strong> {article.slug}
          </p>
          <p>
            <strong>Meta description:</strong> {article.metaDescription}
          </p>
          <p>
            <strong>Palavras relacionadas:</strong>{" "}
            {article.secondaryKeywords?.join(" • ")}
          </p>
          <hr style={{ margin: "24px 0", borderColor: "#e5e7eb" }} />
          <article style={{ whiteSpace: "pre-wrap", lineHeight: 1.8 }}>
            {article.contentMarkdown}
          </article>

          <h3>Perguntas frequentes</h3>
          {article.faq?.map((item, index) => (
            <div key={index} style={{ marginBottom: 16 }}>
              <strong>{item.question}</strong>
              <p>{item.answer}</p>
            </div>
          ))}
        </section>
      )}
    </Shell>
  );
}
