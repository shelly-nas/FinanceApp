import { test, describe, assert } from 'vitest';
import { combineImports, isCsv, uploadErrorMessage } from '@/utils/importBatch';

const summary = (createdIds: number[], skipped = 0, markedInternal = 0) => ({
  message: 'Entries imported successfully',
  createdIds,
  imported: createdIds.length,
  skipped,
  markedInternal,
});

describe('combineImports', () => {
  test('adds up the files into one summary', () => {
    const combined = combineImports([summary([1, 2], 3, 1), summary([7], 0, 0)]);
    assert.deepEqual(combined, {
      createdIds: [1, 2, 7],
      imported: 3,
      skipped: 3,
      markedInternal: 1,
    });
  });

  test('is empty for no files', () => {
    assert.deepEqual(combineImports([]), { createdIds: [], imported: 0, skipped: 0, markedInternal: 0 });
  });
});

describe('isCsv', () => {
  test('accepts a CSV by extension or by type', () => {
    assert.isTrue(isCsv({ name: 'Export.CSV', type: '' }));
    assert.isTrue(isCsv({ name: 'export', type: 'text/csv' }));
  });

  test('rejects anything else', () => {
    assert.isFalse(isCsv({ name: 'afschrift.pdf', type: 'application/pdf' }));
  });
});

describe('uploadErrorMessage', () => {
  test('uses the error the server sent as JSON', () => {
    assert.equal(uploadErrorMessage({ status: 400, data: { error: 'Invalid bank type' } }), 'Invalid bank type');
  });

  test('uses a plain-text error body', () => {
    assert.equal(uploadErrorMessage({ status: 400, data: 'Bad file' }), 'Bad file');
  });

  test('falls back to a generic message', () => {
    assert.equal(uploadErrorMessage(undefined), 'Error uploading file');
  });
});
