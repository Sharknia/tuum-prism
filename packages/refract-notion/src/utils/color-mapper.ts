import { ApiColor } from '../types';

/**
 * Maps Notion API color to semantic CSS class name.
 * @param color The color string from Notion API (e.g., 'blue', 'blue_background')
 * @returns Semantic class name (e.g., 'notion-color-blue', 'notion-bg-blue')
 */
export function mapColorToClass(color: ApiColor): string {
  if (color === 'default') {
    return 'notion-color-default';
  }

  if (color.endsWith('_background')) {
    const baseColor = color.replace('_background', '');
    return `notion-bg-${baseColor}`;
  }

  return `notion-color-${color}`;
}
