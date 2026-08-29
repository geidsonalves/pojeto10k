"use client";
import {useEffect,useState} from "react";
import Shell from "@/components/Shell";
type Site={id:string;name:string};
type K={id:string;keyword:string;category:string|null;priority:string;status:string};
type Research={keyword:string;intent:string;intentExplanation:string;topResults:any[];commonTopics:string[];gaps:string[];relatedKeywords:string[];questions:string[];recommendedOutline:string[];sources:any[]};

export default function Keywords(){
 const[sites,setSites]=useState<Site[]>([]),[items,setItems]=useState<K[]>([]);
 const[siteId,setSiteId]=useState(""),[keyword,setKeyword]=useState(""),[category,setCategory]=useState(""),[priority,setPriority]=useState("medium");
 const[msg,setMsg]=useState(""),[error,setError]=useState(""),[research,setResearch]=useState<Research|null>(null),[loading,setLoading]=useState("");
 async function load(){const[a,b]=await Promise.all([fetch("/api/sites"),fetch("/api/keywords")]);const ja=await a.json(),jb=await b.json();setSites(ja.sites||[]);setItems(jb.keywords||[]);if(!siteId&&ja.sites?.[0])setSiteId(ja.sites[0].id)}
 useEffect(()=>{load()},[]);
 async function save(e:React.FormEvent){e.preventDefault();setError("");const r=await fetch("/api/keywords",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({site_id:siteId,keyword,category,priority})});const j=await r.json();if(!r.ok){setError(j.error||"Erro");return}setKeyword("");setCategory("");setMsg("Palavra-chave adicionada à fila.");load()}
 async function remove(id:string){if(confirm("Excluir esta palavra-chave?")){await fetch("/api/keywords/"+id,{method:"DELETE"});load()}}
 async function researchSerp(k:string){setLoading(k);setError("");setResearch(null);try{const r=await fetch("/api/research",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({keyword:k})});const j=await r.json();if(!r.ok)throw new Error(j.error);setResearch(j.research)}catch(e){setError(e instanceof Error?e.message:"Erro na pesquisa.")}finally{setLoading("")}}
 return <Shell><div className="title">Palavras-chave</div><p className="subtitle">Fila SEO com SERP real do Google via DataForSEO + análise do Gemini.</p>
 {error&&<div className="error">{error}</div>}{msg&&<div className="success">{msg}</div>}
 <section className="section card"><form className="form" onSubmit={save}>
 <label>Site<select className="input" required value={siteId} onChange={e=>setSiteId(e.target.value)}><option value="">Selecione</option>{sites.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
 <label>Palavra-chave<input className="input" required value={keyword} onChange={e=>setKeyword(e.target.value)} placeholder="curso técnico em segurança do trabalho"/></label>
 <label>Categoria<input className="input" value={category} onChange={e=>setCategory(e.target.value)}/></label>
 <label>Prioridade<select className="input" value={priority} onChange={e=>setPriority(e.target.value)}><option value="high">Alta</option><option value="medium">Média</option><option value="low">Baixa</option></select></label>
 <button className="button" disabled={!sites.length}>Adicionar à fila</button></form></section>
 <section className="section card"><h2>Fila</h2>{items.length?<table className="table"><thead><tr><th>Keyword</th><th>Categoria</th><th>Prioridade</th><th>Status</th><th>Ações</th></tr></thead><tbody>{items.map(k=><tr key={k.id}><td>{k.keyword}</td><td>{k.category||"—"}</td><td>{k.priority}</td><td><span className="status">{k.status}</span></td><td><button className="button" disabled={loading===k.keyword} onClick={()=>researchSerp(k.keyword)}>{loading===k.keyword?"Pesquisando...":"Pesquisar SERP"}</button>{" "}<button className="button danger" onClick={()=>remove(k.id)}>Excluir</button></td></tr>)}</tbody></table>:<p className="muted">Nenhuma palavra-chave cadastrada.</p>}</section>
 {research&&<section className="section card"><h2>Pesquisa SERP: {research.keyword}</h2><p><strong>Intenção:</strong> {research.intent}</p><p>{research.intentExplanation}</p><h3>5 resultados encontrados</h3><ol>{research.topResults?.slice(0,5).map((r:any)=><li key={r.position} style={{marginBottom:18}}><strong>{r.position}. {r.title}</strong><br/><a href={r.url} target="_blank" rel="noreferrer">{r.url}</a><p>{r.summary}</p></li>)}</ol><h3>Tópicos em comum</h3><ul>{research.commonTopics?.map((x,i)=><li key={i}>{x}</li>)}</ul><h3>Lacunas</h3><ul>{research.gaps?.map((x,i)=><li key={i}>{x}</li>)}</ul><h3>Palavras relacionadas</h3><p>{research.relatedKeywords?.join(" • ")}</p><h3>Perguntas</h3><ul>{research.questions?.map((x,i)=><li key={i}>{x}</li>)}</ul><h3>Estrutura recomendada</h3><ul>{research.recommendedOutline?.map((x,i)=><li key={i}>{x}</li>)}</ul><h3>Fontes</h3><ul>{research.sources?.map((s:any,i)=><li key={i}><a href={s.url} target="_blank" rel="noreferrer">{s.title}</a></li>)}</ul></section>}
 </Shell>
}
