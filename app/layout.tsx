import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EvalBench — LLM Evaluation Harness",
  description: "Provider-agnostic LLM-as-judge evaluation with auditable scores.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
