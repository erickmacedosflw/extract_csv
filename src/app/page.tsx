"use client";

import { ChangeEvent, useState } from "react";

type Result = { csv: string; filename: string } | { error: string };

const requestExample = `{
  "file": "data:text/csv;base64,bmFtZSx2YWx1ZQpBbGljZSwyMA==",
  "filename": "dados.csv"
}`;

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setResult(null);
    if (!file) return;

    setIsLoading(true);
    try {
      const encoded = await readAsDataUri(file);
      const response = await fetch("/api/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file: encoded, filename: file.name }),
      });

      if (!response.ok) {
        const error = (await response.json()) as { error?: string };
        setResult({ error: error.error ?? "Não foi possível converter o arquivo." });
        return;
      }

      setResult({ csv: await response.text(), filename: `${file.name.replace(/\.[^.]+$/, "")}.csv` });
    } catch {
      setResult({ error: "Não foi possível conectar à API." });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="extract_csv início"><span className="brand-mark">{`{ }`}</span><span>extract_csv</span></a>
        <nav className="topnav" aria-label="Navegação principal"><a href="#docs">Como usar</a><a className="github-link" href="https://github.com/erickmacedosflw/extract_csv" target="_blank" rel="noreferrer">GitHub <span aria-hidden="true">↗</span></a></nav>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">FILE TRANSFORMATION API <span>●</span></p>
          <h1>Dados tabulares.<br /><em>Texto puro.</em></h1>
          <p className="lede">Envie XLS, XLSX ou CSV. Receba o conteúdo CSV pronto para usar, sem armazenamento e sem ruído.</p>
          <div className="hero-meta"><span>NODE.JS</span><span>Vercel native</span><span>10 MB max</span></div>
          <div className="hero-actions"><a className="primary-action" href="#workspace">Testar arquivo <span aria-hidden="true">↓</span></a><a className="secondary-action" href="#docs">Ver endpoint <span aria-hidden="true">→</span></a></div>
        </div>
        <div className="hero-art" aria-hidden="true"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="file-symbol"><span>CSV</span><strong>↘</strong></div></div>
      </section>

      <section className="workspace" id="workspace" aria-label="Testar a API">
        <div className="section-heading"><p className="eyebrow">TRY IT NOW</p><h2>Converta um arquivo</h2><p>O arquivo é processado em memória e descartado ao final da requisição.</p></div>
        <label className={`dropzone ${selectedFile ? "has-file" : ""}`}>
          <input type="file" accept=".csv,.xls,.xlsx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={handleFileChange} />
          <span className="upload-icon">↑</span><strong>{selectedFile ? selectedFile.name : "Escolha um arquivo"}</strong><span>{isLoading ? "Convertendo..." : "CSV, XLS ou XLSX · até 10 MB"}</span>
        </label>
        {result && ("error" in result ? <div className="error-box">{result.error}</div> : <div className="result-box"><div className="result-top"><span>RESPOSTA · {result.filename}</span><a href={`data:text/csv;charset=utf-8,${encodeURIComponent(result.csv)}`} download={result.filename}>Baixar CSV ↓</a></div><pre>{result.csv}</pre></div>)}
      </section>

      <section className="docs" id="docs">
        <div className="section-heading"><p className="eyebrow">API REFERENCE</p><h2>Um contrato pequeno.</h2><p>Uma rota, uma entrada clara, uma resposta utilizável.</p></div>
        <div className="docs-grid">
          <div><span className="method">POST</span><code className="endpoint">/api/convert</code><p>Converte o primeiro worksheet de um arquivo Excel. CSVs são devolvidos como recebidos.</p><div className="chips"><span>XLS</span><span>XLSX</span><span>CSV</span></div></div>
          <pre className="code-block"><span className="code-label">REQUEST · application/json</span>{requestExample}</pre>
          <div className="response-note"><span className="status">200 OK</span><strong>text/csv; charset=utf-8</strong><p>Erros retornam JSON com a propriedade <code>error</code>. O conteúdo nunca é persistido.</p></div>
        </div>
      </section>

      <footer><span>extract_csv · 2026</span><span>Built for ephemeral work</span></footer>
    </main>
  );
}

function readAsDataUri(file: File) {
  return new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(reader.error); reader.readAsDataURL(file); });
}
