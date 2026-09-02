import * as XLSX from "xlsx";

import type { DecodedFile } from "./decode-file";

export function convertToCsv(file: DecodedFile) {
  if (file.format === "csv") {
    return new TextDecoder("utf-8", { fatal: false }).decode(file.bytes);
  }

  const workbook = XLSX.read(file.bytes, { type: "array", cellDates: true });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!firstSheet) return "";

  return XLSX.utils.sheet_to_csv(firstSheet, {
    FS: ",",
    RS: "\n",
    blankrows: false,
  });
}