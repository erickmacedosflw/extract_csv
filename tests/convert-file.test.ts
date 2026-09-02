import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";

import { convertToCsv } from "../src/lib/convert-to-csv";
import { decodeFile, FileInputError } from "../src/lib/decode-file";

describe("decodeFile", () => {
  it("accepts base64 and data URI input", () => {
    const base64 = Buffer.from("name,value\nAlice,20", "utf8").toString("base64");

    expect(decodeFile(base64, "data.csv").format).toBe("csv");
    expect(decodeFile(`data:text/csv;base64,${base64}`).format).toBe("csv");
  });

  it("rejects malformed input", () => {
    expect(() => decodeFile("not base64!", "data.csv")).toThrow(FileInputError);
    expect(() => decodeFile("data:text/csv,hello")).toThrow("codificação base64");
  });

  it("rejects files above the serverless request-safe limit", () => {
    const oversized = Buffer.alloc(3 * 1024 * 1024 + 1).toString("base64");

    expect(() => decodeFile(oversized, "data.csv")).toThrow("limite de 3 MB");
  });
});

describe("convertToCsv", () => {
  it("preserves CSV text exactly", () => {
    const csv = 'name,note\nAlice,"hello, world"\n';
    const file = decodeFile(Buffer.from(csv).toString("base64"), "data.csv");

    expect(convertToCsv(file)).toBe(csv);
  });

  it("converts only the first Excel worksheet", () => {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([["name", "value"], ["Alice", 20]]), "First");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([["ignored"]]), "Second");
    const bytes = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    expect(convertToCsv(decodeFile(bytes.toString("base64"), "data.xlsx"))).toBe("name,value\nAlice,20");
  });
});