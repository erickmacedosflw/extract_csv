import dns from "node:dns/promises";
import net from "node:net";

import { decodeBytes, FileInputError, MAX_REMOTE_FILE_SIZE } from "./decode-file";

function isPrivateIp(address: string) {
  if (net.isIPv4(address)) {
    const octets = address.split(".").map(Number);
    return octets[0] === 0 || octets[0] === 10 || octets[0] === 127 ||
      (octets[0] === 169 && octets[1] === 254) ||
      (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
      (octets[0] === 192 && octets[1] === 168) ||
      (octets[0] === 100 && octets[1] >= 64 && octets[1] <= 127) ||
      (octets[0] === 198 && octets[1] >= 18 && octets[1] <= 19) || octets[0] >= 224;
  }

  const normalized = address.toLowerCase();
  return normalized === "::1" || normalized.startsWith("fc") || normalized.startsWith("fd") || normalized.startsWith("fe80:") || normalized.startsWith("::ffff:127.");
}

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

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new FileInputError("Use uma URL HTTP ou HTTPS pública.", 415);
  }
  if (["localhost", "127.0.0.1", "::1"].includes(url.hostname.toLowerCase()) || url.hostname.toLowerCase().endsWith(".local")) {
    throw new FileInputError("A URL precisa apontar para um endereço público.", 415);
  }
  if (isPrivateIp(url.hostname)) {
    throw new FileInputError("A URL precisa apontar para um endereço público.", 415);
  }
  try {
    const addresses = await dns.lookup(url.hostname, { all: true });
    if (!addresses.length || addresses.some(({ address }) => isPrivateIp(address))) {
      throw new FileInputError("A URL precisa apontar para um endereço público.", 415);
    }
  } catch (error) {
    if (error instanceof FileInputError) throw error;
    throw new FileInputError("Não foi possível localizar o endereço público.", 422);
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