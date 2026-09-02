"use client";

import { FormEvent, useState } from "react";

export default function UrlTester() {
  const [url, setUrl] = useState("");
  const [csv, setCsv] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCsv("");
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        setError(body.error ?? "Não foi possível converter a URL.");
        return;
      }
      setCsv(await response.text());
    } catch {
      setError("Não foi possível conectar à API.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="url-tester">
      <p className="eyebrow">TESTE ONLINE</p>
      <form onSubmit={handleSubmit} className="url-form">
        <label htmlFor="public-file-url">URL pública do arquivo</label>
        <div className="url-form-row">
          <input id="public-file-url" type="url" required value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://raw.githubusercontent.com/.../dados.csv" />
          <button type="submit" disabled={isLoading}>{isLoading ? "Testando..." : "Testar URL →"}</button>
        </div>
      </form>
      {error && <p className="url-error" role="alert">{error}</p>}
      {csv && <div className="url-result"><div className="result-top"><span>RESPOSTA · text/csv</span><a href={`data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`} download="converted.csv">Baixar CSV ↓</a></div><pre>{csv}</pre></div>}
    </div>
  );
}
