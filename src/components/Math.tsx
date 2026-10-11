import katex from "katex";
import { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";

export function MathText({
  latex,
  display = true,
  className = "",
}: {
  latex: string;
  display?: boolean;
  className?: string;
}) {
  const html = useMemo(
    () =>
      katex.renderToString(latex, {
        displayMode: display,
        throwOnError: true,
        strict: "error",
        trust: false,
        output: "htmlAndMathml",
      }),
    [latex, display],
  );
  return (
    <div
      className={`math-text ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function CopyFormula({
  latex,
  announce,
}: {
  latex: string;
  announce: (text: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [fallback, setFallback] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(latex);
      setCopied(true);
      announce("数式をLaTeX形式でコピーしました。");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setFallback(true);
      announce("コピーできないため、選択できるLaTeXを表示しました。");
    }
  };
  return (
    <>
      <button
        className="icon-button copy-formula"
        onClick={copy}
        aria-label="数式をLaTeX形式でコピー"
        title="LaTeXをコピー"
      >
        {copied ? <Check size={17} /> : <Copy size={17} />}
      </button>
      {fallback && (
        <input
          className="copy-fallback"
          value={latex}
          readOnly
          aria-label="コピー用LaTeX"
          onFocus={(e) => e.currentTarget.select()}
        />
      )}
    </>
  );
}
