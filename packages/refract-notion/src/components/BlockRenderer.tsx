import type { NotionBlock } from '../types';
import { RichText } from './RichText';
import {
    Bookmark,
    BulletedListItem,
    Callout,
    CodeBlock,
    type CodeBlockProps,
    Column,
    ColumnList,
    Divider,
    Heading1,
    Heading2,
    Heading3,
    ImageBlock,
    type ImageProps,
    NumberedListItem,
    Paragraph,
    Quote,
    Table,
    TableRow,
    ToDo,
    Toggle
} from './Typography';

/**
 * Custom components that can be injected into BlockRenderer.
 * This allows apps to provide their own implementations (e.g., Mermaid-aware code blocks).
 */
export interface BlockRendererComponents {
  CodeBlock?: React.ComponentType<CodeBlockProps>;
  ImageBlock?: React.ComponentType<ImageProps>;
}

export interface BlockRendererProps {
  blocks: NotionBlock[];
  depth?: number;
  /** Custom component overrides */
  components?: BlockRendererComponents;
  /** Function to transform page URLs (e.g. for internal routing) */
  mapPageUrl?: (href: string) => string;
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

export function BlockRenderer({ blocks, depth = 0, components, mapPageUrl }: BlockRendererProps) {
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
                <RenderBlock key={item.id} block={item as NotionBlock} depth={depth} components={components} mapPageUrl={mapPageUrl} />
              ))}
            </Tag>
          );
        }

        // Handle Standard Block
        return <RenderBlock key={(block as NotionBlock).id} block={block as NotionBlock} depth={depth} components={components} mapPageUrl={mapPageUrl} />;
      })}
    </>
  );
}

function RenderBlock({ block, depth, components, mapPageUrl }: { block: NotionBlock; depth: number; components?: BlockRendererComponents; mapPageUrl?: (href: string) => string }) {
  // Recursively render children with common indent wrapper
  const childrenContent = block.children && block.children.length > 0 ? (
    <div className="notion-indent">
      <BlockRenderer blocks={block.children} depth={depth + 1} components={components} mapPageUrl={mapPageUrl} />
    </div>
  ) : null;

  switch (block.type) {
    case 'paragraph':
      return <Paragraph block={block} mapPageUrl={mapPageUrl}>{childrenContent}</Paragraph>;
    case 'heading_1':
      return <Heading1 block={block} mapPageUrl={mapPageUrl}>{childrenContent}</Heading1>;
    case 'heading_2':
      return <Heading2 block={block} mapPageUrl={mapPageUrl}>{childrenContent}</Heading2>;
    case 'heading_3':
      return <Heading3 block={block} mapPageUrl={mapPageUrl}>{childrenContent}</Heading3>;
    case 'quote':
      return <Quote block={block} mapPageUrl={mapPageUrl}>{childrenContent}</Quote>;
    case 'bulleted_list_item':
      return <BulletedListItem block={block} mapPageUrl={mapPageUrl}>{childrenContent}</BulletedListItem>;
    case 'numbered_list_item':
      return <NumberedListItem block={block} mapPageUrl={mapPageUrl}>{childrenContent}</NumberedListItem>;
    case 'divider':
      return <Divider block={block} />;
    case 'image':
      return <ImageBlock block={block} mapPageUrl={mapPageUrl} />;
    case 'callout':
      return <Callout block={block} mapPageUrl={mapPageUrl}>{childrenContent}</Callout>;
    case 'bookmark':
      return <Bookmark block={block} mapPageUrl={mapPageUrl} />;
    case 'toggle':
      return <Toggle block={block} mapPageUrl={mapPageUrl}>{childrenContent}</Toggle>;
    case 'code': {
      // Use custom CodeBlock from props if provided, otherwise use default
      const CustomCodeBlock = components?.CodeBlock;
      if (CustomCodeBlock) {
        const { language, rich_text, caption } = (block as any).code;
        const code = rich_text.map((t: any) => t.plain_text).join('');
        const captionElement = caption && caption.length > 0 ? <RichText richText={caption} mapPageUrl={mapPageUrl} /> : undefined;
        return <CustomCodeBlock language={language} code={code} caption={captionElement} />;
      }
      return <CodeBlock block={block} mapPageUrl={mapPageUrl} />;
    }
    case 'table':
      // Table children are table_row blocks, render with header info
      const tableChildren = block.children?.map((row, index) => (
        <TableRow
          key={row.id}
          block={row as Parameters<typeof TableRow>[0]['block']}
          isFirstRow={index === 0 && block.table?.has_column_header}
          hasRowHeader={block.table?.has_row_header}
          mapPageUrl={mapPageUrl}
        />
      ));
      return <Table block={block}>{tableChildren}</Table>;
    case 'table_row':
      // table_row is handled by parent table block
      return null;
    case 'to_do':
      return <ToDo block={block} mapPageUrl={mapPageUrl}>{childrenContent}</ToDo>;
    case 'column_list':
      return (
        <ColumnList block={block}>
          <BlockRenderer blocks={block.children ?? []} depth={depth} components={components} mapPageUrl={mapPageUrl} />
        </ColumnList>
      );
    case 'column':
      return (
        <Column block={block}>
          <BlockRenderer blocks={block.children ?? []} depth={depth} components={components} mapPageUrl={mapPageUrl} />
        </Column>
      );
    // Future: support other blocks
    default:
      if (process.env.NODE_ENV === 'development') {
        return <div className="notion-block notion-unsupported">Unsupported block type: {block.type}</div>;
      }
      return null;
  }
}
