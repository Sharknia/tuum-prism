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

// --- Divider ---
import { BookmarkBlockObjectResponse, CalloutBlockObjectResponse, DividerBlockObjectResponse, ImageBlockObjectResponse } from '@notionhq/client/build/src/api-endpoints';

export function Divider({ block }: { block: DividerBlockObjectResponse }) {
  return <hr className="notion-block notion-divider" />;
}

// --- Image ---
export interface ImageProps {
  src: string;
  alt: string;
  caption?: React.ReactNode;
  className?: string;
}

// Default Image component (can be overridden via IoC)
export function DefaultImage({ src, alt, caption, className }: ImageProps) {
  return (
    <figure className={`notion-block notion-image ${className ?? ''}`}>
      <img src={src} alt={alt} loading="lazy" />
      {caption && <figcaption className="notion-caption">{caption}</figcaption>}
    </figure>
  );
}

export function ImageBlock({ 
  block, 
  ImageComponent = DefaultImage 
}: { 
  block: ImageBlockObjectResponse; 
  ImageComponent?: React.ComponentType<ImageProps>;
}) {
  const { image } = block;
  const src = image.type === 'external' ? image.external.url : image.file.url;
  const caption = image.caption && image.caption.length > 0 
    ? <RichText richText={image.caption} /> 
    : undefined;

  return (
    <ImageComponent 
      src={src} 
      alt={caption ? '' : 'Image'} 
      caption={caption} 
    />
  );
}

// --- Callout ---
export function Callout({ block, children }: BlockProps<CalloutBlockObjectResponse>) {
  const { icon, color, rich_text } = block.callout;
  const colorClass = mapColorToClass(color);

  // Render icon
  let iconElement: React.ReactNode = null;
  if (icon) {
    if (icon.type === 'emoji') {
      iconElement = <span className="notion-callout-icon">{icon.emoji}</span>;
    } else if (icon.type === 'external') {
      iconElement = <img src={icon.external.url} alt="" className="notion-callout-icon notion-callout-icon-image" />;
    } else if (icon.type === 'file') {
      iconElement = <img src={icon.file.url} alt="" className="notion-callout-icon notion-callout-icon-image" />;
    }
  }

  return (
    <div className={`notion-block notion-callout ${colorClass}`}>
      {iconElement}
      <div className="notion-callout-content">
        <RichText richText={rich_text} />
        {children && <div className="notion-indent">{children}</div>}
      </div>
    </div>
  );
}

// --- Bookmark ---
export function Bookmark({ block }: { block: BookmarkBlockObjectResponse }) {
  const { url, caption } = block.bookmark;

  return (
    <div className="notion-block notion-bookmark">
      <a href={url} target="_blank" rel="noopener noreferrer" className="notion-bookmark-link">
        {url}
      </a>
      {caption && caption.length > 0 && (
        <div className="notion-caption">
          <RichText richText={caption} />
        </div>
      )}
    </div>
  );
}

// --- Toggle ---
import { CodeBlockObjectResponse, TableBlockObjectResponse, TableRowBlockObjectResponse, ToggleBlockObjectResponse } from '@notionhq/client/build/src/api-endpoints';

export function Toggle({ block, children }: BlockProps<ToggleBlockObjectResponse>) {
  const { rich_text, color } = block.toggle;
  const colorClass = mapColorToClass(color);

  return (
    <details className={`notion-block notion-toggle ${colorClass}`}>
      <summary className="notion-toggle-summary">
        <RichText richText={rich_text} />
      </summary>
      <div className="notion-toggle-content">
        {children}
      </div>
    </details>
  );
}

// --- CodeBlock ---
export interface CodeBlockProps {
  language: string;
  code: string;
  caption?: React.ReactNode;
  className?: string;
}

// Default CodeBlock component (Headless - no syntax highlighting)
export function DefaultCodeBlock({ language, code, caption, className }: CodeBlockProps) {
  return (
    <figure className={`notion-block notion-code-block ${className ?? ''}`}>
      <pre>
        <code className={`language-${language}`}>{code}</code>
      </pre>
      {caption && <figcaption className="notion-caption">{caption}</figcaption>}
    </figure>
  );
}

export function CodeBlock({
  block,
  CodeComponent = DefaultCodeBlock,
}: {
  block: CodeBlockObjectResponse;
  CodeComponent?: React.ComponentType<CodeBlockProps>;
}) {
  const { language, rich_text, caption } = block.code;
  const code = rich_text.map((t) => t.plain_text).join('');
  const captionElement = caption && caption.length > 0 ? <RichText richText={caption} /> : undefined;

  return (
    <CodeComponent
      language={language}
      code={code}
      caption={captionElement}
    />
  );
}

// --- Table ---
export function Table({ block, children }: BlockProps<TableBlockObjectResponse>) {
  const { has_column_header, has_row_header } = block.table;

  return (
    <div className="notion-block notion-table-wrapper">
      <table className="notion-table" data-has-column-header={has_column_header} data-has-row-header={has_row_header}>
        <tbody>
          {children}
        </tbody>
      </table>
    </div>
  );
}

export function TableRow({
  block,
  isFirstRow,
  hasRowHeader,
}: {
  block: TableRowBlockObjectResponse;
  isFirstRow?: boolean;
  hasRowHeader?: boolean;
}) {
  const { cells } = block.table_row;

  return (
    <tr className="notion-table-row">
      {cells.map((cell, index) => {
        const isHeader = (isFirstRow) || (hasRowHeader && index === 0);
        const Tag = isHeader ? 'th' : 'td';
        return (
          <Tag key={index} className="notion-table-cell">
            <RichText richText={cell} />
          </Tag>
        );
      })}
    </tr>
  );
}

