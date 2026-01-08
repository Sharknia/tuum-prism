'use client';

import { useTheme } from '@/components/layout/ThemeProvider';
import type { CodeBlockProps } from '@tuum/refract-notion';
import mermaid from 'mermaid';
import { useEffect, useRef, useState } from 'react';

/**
 * Mermaid-aware code block component.
 * Renders mermaid diagrams as SVG, falls back to plain code for other languages.
 * Supports dynamic theme switching (light/dark).
 */
export function MermaidCodeBlock({ language, code, caption, className }: CodeBlockProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (language === 'mermaid' && code) {
      const renderDiagram = async () => {
        try {
          // Initialize mermaid with theme based on current app theme
          mermaid.initialize({
            startOnLoad: false,
            theme: resolvedTheme === 'dark' ? 'dark' : 'default',
            securityLevel: 'loose',
          });

          // Use a unique ID for each render
          const id = `mermaid-${Math.random().toString(36).substring(7)}`;
          const { svg } = await mermaid.render(id, code);
          setSvg(svg);
          setError(null);
        } catch (err) {
          console.error('Mermaid rendering error:', err);
          setError(err instanceof Error ? err.message : 'Failed to render diagram');
          setSvg(null);
        }
      };
      renderDiagram();
    }
  }, [code, language, resolvedTheme]); // Re-render when theme changes

  // Render mermaid diagram
  if (language === 'mermaid') {
    return (
      <figure className={`notion-block notion-mermaid ${className ?? ''}`}>
        {error ? (
          <div className="notion-mermaid-error">
            <p>⚠️ Mermaid Error: {error}</p>
            <pre><code>{code}</code></pre>
          </div>
        ) : svg ? (
          <div 
            ref={containerRef}
            className="mermaid-container"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        ) : (
          <div className="mermaid-loading">Loading diagram...</div>
        )}
        {caption && <figcaption className="notion-caption">{caption}</figcaption>}
      </figure>
    );
  }

  // Fallback to default code block for other languages
  return (
    <figure className={`notion-block notion-code-block ${className ?? ''}`}>
      <pre>
        <code className={`language-${language}`}>{code}</code>
      </pre>
      {caption && <figcaption className="notion-caption">{caption}</figcaption>}
    </figure>
  );
}
