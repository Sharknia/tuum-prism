import type { RichTextItemResponse } from '@notionhq/client/build/src/api-endpoints';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RichText } from '../components/RichText';

// Mock factory for RichTextItemResponse
function createTextItem(
  content: string,
  annotations: Partial<RichTextItemResponse['annotations']> = {},
  href: string | null = null
): RichTextItemResponse {
  return {
    type: 'text',
    text: { content, link: href ? { url: href } : null },
    annotations: {
      bold: false,
      italic: false,
      strikethrough: false,
      underline: false,
      code: false,
      color: 'default',
      ...annotations,
    },
    plain_text: content,
    href,
  };
}

describe('RichText', () => {
  it('should return null for empty array', () => {
    const { container } = render(<RichText richText={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render plain text', () => {
    const richText = [createTextItem('Hello World')];
    render(<RichText richText={richText} />);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('should render bold text with <strong> tag', () => {
    const richText = [createTextItem('Bold Text', { bold: true })];
    render(<RichText richText={richText} />);
    const boldElement = screen.getByText('Bold Text');
    expect(boldElement.tagName).toBe('STRONG');
  });

  it('should render italic text with <em> tag', () => {
    const richText = [createTextItem('Italic Text', { italic: true })];
    render(<RichText richText={richText} />);
    const italicElement = screen.getByText('Italic Text');
    expect(italicElement.tagName).toBe('EM');
  });

  it('should render code with <code> tag and notion-code class', () => {
    const richText = [createTextItem('code snippet', { code: true })];
    render(<RichText richText={richText} />);
    const codeElement = screen.getByText('code snippet');
    expect(codeElement.tagName).toBe('CODE');
    expect(codeElement).toHaveClass('notion-code');
  });

  it('should render link with <a> tag and security attributes', () => {
    const richText = [createTextItem('Click here', {}, 'https://example.com')];
    render(<RichText richText={richText} />);
    const linkElement = screen.getByText('Click here');
    expect(linkElement.tagName).toBe('A');
    expect(linkElement).toHaveAttribute('href', 'https://example.com');
    expect(linkElement).toHaveAttribute('target', '_blank');
    expect(linkElement).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('should apply color class for non-default colors', () => {
    const richText = [createTextItem('Orange Text', { color: 'orange' })];
    const { container } = render(<RichText richText={richText} />);
    const colorSpan = container.querySelector('.notion-color-orange');
    expect(colorSpan).toBeInTheDocument();
    expect(colorSpan).toHaveTextContent('Orange Text');
  });

  it('should handle combined annotations (bold + italic)', () => {
    const richText = [createTextItem('Bold Italic', { bold: true, italic: true })];
    render(<RichText richText={richText} />);
    const strongElement = screen.getByText('Bold Italic').closest('strong');
    expect(strongElement).toBeInTheDocument();
    const emElement = screen.getByText('Bold Italic');
    expect(emElement.tagName).toBe('EM');
  });

  describe('mapPageUrl', () => {
    it('should use original href when mapPageUrl is undefined (Regression)', () => {
      const richText = [createTextItem('Link', {}, '/page-id')];
      // @ts-ignore - mapPageUrl not yet in type
      render(<RichText richText={richText} />);
      const link = screen.getByText('Link');
      expect(link).toHaveAttribute('href', '/page-id');
    });

    it('should transform href using mapPageUrl when provided', () => {
      const richText = [createTextItem('Link', {}, '/page-id')];
      const mapPageUrl = (href: string) => `/blog${href}`;
      // @ts-ignore - mapPageUrl not yet in type
      render(<RichText richText={richText} mapPageUrl={mapPageUrl} />);
      const link = screen.getByText('Link');
      expect(link).toHaveAttribute('href', '/blog/page-id');
    });

    it('should handle complex transformation logic', () => {
      const richText = [
        createTextItem('Internal', {}, '/internal-id'),
        createTextItem('External', {}, 'https://google.com')
      ];
      
      const mapPageUrl = (href: string) => {
        if (href.startsWith('http')) return href;
        return `/blog${href}`;
      };

      // @ts-ignore - mapPageUrl not yet in type
      render(<RichText richText={richText} mapPageUrl={mapPageUrl} />);
      
      const internalLink = screen.getByText('Internal');
      expect(internalLink).toHaveAttribute('href', '/blog/internal-id');
      
      const externalLink = screen.getByText('External');
      expect(externalLink).toHaveAttribute('href', 'https://google.com');
    });
  });
});
