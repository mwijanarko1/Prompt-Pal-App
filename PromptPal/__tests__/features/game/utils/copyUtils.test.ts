import { getMatchedRequirements } from '@/features/game/utils/copyUtils';

describe('getMatchedRequirements', () => {
  it('returns matched when copy contains element (case-insensitive)', () => {
    const result = getMatchedRequirements('Buy now and get 20% off', ['Buy now', '20%']);
    expect(result).toEqual([
      { label: 'Buy now', matched: true },
      { label: '20%', matched: true },
    ]);
  });

  it('returns missing when copy does not contain element', () => {
    const result = getMatchedRequirements('Hello world', ['CTA', 'Discount']);
    expect(result).toEqual([
      { label: 'CTA', matched: false },
      { label: 'Discount', matched: false },
    ]);
  });

  it('handles mixed matched and missing', () => {
    const result = getMatchedRequirements('Use code SAVE10 today', ['SAVE10', 'expires']);
    expect(result).toEqual([
      { label: 'SAVE10', matched: true },
      { label: 'expires', matched: false },
    ]);
  });

  it('is case-insensitive for copy', () => {
    const result = getMatchedRequirements('SHOP NOW', ['shop now']);
    expect(result).toEqual([{ label: 'shop now', matched: true }]);
  });

  it('is case-insensitive for element', () => {
    const result = getMatchedRequirements('shop now', ['SHOP NOW']);
    expect(result).toEqual([{ label: 'SHOP NOW', matched: true }]);
  });

  it('returns empty array when requiredElements is empty', () => {
    const result = getMatchedRequirements('Any copy', []);
    expect(result).toEqual([]);
  });

  it('trims copy before matching', () => {
    const result = getMatchedRequirements('  hello  ', ['hello']);
    expect(result).toEqual([{ label: 'hello', matched: true }]);
  });
});
