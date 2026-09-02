import { decodeBytes, FileInputError, MAX_REMOTE_FILE_SIZE } from "./decode-file";

const ALLOWED_HOSTS = new Set([
  "github.com",
  "raw.githubusercontent.com",
  "gitlab.com",
  "bitbucket.org",
]);

export async function fetchRemoteFile(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    throw new FileInputError("O campo url deve conter uma URL pública.", 400);
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new FileInputError("A URL informada não é válida.", 400);
  }

  if (url.protocol !== "https:" || !ALLOWED_HOSTS.has(url.hostname.toLowerCase())) {
    throw new FileInputError("Use uma URL HTTPS pública do GitHub, GitLab ou Bitbucket.", 415);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(url, { signal: controller.signal, redirect: "manual" });
    if (!response.ok) {
      throw new FileInputError(`Não foi possível baixar o arquivo (HTTP ${response.status}).`, 422);
    }
    if (response.headers.get("content-type")?.toLowerCase().includes("text/html")) {
      throw new FileInputError("A URL aponta para uma página, não para o arquivo bruto.", 415);
    }

    const contentLength = Number(response.headers.get("content-length"));
    if (contentLength > MAX_REMOTE_FILE_SIZE) {
      throw new FileInputError("O arquivo remoto excede o limite de 10 MB.", 413);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new FileInputError("Não foi possível ler o arquivo remoto.", 422);
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { done, value: chunk } = await reader.read();
      if (done) break;
      total += chunk.byteLength;
      if (total > MAX_REMOTE_FILE_SIZE) {
        await reader.cancel();
        throw new FileInputError("O arquivo remoto excede o limite de 10 MB.", 413);
      }
      chunks.push(chunk);
    }

    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }

    const filename = decodeURIComponent(url.pathname.split("/").pop() || "download.csv");
    return decodeBytes(bytes, filename, response.headers.get("content-type") ?? undefined, MAX_REMOTE_FILE_SIZE, "10 MB");
  } catch (error) {
    if (error instanceof FileInputError) throw error;
    throw new FileInputError("Não foi possível baixar o arquivo remoto.", 422);
  } finally {
    clearTimeout(timeout);
  }
}