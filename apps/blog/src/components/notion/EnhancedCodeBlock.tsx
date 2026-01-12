'use client';

import { useTheme } from '@/components/layout/ThemeProvider';
import type { CodeBlockProps } from '@tuum/refract-notion';
import mermaid from 'mermaid';
import { useEffect, useRef, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import {
    ghcolors,
    vscDarkPlus,
} from 'react-syntax-highlighter/dist/esm/styles/prism';

/**
 * Enhanced code block component.
 * Features:
 * 1. Mermaid diagram rendering for 'mermaid' language.
 * 2. Syntax highlighting for other languages using prism.
 * 3. Dynamic theme switching (light/dark).
 */
export function EnhancedCodeBlock({
  language,
  code,
  caption,
  className,
}: CodeBlockProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const { resolvedTheme } = useTheme();

  // --- Mermaid Logic ---
  useEffect(() => {
    if (language === 'mermaid' && code) {
      const renderDiagram = async () => {
        try {
          mermaid.initialize({
            startOnLoad: false, // Prevent auto-rendering
            // Mermaid 'dark' theme works, 'default' is light.
            theme: resolvedTheme === 'dark' ? 'dark' : 'default',
            securityLevel: 'loose',
            fontFamily: 'var(--font-sans)',
          });

          // Generate unique ID
          const id = `mermaid-${Math.random().toString(36).substring(7)}`;
          const { svg } = await mermaid.render(id, code);
          setSvg(svg);
          setError(null);
        } catch (err) {
          console.error('Mermaid rendering error:', err);
          setError(
            err instanceof Error ? err.message : 'Failed to render diagram'
          );
          setSvg(null);
        }
      };
      renderDiagram();
    }
  }, [code, language, resolvedTheme]);

  // Copy Handler
  const handleCopy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  // Render Mermaid
  if (language === 'mermaid') {
    return (
      <figure className={`notion-block notion-mermaid ${className ?? ''}`}>
        {error ? (
          <div className="notion-mermaid-error text-red-500 p-4 bg-red-50 dark:bg-red-900/10 rounded">
            <p className="font-bold text-sm mb-2">⚠️ Mermaid Rendering Error</p>
            <pre className="text-xs overflow-auto">{error}</pre>
          </div>
        ) : svg ? (
          <div
            ref={containerRef}
            className="mermaid-container flex justify-center py-4 bg-surface rounded-lg overflow-x-auto"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        ) : (
          <div className="mermaid-loading p-4 text-center text-muted text-sm animate-pulse">
            Loading diagram...
          </div>
        )}
        {caption && (
          <figcaption className="notion-caption text-left mt-2 text-sm text-muted">
            {caption}
          </figcaption>
        )}
      </figure>
    );
  }

  // --- Syntax Highlighting Logic ---
  return (
    <figure
      className={`notion-block notion-code-block ${className ?? ''} rounded-lg overflow-hidden border border-[var(--border)]`}
    >
      <div className="relative group">
        <SyntaxHighlighter
          language={language.toLowerCase()}
          style={resolvedTheme === 'dark' ? vscDarkPlus : ghcolors}
          customStyle={{
            margin: 0,
            padding: '1.25rem',
            fontSize: '0.875rem',
            lineHeight: '1.6',
            background: resolvedTheme === 'dark' ? '#1e1e1e' : '#f6f8fa', // Match surface/github-light
          }}
          codeTagProps={{
            style: {
              fontFamily:
                'var(--font-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            },
          }}
        >
          {code}
        </SyntaxHighlighter>

        {/* Floating Controls: Language Badge & Copy Button */}
        <div className="absolute top-2 right-2 flex items-center gap-1.5">
          {/* Language Badge */}
          <div className="px-2 py-1 text-[10px] uppercase font-bold text-muted bg-[var(--background)]/50 backdrop-blur rounded select-none">
            {language}
          </div>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="flex items-center justify-center w-[22px] h-[22px] text-muted bg-[var(--background)]/50 backdrop-blur rounded transition-all hover:text-foreground hover:bg-[var(--foreground)]/10"
            aria-label="Copy code"
            title="Copy code"
          >
            {isCopied ? (
              <CheckIcon className="w-3.5 h-3.5 text-green-500" />
            ) : (
              <ClipboardDocumentIcon className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {caption && (
        <figcaption className="notion-caption text-left px-4 py-2 border-t border-[var(--border)] bg-surface/50 text-sm text-muted">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

// Icons
import { CheckIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';
