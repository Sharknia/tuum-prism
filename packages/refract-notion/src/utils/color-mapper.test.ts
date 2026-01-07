import { describe, expect, it } from 'vitest';
import { mapColorToClass } from '../utils/color-mapper';

describe('mapColorToClass', () => {
  it('should return notion-color-default for default color', () => {
    expect(mapColorToClass('default')).toBe('notion-color-default');
  });

  it('should return notion-color-{color} for text colors', () => {
    expect(mapColorToClass('orange')).toBe('notion-color-orange');
    expect(mapColorToClass('blue')).toBe('notion-color-blue');
    expect(mapColorToClass('red')).toBe('notion-color-red');
    expect(mapColorToClass('gray')).toBe('notion-color-gray');
  });

  it('should return notion-bg-{color} for background colors', () => {
    expect(mapColorToClass('gray_background')).toBe('notion-bg-gray');
    expect(mapColorToClass('orange_background')).toBe('notion-bg-orange');
    expect(mapColorToClass('blue_background')).toBe('notion-bg-blue');
  });

  it('should handle default_background', () => {
    expect(mapColorToClass('default_background')).toBe('notion-bg-default');
  });
});
