import { NextResponse } from "next/server";

import { convertToCsv } from "@/lib/convert-to-csv";
import { decodeFile, FileInputError } from "@/lib/decode-file";
import { fetchRemoteFile } from "@/lib/fetch-file";

export const runtime = "nodejs";

type ConvertRequest = {
  file?: unknown;
  url?: unknown;
  filename?: unknown;
};

export async function POST(request: Request) {
  try {
    let body: ConvertRequest;
    try {
      body = (await request.json()) as ConvertRequest;
    } catch {
      return NextResponse.json({ error: "O corpo da requisição deve ser um JSON válido." }, { status: 400 });
    }

    const filename = typeof body.filename === "string" ? body.filename : undefined;
    if (body.file !== undefined && body.url !== undefined) {
      return NextResponse.json({ error: "Envie file ou url, não os dois." }, { status: 400 });
    }
    const decoded = body.url !== undefined
      ? await fetchRemoteFile(body.url)
      : decodeFile(body.file, filename);
    const csv = convertToCsv(decoded);

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="converted.csv"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof FileInputError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: "Não foi possível converter o arquivo." }, { status: 422 });
  }
}