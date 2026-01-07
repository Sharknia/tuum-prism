import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BlockRenderer } from '../components/BlockRenderer';
import type { NotionBlock } from '../types';

// Helper to create a minimal paragraph block
function createParagraphBlock(text: string, id: string = 'test-id'): NotionBlock {
  return {
    id,
    type: 'paragraph',
    paragraph: {
      rich_text: [{
        type: 'text',
        text: { content: text, link: null },
        annotations: { bold: false, italic: false, strikethrough: false, underline: false, code: false, color: 'default' },
        plain_text: text,
        href: null,
      }],
      color: 'default',
    },
    has_children: false,
    archived: false,
    in_trash: false,
    created_time: '',
    last_edited_time: '',
    created_by: { object: 'user', id: '' },
    last_edited_by: { object: 'user', id: '' },
    parent: { type: 'page_id', page_id: '' },
    object: 'block',
  } as unknown as NotionBlock;
}

function createBulletedListItem(text: string, id: string): NotionBlock {
  return {
    id,
    type: 'bulleted_list_item',
    bulleted_list_item: {
      rich_text: [{
        type: 'text',
        text: { content: text, link: null },
        annotations: { bold: false, italic: false, strikethrough: false, underline: false, code: false, color: 'default' },
        plain_text: text,
        href: null,
      }],
      color: 'default',
    },
    has_children: false,
    archived: false,
    in_trash: false,
    created_time: '',
    last_edited_time: '',
    created_by: { object: 'user', id: '' },
    last_edited_by: { object: 'user', id: '' },
    parent: { type: 'page_id', page_id: '' },
    object: 'block',
  } as unknown as NotionBlock;
}

describe('BlockRenderer', () => {
  it('should return null for empty blocks array', () => {
    const { container } = render(<BlockRenderer blocks={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render a single paragraph block', () => {
    const blocks = [createParagraphBlock('Hello World')];
    render(<BlockRenderer blocks={blocks} />);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('should group consecutive bulleted list items into <ul>', () => {
    const blocks = [
      createBulletedListItem('Item 1', '1'),
      createBulletedListItem('Item 2', '2'),
      createBulletedListItem('Item 3', '3'),
    ];
    const { container } = render(<BlockRenderer blocks={blocks} />);
    
    const ul = container.querySelector('ul');
    expect(ul).toBeInTheDocument();
    expect(ul).toHaveClass('notion-ul');
    
    const listItems = container.querySelectorAll('li');
    expect(listItems).toHaveLength(3);
  });

  it('should separate list groups by non-list blocks', () => {
    const blocks = [
      createBulletedListItem('Item 1', '1'),
      createBulletedListItem('Item 2', '2'),
      createParagraphBlock('Paragraph in between', '3'),
      createBulletedListItem('Item 3', '4'),
    ];
    const { container } = render(<BlockRenderer blocks={blocks} />);
    
    const uls = container.querySelectorAll('ul');
    expect(uls).toHaveLength(2); // Two separate list groups
    
    expect(screen.getByText('Paragraph in between')).toBeInTheDocument();
  });
});
