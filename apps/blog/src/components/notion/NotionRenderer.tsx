'use client';

import { BlockRenderer, type BlockRendererProps } from '@tuum/refract-notion';
import { EnhancedCodeBlock } from './EnhancedCodeBlock';

/**
 * Default component mapping for the Notion renderer.
 * Centralizes component injection to avoid repetition in page components.
 */
const defaultComponents = {
  CodeBlock: EnhancedCodeBlock,
  // Add more custom components here as needed (e.g., Image, Link)
};

/**
 * Wrapper component for BlockRenderer that injects default custom components.
 * Use this instead of BlockRenderer in the application to ensure consistent behavior.
 */
export function NotionRenderer(props: BlockRendererProps) {
  const mapPageUrl = (href: string) => {
    // http 또는 https로 시작하는 외부 링크는 그대로 반환
    if (href.startsWith('http') || href.startsWith('https')) {
      return href;
    }
    // 내부 링크(보통 /로 시작)는 /blog 프리픽스 추가
    if (href.startsWith('/')) {
      return `/blog${href}`;
    }
    return href;
  };

  return (
    <BlockRenderer
      {...props}
      components={{
        ...defaultComponents,
        ...props.components, // Allow overriding specific components via props
      }}
      mapPageUrl={mapPageUrl}
    />
  );
}
