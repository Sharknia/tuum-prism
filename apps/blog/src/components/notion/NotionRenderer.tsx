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
  return (
    <BlockRenderer
      {...props}
      components={{
        ...defaultComponents,
        ...props.components, // Allow overriding specific components via props
      }}
    />
  );
}
