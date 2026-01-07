import type {
    BookmarkBlockObjectResponse,
    CalloutBlockObjectResponse,
    DividerBlockObjectResponse,
    Heading1BlockObjectResponse,
    Heading2BlockObjectResponse,
    Heading3BlockObjectResponse,
    ParagraphBlockObjectResponse,
    QuoteBlockObjectResponse,
} from '@notionhq/client/build/src/api-endpoints';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
    Bookmark,
    Callout,
    Divider,
    Heading1,
    Heading2,
    Heading3,
    Paragraph,
    Quote,
} from '../components/Typography';

// Helper to create a minimal block with rich_text
function createRichText(text: string) {
  return [{
    type: 'text' as const,
    text: { content: text, link: null },
    annotations: { bold: false, italic: false, strikethrough: false, underline: false, code: false, color: 'default' as const },
    plain_text: text,
    href: null,
  }];
}

describe('Paragraph', () => {
  it('should render a <p> tag with notion-paragraph class', () => {
    const block = {
      type: 'paragraph',
      paragraph: { rich_text: createRichText('Hello'), color: 'default' },
    } as ParagraphBlockObjectResponse;

    render(<Paragraph block={block} />);
    const p = screen.getByText('Hello').closest('p');
    expect(p).toHaveClass('notion-paragraph');
  });
});

describe('Heading1', () => {
  it('should render an <h1> tag with notion-h1 class', () => {
    const block = {
      type: 'heading_1',
      heading_1: { rich_text: createRichText('Title'), color: 'default', is_toggleable: false },
    } as Heading1BlockObjectResponse;

    render(<Heading1 block={block} />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });
});

describe('Heading2', () => {
  it('should render an <h2> tag', () => {
    const block = {
      type: 'heading_2',
      heading_2: { rich_text: createRichText('Subtitle'), color: 'default', is_toggleable: false },
    } as Heading2BlockObjectResponse;

    render(<Heading2 block={block} />);
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
  });
});

describe('Heading3', () => {
  it('should render an <h3> tag', () => {
    const block = {
      type: 'heading_3',
      heading_3: { rich_text: createRichText('Sub-subtitle'), color: 'default', is_toggleable: false },
    } as Heading3BlockObjectResponse;

    render(<Heading3 block={block} />);
    expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
  });
});

describe('Quote', () => {
  it('should render a <blockquote> tag with notion-quote class', () => {
    const block = {
      type: 'quote',
      quote: { rich_text: createRichText('A wise quote'), color: 'default' },
    } as QuoteBlockObjectResponse;

    render(<Quote block={block} />);
    const quote = screen.getByText('A wise quote').closest('blockquote');
    expect(quote).toHaveClass('notion-quote');
  });
});

describe('Divider', () => {
  it('should render an <hr> tag with notion-divider class', () => {
    const block = {
      type: 'divider',
      divider: {},
    } as DividerBlockObjectResponse;

    const { container } = render(<Divider block={block} />);
    const hr = container.querySelector('hr');
    expect(hr).toHaveClass('notion-divider');
  });
});

describe('Callout', () => {
  it('should render with notion-callout class and emoji icon', () => {
    const block = {
      type: 'callout',
      callout: {
        rich_text: createRichText('Important note'),
        color: 'gray_background',
        icon: { type: 'emoji', emoji: '💡' },
      },
    } as CalloutBlockObjectResponse;

    render(<Callout block={block} />);
    expect(screen.getByText('💡')).toBeInTheDocument();
    expect(screen.getByText('Important note')).toBeInTheDocument();
  });
});

describe('Bookmark', () => {
  it('should render a link with the URL', () => {
    const block = {
      type: 'bookmark',
      bookmark: {
        url: 'https://example.com',
        caption: [],
      },
    } as BookmarkBlockObjectResponse;

    render(<Bookmark block={block} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(link).toHaveAttribute('target', '_blank');
  });
});
