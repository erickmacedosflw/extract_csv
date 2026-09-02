export const MAX_FILE_SIZE = 3 * 1024 * 1024;
export const MAX_REMOTE_FILE_SIZE = 10 * 1024 * 1024;

export type SupportedFormat = "csv" | "xls" | "xlsx";

export class FileInputError extends Error {
  constructor(
    message: string,
    public readonly status: 400 | 413 | 415 | 422,
  ) {
    super(message);
    this.name = "FileInputError";
  }
}

export type DecodedFile = {
  bytes: Uint8Array;
  format: SupportedFormat;
};

const FORMAT_BY_EXTENSION: Record<string, SupportedFormat> = {
  csv: "csv",
  xls: "xls",
  xlsx: "xlsx",
};

function extensionOf(filename?: string) {
  const extension = filename?.trim().toLowerCase().split(".").pop();
  if (!extension || !filename?.includes(".")) return undefined;
  if (!FORMAT_BY_EXTENSION[extension]) {
    throw new FileInputError("Formato não suportado. Use CSV, XLS ou XLSX.", 415);
  }
  return FORMAT_BY_EXTENSION[extension];
}

function formatFromMime(mime?: string) {
  if (!mime) return undefined;
  if (mime.includes("spreadsheetml")) return "xlsx" as const;
  if (mime.includes("ms-excel") || mime.includes("excel")) return "xls" as const;
  if (mime.includes("csv") || mime.includes("plain")) return "csv" as const;
  return undefined;
}

function decodeBase64(value: string) {
  const normalized = value.replace(/\s/g, "");
  if (!normalized || normalized.length % 4 === 1 || !/^[A-Za-z0-9+/]*={0,2}$/.test(normalized)) {
    throw new FileInputError("O conteúdo não é um base64 válido.", 400);
  }

  const bytes = Buffer.from(normalized, "base64");
  if (!bytes.length) throw new FileInputError("O arquivo não pode estar vazio.", 422);
  return new Uint8Array(bytes);
}

function detectFormat(bytes: Uint8Array, filename?: string, mime?: string): SupportedFormat {
  const extension = extensionOf(filename);
  const mimeFormat = formatFromMime(mime);
  const isZip = bytes[0] === 0x50 && bytes[1] === 0x4b;
  const isOle = bytes[0] === 0xd0 && bytes[1] === 0xcf && bytes[2] === 0x11 && bytes[3] === 0xe0;

  if (isZip) return "xlsx";
  if (isOle) return "xls";
  if (extension || mimeFormat) return extension ?? mimeFormat ?? "csv";
  return "csv";
}

export function decodeFile(value: unknown, filename?: string): DecodedFile {
  if (typeof value !== "string" || !value.trim()) {
    throw new FileInputError("O campo file deve conter base64 ou data URI.", 400);
  }

  const trimmed = value.trim();
  const dataUri = trimmed.match(/^data:([^;,]+)?(;base64)?,([\s\S]*)$/i);
  const mime = dataUri?.[1]?.toLowerCase();
  const payload = dataUri ? dataUri[3] : trimmed;

  if (dataUri && !dataUri[2]) {
    throw new FileInputError("O data URI precisa usar a codificação base64.", 400);
  }

  return decodeBytes(decodeBase64(payload), filename, mime, MAX_FILE_SIZE, "3 MB");
}

export function decodeBytes(
  bytes: Uint8Array,
  filename: string | undefined,
  mime: string | undefined,
  maxSize: number,
  sizeLabel: string,
): DecodedFile {
  if (!bytes.length) throw new FileInputError("O arquivo não pode estar vazio.", 422);
  if (bytes.byteLength > maxSize) {
    throw new FileInputError(`O arquivo excede o limite de ${sizeLabel}.`, 413);
  }

  return { bytes, format: detectFormat(bytes, filename, mime) };
}