import type { NotionBlock } from '../types';
import {
  Bookmark,
  BulletedListItem,
  Callout,
  CodeBlock,
  Divider,
  Heading1,
  Heading2,
  Heading3,
  ImageBlock,
  NumberedListItem,
  Paragraph,
  Quote,
  Table,
  TableRow,
  ToDo,
  Toggle,
} from './Typography';

export interface BlockRendererProps {
  blocks: NotionBlock[];
  depth?: number;
}

// Internal type for grouped list
type ListGroupBlock = {
  type: 'list_group';
  listType: 'bulleted_list_item' | 'numbered_list_item';
  items: NotionBlock[];
};

type RenderableBlock = NotionBlock | ListGroupBlock;

// Preprocessor to group consecutive list items
function groupLists(blocks: NotionBlock[]): RenderableBlock[] {
  const result: RenderableBlock[] = [];
  let currentListGroup: ListGroupBlock | null = null;

  for (const block of blocks) {
    if (block.type === 'bulleted_list_item' || block.type === 'numbered_list_item') {
      if (currentListGroup && currentListGroup.listType === block.type) {
        // Continue existing list
        currentListGroup.items.push(block);
      } else {
        // Start new list (or switch list type)
        if (currentListGroup) {
          result.push(currentListGroup);
        }
        currentListGroup = {
          type: 'list_group',
          listType: block.type,
          items: [block],
        };
      }
    } else {
      // Non-list block
      if (currentListGroup) {
        result.push(currentListGroup);
        currentListGroup = null;
      }
      result.push(block);
    }
  }

  if (currentListGroup) {
    result.push(currentListGroup);
  }

  return result;
}

export function BlockRenderer({ blocks, depth = 0 }: BlockRendererProps) {
  if (!blocks || blocks.length === 0) {
    return null;
  }

  const renderableBlocks = groupLists(blocks);

  return (
    <>
      {renderableBlocks.map((block, index) => {
        // Handle ListGroup
        if (block.type === 'list_group') {
          const Tag = block.listType === 'numbered_list_item' ? 'ol' : 'ul';
          const listClassName = block.listType === 'numbered_list_item' ? 'notion-list notion-ol' : 'notion-list notion-ul';
          
          return (
            <Tag key={`list-group-${index}`} className={listClassName}>
              {block.items.map((item) => (
                <RenderBlock key={item.id} block={item as NotionBlock} depth={depth} />
              ))}
            </Tag>
          );
        }

        // Handle Standard Block
        return <RenderBlock key={(block as NotionBlock).id} block={block as NotionBlock} depth={depth} />;
      })}
    </>
  );
}

function RenderBlock({ block, depth }: { block: NotionBlock; depth: number }) {
  // Recursively render children with common indent wrapper
  const childrenContent = block.children && block.children.length > 0 ? (
    <div className="notion-indent">
      <BlockRenderer blocks={block.children} depth={depth + 1} />
    </div>
  ) : null;

  switch (block.type) {
    case 'paragraph':
      return <Paragraph block={block}>{childrenContent}</Paragraph>;
    case 'heading_1':
      return <Heading1 block={block}>{childrenContent}</Heading1>;
    case 'heading_2':
      return <Heading2 block={block}>{childrenContent}</Heading2>;
    case 'heading_3':
      return <Heading3 block={block}>{childrenContent}</Heading3>;
    case 'quote':
      return <Quote block={block}>{childrenContent}</Quote>;
    case 'bulleted_list_item':
      return <BulletedListItem block={block}>{childrenContent}</BulletedListItem>;
    case 'numbered_list_item':
      return <NumberedListItem block={block}>{childrenContent}</NumberedListItem>;
    case 'divider':
      return <Divider block={block} />;
    case 'image':
      return <ImageBlock block={block} />;
    case 'callout':
      return <Callout block={block}>{childrenContent}</Callout>;
    case 'bookmark':
      return <Bookmark block={block} />;
    case 'toggle':
      return <Toggle block={block}>{childrenContent}</Toggle>;
    case 'code':
      return <CodeBlock block={block} />;
    case 'table':
      // Table children are table_row blocks, render with header info
      const tableChildren = block.children?.map((row, index) => (
        <TableRow
          key={row.id}
          block={row as Parameters<typeof TableRow>[0]['block']}
          isFirstRow={index === 0 && block.table?.has_column_header}
          hasRowHeader={block.table?.has_row_header}
        />
      ));
      return <Table block={block}>{tableChildren}</Table>;
    case 'table_row':
      // table_row is handled by parent table block
      return null;
    case 'to_do':
      return <ToDo block={block}>{childrenContent}</ToDo>;
    // Future: support other blocks
    default:
      if (process.env.NODE_ENV === 'development') {
        return <div className="notion-block notion-unsupported">Unsupported block type: {block.type}</div>;
      }
      return null;
  }
}
