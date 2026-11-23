import type { ImportSummary } from '@/api';

/** What the transactions page reports after an import, over every file. */
export interface CombinedImport {
  createdIds: number[];
  imported: number;
  skipped: number;
  markedInternal: number;
}

/** One summary for several imported files. */
export const combineImports = (summaries: ImportSummary[]): CombinedImport =>
  summaries.reduce<CombinedImport>(
    (total, s) => ({
      createdIds: [...total.createdIds, ...s.createdIds],
      imported: total.imported + s.imported,
      skipped: total.skipped + s.skipped,
      markedInternal: total.markedInternal + s.markedInternal,
    }),
    { createdIds: [], imported: 0, skipped: 0, markedInternal: 0 },
  );

/** Bank exports are CSV; browsers do not always set the type, so the name counts too. */
export const isCsv = (file: Pick<File, 'name' | 'type'>) =>
  file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv');

/**
 * The message to show for a failed upload. The server answers with JSON
 * (`{ error }`), but a proxy in between may answer with plain text.
 */
export const uploadErrorMessage = (failure: unknown): string => {
  const data = failure && typeof failure === 'object' && 'data' in failure
    ? (failure as { data: unknown }).data
    : undefined;
  if (typeof data === 'string' && data) return data;
  if (data && typeof data === 'object' && typeof (data as { error?: unknown }).error === 'string') {
    return (data as { error: string }).error;
  }
  return 'Error uploading file';
};
