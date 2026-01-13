import type {
  ColumnBlockObjectResponse,
  ColumnListBlockObjectResponse,
  Heading1BlockObjectResponse,
  Heading2BlockObjectResponse,
  Heading3BlockObjectResponse,
  ParagraphBlockObjectResponse,
  QuoteBlockObjectResponse,
} from "@notionhq/client/build/src/api-endpoints";
import React from "react";
import { mapColorToClass } from "../utils/color-mapper";
import { getPlainText, slugify } from "../utils/heading-utils";
import { RichText } from "./RichText";

// Common props for blocks that have children (recursive)
export type BlockProps<T> = {
  block: T;
  children?: React.ReactNode;
  mapPageUrl?: (href: string) => string;
};

// --- Paragraph ---
// --- Paragraph ---
export function Paragraph({
  block,
  children,
  mapPageUrl,
}: BlockProps<ParagraphBlockObjectResponse>) {
  const { color, rich_text } = block.paragraph;
  const colorClass = mapColorToClass(color);

  return (
    <p id={block.id} className={`notion-block notion-paragraph ${colorClass}`}>
      <RichText richText={rich_text} mapPageUrl={mapPageUrl} />
      {children}
    </p>
  );
}

// --- Headings ---
// Heading blocks in Notion cannot have children content in the API structure usually (except Toggle Headings),
// but if they do (toggleable headings), we render them.
export function Heading1({
  block,
  children,
  mapPageUrl,
}: BlockProps<Heading1BlockObjectResponse>) {
  const { color, rich_text, is_toggleable } = block.heading_1;
  const colorClass = mapColorToClass(color);
  const plainText = getPlainText(rich_text);
  const headingId = `${slugify(plainText)}-${block.id}`;

  return (
    <div id={block.id} className={`notion-block notion-h1 ${colorClass}`}>
      <h1 id={headingId} style={{ scrollMarginTop: "80px" }}>
        <RichText richText={rich_text} mapPageUrl={mapPageUrl} />
      </h1>
      {is_toggleable && children}
    </div>
  );
}

export function Heading2({
  block,
  children,
  mapPageUrl,
}: BlockProps<Heading2BlockObjectResponse>) {
  const { color, rich_text, is_toggleable } = block.heading_2;
  const colorClass = mapColorToClass(color);
  const plainText = getPlainText(rich_text);
  const headingId = `${slugify(plainText)}-${block.id}`;

  return (
    <div id={block.id} className={`notion-block notion-h2 ${colorClass}`}>
      <h2 id={headingId} style={{ scrollMarginTop: "80px" }}>
        <RichText richText={rich_text} mapPageUrl={mapPageUrl} />
      </h2>
      {is_toggleable && children}
    </div>
  );
}

export function Heading3({
  block,
  children,
  mapPageUrl,
}: BlockProps<Heading3BlockObjectResponse>) {
  const { color, rich_text, is_toggleable } = block.heading_3;
  const colorClass = mapColorToClass(color);
  const plainText = getPlainText(rich_text);
  const headingId = `${slugify(plainText)}-${block.id}`;

  return (
    <div id={block.id} className={`notion-block notion-h3 ${colorClass}`}>
      <h3 id={headingId} style={{ scrollMarginTop: "80px" }}>
        <RichText richText={rich_text} mapPageUrl={mapPageUrl} />
      </h3>
      {is_toggleable && children}
    </div>
  );
}

// --- Quote ---
export function Quote({
  block,
  children,
  mapPageUrl,
}: BlockProps<QuoteBlockObjectResponse>) {
  const { color, rich_text } = block.quote;
  const colorClass = mapColorToClass(color);

  return (
    <blockquote
      id={block.id}
      className={`notion-block notion-quote ${colorClass}`}
    >
      <div className="notion-quote-content">
        <RichText richText={rich_text} mapPageUrl={mapPageUrl} />
      </div>
      {children}
    </blockquote>
  );
}

// --- List Items ---
import {
  BulletedListItemBlockObjectResponse,
  NumberedListItemBlockObjectResponse,
} from "@notionhq/client/build/src/api-endpoints";

export function BulletedListItem({
  block,
  children,
  mapPageUrl,
}: BlockProps<BulletedListItemBlockObjectResponse>) {
  const { color, rich_text } = block.bulleted_list_item;
  const colorClass = mapColorToClass(color);

  return (
    <li
      id={block.id}
      className={`notion-block notion-list-item notion-bulleted-list-item ${colorClass}`}
    >
      <div className="notion-list-item-content">
        <RichText richText={rich_text} mapPageUrl={mapPageUrl} />
      </div>
      {children}
    </li>
  );
}

export function NumberedListItem({
  block,
  children,
  mapPageUrl,
}: BlockProps<NumberedListItemBlockObjectResponse>) {
  const { color, rich_text } = block.numbered_list_item;
  const colorClass = mapColorToClass(color);

  return (
    <li
      id={block.id}
      className={`notion-block notion-list-item notion-numbered-list-item ${colorClass}`}
    >
      <div className="notion-list-item-content">
        <RichText richText={rich_text} mapPageUrl={mapPageUrl} />
      </div>
      {children}
    </li>
  );
}

// --- Divider ---
import {
  BookmarkBlockObjectResponse,
  CalloutBlockObjectResponse,
  DividerBlockObjectResponse,
  ImageBlockObjectResponse,
} from "@notionhq/client/build/src/api-endpoints";

export function Divider({ block }: { block: DividerBlockObjectResponse }) {
  return <hr id={block.id} className="notion-block notion-divider" />;
}

// --- Image ---
export interface ImageProps {
  src: string;
  alt: string;
  caption?: React.ReactNode;
  className?: string;
}

// Default Image component (can be overridden via IoC)
export function DefaultImage({
  src,
  alt,
  caption,
  className,
  mapPageUrl,
}: ImageProps & { mapPageUrl?: (href: string) => string }) {
  return (
    <figure className={`notion-block notion-image ${className ?? ""}`}>
      <img src={src} alt={alt} loading="lazy" />
      {caption && <figcaption className="notion-caption">{caption}</figcaption>}
    </figure>
  );
}

export function ImageBlock({
  block,
  ImageComponent = DefaultImage,
  mapPageUrl,
}: {
  block: ImageBlockObjectResponse;
  ImageComponent?: React.ComponentType<ImageProps>;
  mapPageUrl?: (href: string) => string;
}) {
  const { image } = block;
  const src = image.type === "external" ? image.external.url : image.file.url;

  const captionText =
    image.caption && image.caption.length > 0
      ? image.caption.map((t) => t.plain_text).join("")
      : "";

  const captionElement =
    image.caption && image.caption.length > 0 ? (
      <RichText richText={image.caption} mapPageUrl={mapPageUrl} />
    ) : undefined;

  return (
    <ImageComponent
      src={src}
      alt={captionText || "Image"}
      caption={captionElement}
    />
  );
}

// --- Callout ---
export function Callout({
  block,
  children,
  mapPageUrl,
}: BlockProps<CalloutBlockObjectResponse>) {
  const { icon, color, rich_text } = block.callout;
  const colorClass = mapColorToClass(color);

  // Render icon
  let iconElement: React.ReactNode = null;
  if (icon) {
    if (icon.type === "emoji") {
      iconElement = <span className="notion-callout-icon">{icon.emoji}</span>;
    } else if (icon.type === "external") {
      iconElement = (
        <img
          src={icon.external.url}
          alt=""
          className="notion-callout-icon notion-callout-icon-image"
        />
      );
    } else if (icon.type === "file") {
      iconElement = (
        <img
          src={icon.file.url}
          alt=""
          className="notion-callout-icon notion-callout-icon-image"
        />
      );
    }
  }

  return (
    <div id={block.id} className={`notion-block notion-callout ${colorClass}`}>
      {iconElement}
      <div className="notion-callout-content">
        <RichText richText={rich_text} mapPageUrl={mapPageUrl} />
        {children}
      </div>
    </div>
  );
}

// --- Bookmark ---
export function Bookmark({
  block,
  mapPageUrl,
}: {
  block: BookmarkBlockObjectResponse;
  mapPageUrl?: (href: string) => string;
}) {
  const { url, caption } = block.bookmark;

  return (
    <div id={block.id} className="notion-block notion-bookmark">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="notion-bookmark-link"
      >
        {url}
      </a>
      {caption && caption.length > 0 && (
        <div className="notion-caption">
          <RichText richText={caption} mapPageUrl={mapPageUrl} />
        </div>
      )}
    </div>
  );
}

// --- Toggle ---
import {
  CodeBlockObjectResponse,
  TableBlockObjectResponse,
  TableRowBlockObjectResponse,
  ToggleBlockObjectResponse,
} from "@notionhq/client/build/src/api-endpoints";

export function Toggle({
  block,
  children,
  mapPageUrl,
}: BlockProps<ToggleBlockObjectResponse>) {
  const { rich_text, color } = block.toggle;
  const colorClass = mapColorToClass(color);

  return (
    <details
      id={block.id}
      className={`notion-block notion-toggle ${colorClass}`}
    >
      <summary className="notion-toggle-summary">
        <RichText richText={rich_text} mapPageUrl={mapPageUrl} />
      </summary>
      {children}
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
export function DefaultCodeBlock({
  language,
  code,
  caption,
  className,
}: CodeBlockProps) {
  return (
    <figure className={`notion-block notion-code-block ${className ?? ""}`}>
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
  mapPageUrl,
}: {
  block: CodeBlockObjectResponse;
  CodeComponent?: React.ComponentType<CodeBlockProps>;
  mapPageUrl?: (href: string) => string;
}) {
  const { language, rich_text, caption } = block.code;
  const code = rich_text.map((t) => t.plain_text).join("");
  const captionElement =
    caption && caption.length > 0 ? (
      <RichText richText={caption} mapPageUrl={mapPageUrl} />
    ) : undefined;

  return (
    <CodeComponent language={language} code={code} caption={captionElement} />
  );
}

// --- Table ---
export function Table({
  block,
  children,
}: BlockProps<TableBlockObjectResponse>) {
  const { has_column_header, has_row_header } = block.table;

  return (
    <div
      id={block.id}
      className="notion-block notion-table-wrapper"
      style={{ overflowX: "auto", display: "block" }}
    >
      <table
        className="notion-table"
        data-has-column-header={has_column_header}
        data-has-row-header={has_row_header}
      >
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function TableRow({
  block,
  isFirstRow,
  hasRowHeader,
  mapPageUrl,
}: {
  block: TableRowBlockObjectResponse;
  isFirstRow?: boolean;
  hasRowHeader?: boolean;
  mapPageUrl?: (href: string) => string;
}) {
  const { cells } = block.table_row;

  return (
    <tr className="notion-table-row">
      {cells.map((cell, index) => {
        const isHeader = isFirstRow || (hasRowHeader && index === 0);
        const Tag = isHeader ? "th" : "td";
        return (
          <Tag key={index} className="notion-table-cell">
            <RichText richText={cell} mapPageUrl={mapPageUrl} />
          </Tag>
        );
      })}
    </tr>
  );
}

// --- ToDo ---
import { ToDoBlockObjectResponse } from "@notionhq/client/build/src/api-endpoints";

export function ToDo({
  block,
  children,
  mapPageUrl,
}: BlockProps<ToDoBlockObjectResponse>) {
  const { rich_text, checked, color } = block.to_do;
  const colorClass = mapColorToClass(color);

  return (
    <div
      id={block.id}
      className={`notion-block notion-to-do ${colorClass} ${checked ? "notion-to-do-checked" : ""}`}
    >
      <div className="notion-to-do-label">
        <input
          type="checkbox"
          checked={checked}
          readOnly
          className="notion-to-do-checkbox"
        />
        <div className="notion-to-do-text">
          <RichText richText={rich_text} mapPageUrl={mapPageUrl} />
        </div>
      </div>
      {children}
    </div>
  );
}

// --- Column List & Column ---
export function ColumnList({
  block,
  children,
}: BlockProps<ColumnListBlockObjectResponse>) {
  return (
    <div id={block.id} className="notion-block notion-column-list">
      {children}
    </div>
  );
}

export function Column({
  block,
  children,
}: BlockProps<ColumnBlockObjectResponse>) {
  // Notion API might provide width_ratio (0-1).
  // If provided, we use it to calculate width percentage.
  // If not, we default to generic flex-grow behavior.

  // Note: API types say width_ratio is in the property `column`? Let's check type definition.
  // Actually, ColumnBlockObjectResponse has `type: 'column'` and `column: { children: ... }` but specifically
  // standard Notion API response for column usually doesn't document `width_ratio` in the public TS types widely,
  // but let's check if usage works or if we need to cast safely.
  // Checking official docs again -- width_ratio IS documented but sometimes types lag.
  // We'll access it safely.

  // Actually based on my knowledge of the official client types, it might be there.
  // Let's assume it is or cast as needed.

  const widthRatio = (block as any).column?.width_ratio;

  const style: React.CSSProperties = widthRatio
    ? { flex: `${widthRatio} 1 0` }
    : { flex: 1 };

  return (
    <div id={block.id} className="notion-block notion-column" style={style}>
      {children}
    </div>
  );
}
