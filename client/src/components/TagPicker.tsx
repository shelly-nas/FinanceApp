import React, { useEffect, useState } from 'react';
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

export interface TagOption extends Partial<Tag> {
  tag_name: string;
  inputValue?: string;
}

/** The name a picked option stands for: typed text, the "Add" option, or a tag. */
export const optionName = (value: TagOption | string) =>
  typeof value === 'string' ? value.trim() : (value.inputValue ?? value.tag_name).trim();

/**
 * Options for a tag Autocomplete: the matches, plus an "Add" entry when the
 * typed name is not a tag yet.
 */
export const filterTagOptions = (
  options: TagOption[],
  params: Parameters<typeof filter>[1],
) => {
  const filtered = filter(options, params);
  const typed = params.inputValue.trim();
  const exists = options.some((o) => o.tag_name.toLowerCase() === typed.toLowerCase());
  if (typed !== '' && !exists) {
    filtered.push({ inputValue: typed, tag_name: `Add "${typed}"` });
  }
  return filtered;
};

interface TagPickerProps {
  transactionId: number;
  size?: 'small' | 'medium';
}

/**
 * Assigns event tags to a transaction. Tags are optional and a transaction may
 * carry several - a holiday dinner can be both "Italy 2027" and "Birthday".
 * Typing a name that does not exist yet offers to create it inline.
 *
 * The change shows at once and is saved in the background. The field stays
 * enabled while it saves: disabling it blurred the input and swapped the
 * placeholder in and out, which made it flicker on every change.
 */
const TagPicker: React.FC<TagPickerProps> = ({ transactionId, size = 'small' }) => {
  const { data: allTags, isLoading: loadingTags } = useGetTagsQuery({ includeClosed: false });
  const { data: currentTags, isLoading: loadingCurrent } = useGetTransactionTagsQuery(transactionId);
  const [createTag] = useCreateTagMutation();
  const [setTransactionTags] = useSetTransactionTagsMutation();
  // What the user just picked, shown until the saved tags come back.
  const [pending, setPending] = useState<TagOption[] | null>(null);

  // The refetched tags replace the optimistic value as soon as they arrive.
  useEffect(() => setPending(null), [currentTags]);

  const handleChange = async (_event: unknown, values: (TagOption | string)[]) => {
    const shown = values
      .map((value) => {
        const name = optionName(value);
        if (!name) return null;
        if (typeof value !== 'string' && value.id) return value;
        return allTags?.find((t) => t.tag_name.toLowerCase() === name.toLowerCase()) ?? { tag_name: name };
      })
      .filter((v): v is TagOption => v !== null);
    setPending(shown);

    try {
      const ids: number[] = [];
      for (const option of shown) {
        if (option.id) {
          ids.push(option.id);
        } else {
          const created = await createTag({ tag_name: option.tag_name }).unwrap();
          ids.push(created.id);
        }
      }
      await setTransactionTags({ id: transactionId, tagIds: ids }).unwrap();
    } catch {
      // Back to what is stored; the refetch never comes for a failed save.
      setPending(null);
    }
  };

  if (loadingTags || loadingCurrent) {
    return <CircularProgress size={16} />;
  }

  const value = pending ?? ((currentTags ?? []) as TagOption[]);

  return (
    <Autocomplete
      multiple
      freeSolo
      size={size}
      options={(allTags ?? []) as TagOption[]}
      value={value}
      getOptionLabel={(option) =>
        typeof option === 'string' ? option : option.inputValue ?? option.tag_name
      }
      isOptionEqualToValue={(option, selected) =>
        option.id !== undefined ? option.id === selected.id : option.tag_name === selected.tag_name
      }
      filterOptions={filterTagOptions}
      onChange={handleChange}
      renderTags={(selected, getTagProps) =>
        selected.map((option, index) => (
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
        // The placeholder only on an empty field: beside chips it is noise.
        // No underline: the field reads as part of the row, and shows its
        // edges only on hover and focus.
        <TextField
          {...params}
          variant="standard"
          placeholder={value.length === 0 ? 'Add tag' : undefined}
          InputProps={{ ...params.InputProps, disableUnderline: true }}
          sx={{
            '& .MuiInputBase-root': {
              borderRadius: 1.5,
              px: 1,
              transition: 'background-color 150ms ease, box-shadow 150ms ease',
              '&:hover': { bgcolor: 'action.hover' },
              '&.Mui-focused': { bgcolor: 'background.paper', boxShadow: (theme) => `inset 0 0 0 1px ${theme.palette.primary.main}` },
            },
          }}
        />
      )}
      sx={{ minWidth: 180 }}
    />
  );
};

export default TagPicker;
