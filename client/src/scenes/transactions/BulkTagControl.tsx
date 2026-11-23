import React, { useState } from 'react';
import { Autocomplete, Box, Button, TextField } from '@mui/material';
import { useBulkSetTagMutation, useCreateTagMutation, useGetTagsQuery } from '@/api';
import { TagOption, filterTagOptions, optionName } from '@/components/TagPicker';

interface Props {
  ids: number[];
  /** Reports the outcome, for the page's toast. */
  onDone: (message: string, severity: 'success' | 'error') => void;
}

/**
 * Tags every selected transaction at once: pick a tag - or type a new one -
 * then add it to the selection or take it off. Tags a row already carries
 * stay; only the picked one changes.
 */
const BulkTagControl: React.FC<Props> = ({ ids, onDone }) => {
  const { data: tags } = useGetTagsQuery({ includeClosed: false });
  const [createTag] = useCreateTagMutation();
  const [bulkSetTag] = useBulkSetTagMutation();
  const [picked, setPicked] = useState<TagOption | null>(null);
  const [busy, setBusy] = useState(false);

  const apply = async (mode: 'add' | 'remove') => {
    if (!picked) return;
    setBusy(true);
    try {
      const name = optionName(picked);
      const existing = picked.id
        ? picked
        : tags?.find((t) => t.tag_name.toLowerCase() === name.toLowerCase());
      const tagId = existing?.id ?? (await createTag({ tag_name: name }).unwrap()).id;
      const { affected } = await bulkSetTag({ ids, tagId, mode }).unwrap();
      onDone(
        mode === 'add'
          ? `"${name}" added to ${affected} transaction(s)`
          : `"${name}" removed from ${affected} transaction(s)`,
        'success',
      );
      setPicked(null);
    } catch {
      onDone('Could not change the tags, please try again.', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Autocomplete
        freeSolo
        size="small"
        options={(tags ?? []) as TagOption[]}
        value={picked}
        onChange={(_e, value) =>
          setPicked(typeof value === 'string' ? (value.trim() ? { tag_name: value.trim() } : null) : value)
        }
        getOptionLabel={(option) => (typeof option === 'string' ? option : option.inputValue ?? option.tag_name)}
        filterOptions={filterTagOptions}
        renderInput={(params) => (
          <TextField {...params} placeholder="Tag for all selected…" inputProps={{ ...params.inputProps, 'aria-label': 'Tag for all selected' }} />
        )}
        sx={{ minWidth: 220 }}
      />
      <Button variant="outlined" size="small" disabled={!picked || busy} onClick={() => apply('add')}>
        Add tag
      </Button>
      <Button variant="text" size="small" disabled={!picked?.id || busy} onClick={() => apply('remove')}>
        Remove tag
      </Button>
    </Box>
  );
};

export default BulkTagControl;
