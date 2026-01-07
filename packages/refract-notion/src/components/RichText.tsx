import type { RichTextItemResponse } from '@notionhq/client/build/src/api-endpoints';
import React from 'react';
import { mapColorToClass } from '../utils/color-mapper';

export interface RichTextProps {
  richText: RichTextItemResponse[];
  className?: string; // Optional wrapper class
}

export function RichText({ richText, className }: RichTextProps) {
  if (!richText || richText.length === 0) {
    return null;
  }

  return (
    <span className={className}>
      {richText.map((item, index) => (
        <RichTextItem key={index} item={item} />
      ))}
    </span>
  );
}

function RichTextItem({ item }: { item: RichTextItemResponse }) {
  const { annotations, type, href } = item;
  let content: React.ReactNode;

  // 1. Resolve content based on type
  if (type === 'text') {
    content = item.text.content;
  } else if (type === 'mention') {
    // For mentions, we just use plain_text for now
    content = item.plain_text;
  } else if (type === 'equation') {
    content = item.plain_text; // Or render equation if needed later
  } else {
    // This case should not be reachable if strictly typed, but safety fallback
    content = (item as any).plain_text ?? '';
  }

  // 2. Apply styling wrapper (Color)
  // We apply color to a span wrapping the raw text
  const colorClass = mapColorToClass(annotations.color);
  
  if (colorClass !== 'notion-color-default') {
    content = <span className={colorClass}>{content}</span>;
  }

  // 3. Apply semantic wrappers based on annotations
  if (annotations.code) {
    content = <code className="notion-code">{content}</code>;
  }
  if (annotations.underline) {
    content = <u>{content}</u>;
  }
  if (annotations.strikethrough) {
    content = <s>{content}</s>;
  }
  if (annotations.italic) {
    content = <em>{content}</em>;
  }
  if (annotations.bold) {
    content = <strong>{content}</strong>;
  }

  // 4. Wrap with Link
  if (href) {
    content = (
      <a
        href={href}
        className="notion-link"
        target="_blank"
        rel="noopener noreferrer"
      >
        {content}
      </a>
    );
  }

  // Wraps in a Fragment to return a single node but it's already a single node
  return <>{content}</>;
}
