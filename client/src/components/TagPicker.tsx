import React, { useState } from 'react';
import {
  Autocomplete, TextField, Chip, CircularProgress, createFilterOptions,
} from '@mui/material';
import {
  Tag,
  useGetTagsQuery,
  useCreateTagMutation,
  useGetTransactionTagsQuery,
  useSetTransactionTagsMutation,
} from '@/api';

const filter = createFilterOptions<TagOption>();

interface TagOption extends Partial<Tag> {
  tag_name: string;
  inputValue?: string;
}

interface TagPickerProps {
  transactionId: number;
  size?: 'small' | 'medium';
}

/**
 * Assigns event tags to a transaction. Tags are optional and a transaction may
 * carry several - a holiday dinner can be both "Italy 2027" and "Birthday".
 * Typing a name that does not exist yet offers to create it inline.
 */
const TagPicker: React.FC<TagPickerProps> = ({ transactionId, size = 'small' }) => {
  const { data: allTags, isLoading: loadingTags } = useGetTagsQuery({ includeClosed: false });
  const { data: currentTags, isLoading: loadingCurrent } = useGetTransactionTagsQuery(transactionId);
  const [createTag] = useCreateTagMutation();
  const [setTransactionTags] = useSetTransactionTagsMutation();
  const [saving, setSaving] = useState(false);

  const handleChange = async (_event: unknown, values: (TagOption | string)[]) => {
    setSaving(true);
    try {
      const ids: number[] = [];

      for (const value of values) {
        // A free-typed name arrives as a string; the "Add ..." option carries inputValue.
        const newName =
          typeof value === 'string' ? value : value.inputValue ?? (value.id ? null : value.tag_name);

        if (newName) {
          const existing = allTags?.find(
            (t) => t.tag_name.toLowerCase() === newName.trim().toLowerCase(),
          );
          if (existing) {
            ids.push(existing.id);
          } else {
            const created = await createTag({ tag_name: newName.trim() }).unwrap();
            ids.push(created.id);
          }
        } else if (typeof value !== 'string' && value.id) {
          ids.push(value.id);
        }
      }

      await setTransactionTags({ id: transactionId, tagIds: ids }).unwrap();
    } finally {
      setSaving(false);
    }
  };

  if (loadingTags || loadingCurrent) {
    return <CircularProgress size={16} />;
  }

  return (
    <Autocomplete
      multiple
      freeSolo
      size={size}
      options={(allTags ?? []) as TagOption[]}
      value={(currentTags ?? []) as TagOption[]}
      loading={saving}
      disabled={saving}
      getOptionLabel={(option) =>
        typeof option === 'string' ? option : option.inputValue ?? option.tag_name
      }
      isOptionEqualToValue={(option, value) => option.id === value.id}
      filterOptions={(options, params) => {
        const filtered = filter(options, params);
        const typed = params.inputValue.trim();
        const exists = options.some((o) => o.tag_name.toLowerCase() === typed.toLowerCase());
        if (typed !== '' && !exists) {
          filtered.push({ inputValue: typed, tag_name: `Add "${typed}"` });
        }
        return filtered;
      }}
      onChange={handleChange}
      renderTags={(value, getTagProps) =>
        value.map((option, index) => (
          <Chip
            {...getTagProps({ index })}
            key={option.id ?? option.tag_name}
            label={option.tag_name}
            size="small"
            sx={option.color ? { backgroundColor: option.color } : undefined}
          />
        ))
      }
      renderInput={(params) => (
        <TextField {...params} variant="standard" placeholder="Add tag" />
      )}
      sx={{ minWidth: 180 }}
    />
  );
};

export default TagPicker;
