import type {
    Heading1BlockObjectResponse,
    Heading2BlockObjectResponse,
    Heading3BlockObjectResponse,
    ParagraphBlockObjectResponse,
    QuoteBlockObjectResponse,
} from '@notionhq/client/build/src/api-endpoints';
import React from 'react';
import { mapColorToClass } from '../utils/color-mapper';
import { RichText } from './RichText';

// Common props for blocks that have children (recursive)
export type BlockProps<T> = {
  block: T;
  children?: React.ReactNode;
};

// --- Paragraph ---
export function Paragraph({ block, children }: BlockProps<ParagraphBlockObjectResponse>) {
  const { color, rich_text } = block.paragraph;
  const colorClass = mapColorToClass(color);

  return (
    <p className={`notion-block notion-paragraph ${colorClass}`}>
      <RichText richText={rich_text} />
      {children && <div className="notion-indent">{children}</div>}
    </p>
  );
}

// --- Headings ---
// Heading blocks in Notion cannot have children content in the API structure usually (except Toggle Headings),
// but if they do (toggleable headings), we render them.
export function Heading1({ block, children }: BlockProps<Heading1BlockObjectResponse>) {
  const { color, rich_text, is_toggleable } = block.heading_1;
  const colorClass = mapColorToClass(color);
  // Generate ID from text content for anchor links could be added here
  
  return (
    <div className={`notion-block notion-h1 ${colorClass}`}>
      <h1><RichText richText={rich_text} /></h1>
      {is_toggleable && children && <div className="notion-indent">{children}</div>}
    </div>
  );
}

export function Heading2({ block, children }: BlockProps<Heading2BlockObjectResponse>) {
  const { color, rich_text, is_toggleable } = block.heading_2;
  const colorClass = mapColorToClass(color);

  return (
    <div className={`notion-block notion-h2 ${colorClass}`}>
      <h2><RichText richText={rich_text} /></h2>
      {is_toggleable && children && <div className="notion-indent">{children}</div>}
    </div>
  );
}

export function Heading3({ block, children }: BlockProps<Heading3BlockObjectResponse>) {
  const { color, rich_text, is_toggleable } = block.heading_3;
  const colorClass = mapColorToClass(color);

  return (
    <div className={`notion-block notion-h3 ${colorClass}`}>
      <h3><RichText richText={rich_text} /></h3>
      {is_toggleable && children && <div className="notion-indent">{children}</div>}
    </div>
  );
}

// --- Quote ---
export function Quote({ block, children }: BlockProps<QuoteBlockObjectResponse>) {
  const { color, rich_text } = block.quote;
  const colorClass = mapColorToClass(color);

  return (
    <blockquote className={`notion-block notion-quote ${colorClass}`}>
      <div className="notion-quote-content">
        <RichText richText={rich_text} />
      </div>
      {children && <div className="notion-indent">{children}</div>}
    </blockquote>
  );
}

// --- List Items ---
import { BulletedListItemBlockObjectResponse, NumberedListItemBlockObjectResponse } from '@notionhq/client/build/src/api-endpoints';

export function BulletedListItem({ block, children }: BlockProps<BulletedListItemBlockObjectResponse>) {
  const { color, rich_text } = block.bulleted_list_item;
  const colorClass = mapColorToClass(color);

  return (
    <li className={`notion-block notion-list-item notion-bulleted-list-item ${colorClass}`}>
      <div className="notion-list-item-content">
        <RichText richText={rich_text} />
      </div>
      {children && <div className="notion-indent">{children}</div>}
    </li>
  );
}

export function NumberedListItem({ block, children }: BlockProps<NumberedListItemBlockObjectResponse>) {
  const { color, rich_text } = block.numbered_list_item;
  const colorClass = mapColorToClass(color);

  return (
    <li className={`notion-block notion-list-item notion-numbered-list-item ${colorClass}`}>
      <div className="notion-list-item-content">
        <RichText richText={rich_text} />
      </div>
      {children && <div className="notion-indent">{children}</div>}
    </li>
  );
}

