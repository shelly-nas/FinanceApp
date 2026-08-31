import React, { useState } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableHead, TableRow,
  LinearProgress, IconButton, Button, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, Chip, Tooltip, useTheme,
} from '@mui/material';
import ArchiveIcon from '@mui/icons-material/Archive';
import UnarchiveIcon from '@mui/icons-material/Unarchive';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import DashboardBox from '@/components/DashboardBox';
import {
  useGetTagsQuery,
  useCreateTagMutation,
  useUpdateTagMutation,
  useDeleteTagMutation,
  useGetTagSummaryQuery,
} from '@/api';
import TagDetails from '@/scenes/tags/TagDetails';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(value);

/**
 * Overview of event tags. A tag collects spending that spans several months -
 * flights booked in February and restaurants in September belong to the same
 * holiday - which the monthly category breakdown cannot express.
 */
const Tags: React.FC = () => {
  const { palette } = useTheme();
  const { data: tags } = useGetTagsQuery();
  const [createTag] = useCreateTagMutation();
  const [updateTag] = useUpdateTagMutation();
  const [deleteTag] = useDeleteTagMutation();

  const [selectedTagId, setSelectedTagId] = useState<number | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newBudget, setNewBudget] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) {
      setError('Give the event a name');
      return;
    }
    try {
      await createTag({
        tag_name: name,
        budget: newBudget ? Number(newBudget) : null,
      }).unwrap();
      setAddOpen(false);
      setNewName('');
      setNewBudget('');
      setError(null);
    } catch (e: any) {
      setError(e?.data?.error ?? 'Could not create the tag');
    }
  };

  const handleDelete = async () => {
    if (deleteId === null) return;
    await deleteTag(deleteId);
    if (selectedTagId === deleteId) setSelectedTagId(null);
    setDeleteId(null);
  };

  return (
    <Box>
      <DashboardBox sx={{ mb: 1.5, p: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography variant="h3" sx={{ flexGrow: 1 }}>Events</Typography>
          <Button size="small" startIcon={<AddIcon />} onClick={() => setAddOpen(true)}>
            New event
          </Button>
        </Box>

        {(!tags || tags.length === 0) ? (
          <Typography variant="body3">
            No events yet. Create one, then tag its transactions from the review screen.
          </Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Event</TableCell>
                <TableCell align="right">Transactions</TableCell>
                <TableCell align="right">Budget</TableCell>
                <TableCell sx={{ width: '30%' }}>Progress</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tags.map((tag) => (
                <TableRow
                  key={tag.id}
                  hover
                  onClick={() => setSelectedTagId(tag.id === selectedTagId ? null : tag.id)}
                  sx={{
                    cursor: 'pointer',
                    opacity: tag.is_closed ? 0.55 : 1,
                    backgroundColor: selectedTagId === tag.id ? palette.grey[100] : 'inherit',
                  }}
                >
                  <TableCell>
                    <Chip
                      size="small"
                      label={tag.tag_name}
                      sx={tag.color ? { backgroundColor: tag.color } : undefined}
                    />
                    {tag.is_closed && (
                      <Typography variant="body3" sx={{ ml: 1 }}>closed</Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">{tag.transaction_count ?? 0}</TableCell>
                  <TableCell align="right">
                    {tag.budget ? formatCurrency(Number(tag.budget)) : '-'}
                  </TableCell>
                  <TableCell>
                    <TagProgress tagId={tag.id} budget={tag.budget ? Number(tag.budget) : null} />
                  </TableCell>
                  <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                    <Tooltip title={tag.is_closed ? 'Reopen' : 'Close event'}>
                      <IconButton
                        size="small"
                        onClick={() => updateTag({ id: tag.id, updates: { is_closed: !tag.is_closed } })}
                      >
                        {tag.is_closed ? <UnarchiveIcon fontSize="small" /> : <ArchiveIcon fontSize="small" />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" onClick={() => setDeleteId(tag.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DashboardBox>

      {selectedTagId !== null && <TagDetails tagId={selectedTagId} />}

      <Dialog open={addOpen} onClose={() => setAddOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>New event</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            margin="dense"
            label="Name"
            placeholder="Holiday Italy 2027"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            error={Boolean(error)}
            helperText={error}
          />
          <TextField
            fullWidth
            margin="dense"
            label="Budget (optional)"
            type="number"
            value={newBudget}
            onChange={(e) => setNewBudget(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button onClick={handleCreate}>Create</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteId !== null} onClose={() => setDeleteId(null)}>
        <DialogTitle>Delete event</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            The event and its tag assignments are removed. The transactions
            themselves are kept.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button color="error" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

/** Spend-against-budget bar; only meaningful once a budget is set. */
const TagProgress: React.FC<{ tagId: number; budget: number | null }> = ({ tagId, budget }) => {
  const { data: summary } = useGetTagSummaryQuery(tagId);
  if (!summary) return null;

  const spent = Number(summary.total_spent) - Number(summary.total_received);

  if (!budget) {
    return <Typography variant="body3">{formatCurrency(spent)}</Typography>;
  }

  const pct = Math.min((spent / budget) * 100, 100);
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <LinearProgress
        variant="determinate"
        value={pct}
        color={spent > budget ? 'error' : 'primary'}
        sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
      />
      <Typography variant="body3">{formatCurrency(spent)}</Typography>
    </Box>
  );
};

export default Tags;
