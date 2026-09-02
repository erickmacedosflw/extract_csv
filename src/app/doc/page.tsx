import Link from "next/link";

const jsonExample = `{
  "file": "data:text/csv;base64,bmFtZSx2YWx1ZQpBbGljZSwyMA==",
  "filename": "dados.csv"
}`;

const curlExample = `curl -X POST https://extract-csv.vercel.app/api/convert \
  -H "Content-Type: application/json" \
  -d '{"file":"BASE64_OU_DATA_URI","filename":"dados.xlsx"}'`;

const javascriptExample = `const response = await fetch(
  "https://extract-csv.vercel.app/api/convert",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      file: dataUriBase64,
      filename: "dados.xlsx"
    })
  }
);

const csv = await response.text();`;

export default function DocumentationPage() {
  return (
    <main>
      <header className="topbar">
        <Link className="brand" href="/" aria-label="Voltar ao início"><span className="brand-mark">{`{ }`}</span><span>extract_csv</span></Link>
        <nav className="topnav" aria-label="Navegação principal"><Link href="/">Testar arquivo</Link><a className="github-link" href="https://github.com/erickmacedosflw/extract_csv" target="_blank" rel="noreferrer">GitHub <span aria-hidden="true">↗</span></a></nav>
      </header>

      <section className="docs-page-intro">
        <p className="eyebrow">DOCUMENTAÇÃO DA API</p>
        <h1>Converta arquivos<br /><em>em CSV puro.</em></h1>
        <p>Envie um CSV, XLS ou XLSX em base64. A API processa o arquivo em memória e retorna somente o texto CSV.</p>
      </section>

      <section className="docs-page-content">
        <div className="route-card"><span className="method">POST</span><code className="endpoint">/api/convert</code><p>Endpoint único para conversão de arquivos tabulares.</p></div>
        <div className="doc-block"><p className="eyebrow">ENTRADA · application/json</p><pre className="code-block">{jsonExample}</pre><p>O campo <code>file</code> aceita base64 puro ou data URI base64. Informe <code>filename</code> para arquivos Excel.</p></div>
        <div className="doc-block"><p className="eyebrow">EXEMPLO · CURL</p><pre className="code-block">{curlExample}</pre></div>
        <div className="doc-block"><p className="eyebrow">EXEMPLO · JAVASCRIPT</p><pre className="code-block">{javascriptExample}</pre></div>
        <div className="doc-block response-doc"><p className="eyebrow">RESPOSTA</p><span className="status">200 OK</span><strong>Content-Type: text/csv; charset=utf-8</strong><pre className="response-code">name,value{`\n`}Alice,20</pre></div>
        <div className="doc-block limits"><p className="eyebrow">REGRAS</p><ul><li>Formatos: CSV, XLS e XLSX.</li><li>Excel: somente a primeira aba.</li><li>Limite: 3 MB decodificado.</li><li>Sem banco, arquivos ou histórico.</li><li>Erros retornam JSON com <code>error</code>.</li></ul></div>
      </section>

      <footer><span>extract_csv · 2026</span><Link href="/">← Voltar para o conversor</Link></footer>
    </main>
  );
}
