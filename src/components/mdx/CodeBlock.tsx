// Fenced code block: Prism highlighting, language label, copy button.
// Mapped to `pre` in index.tsx, so ```lang fences use it automatically.
// Deliberately dark in both themes, like Grafana's code panels.
import { isValidElement, useState, type ReactNode } from "react";
import { Highlight, themes } from "prism-react-renderer";

interface CodeBlockProps {
  children?: ReactNode;
}

export default function CodeBlock({ children }: CodeBlockProps) {
  const codeEl = isValidElement<{ className?: string; children?: ReactNode }>(children)
    ? children.props
    : undefined;
  const language = /language-(\w+)/.exec(codeEl?.className ?? "")?.[1] ?? "text";
  const code = typeof codeEl?.children === "string" ? codeEl.children.trimEnd() : "";
  const [copied, setCopied] = useState(false);

  const copy = () => {
    void navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="my-6 overflow-hidden rounded-lg border border-line-dark bg-[#011627]">
      <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-4 py-1.5">
        <span className="font-mono text-xs uppercase tracking-wider text-[#9aa0a6]">{language}</span>
        <button
          type="button"
          onClick={copy}
          className="rounded px-2 py-1 text-xs text-[#9aa0a6] transition-colors hover:bg-white/10 hover:text-white"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <Highlight code={code} language={language} theme={themes.nightOwl}>
        {({ style, tokens, getLineProps, getTokenProps }) => (
          <pre style={style} className="overflow-x-auto p-4 font-mono text-sm leading-relaxed">
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })}>
                {line.map((token, k) => (
                  <span key={k} {...getTokenProps({ token })} />
                ))}
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    </div>
  );
}
