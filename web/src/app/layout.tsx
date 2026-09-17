import type { Metadata } from "next";

import { getInitialWorkspace } from "@/lib/data/workspace";

import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Z Point",
  description: "Operating system for coherent intention and documented execution.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const initial = await getInitialWorkspace();
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-bg text-ink">
        <Providers initial={initial}>{children}</Providers>
      </body>
    </html>
  );
}
