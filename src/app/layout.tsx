import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "extract_csv | File transformation API",
  description: "Converta XLS, XLSX e CSV em texto CSV puro.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
