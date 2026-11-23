import { test, describe, assert } from 'vitest';
import { filterTagOptions, optionName } from '@/components/TagPicker';

const params = (inputValue: string) =>
  ({ inputValue, getOptionLabel: (o: { tag_name: string }) => o.tag_name }) as Parameters<typeof filterTagOptions>[1];

describe('filterTagOptions', () => {
  const options = [{ id: 1, tag_name: 'Italy 2027' }, { id: 2, tag_name: 'Birthday' }];

  test('offers to create a tag that does not exist yet', () => {
    const result = filterTagOptions(options, params('Wedding'));
    assert.deepEqual(result.at(-1), { inputValue: 'Wedding', tag_name: 'Add "Wedding"' });
  });

  test('does not offer to create a tag that exists, whatever its case', () => {
    const result = filterTagOptions(options, params('birthday'));
    assert.isFalse(result.some((o) => o.inputValue !== undefined));
  });
});

describe('optionName', () => {
  test('reads typed text, the add option and an existing tag alike', () => {
    assert.equal(optionName('  Wedding '), 'Wedding');
    assert.equal(optionName({ inputValue: 'Wedding', tag_name: 'Add "Wedding"' }), 'Wedding');
    assert.equal(optionName({ id: 2, tag_name: 'Birthday' }), 'Birthday');
  });
});
