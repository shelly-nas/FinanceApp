import React, { useState } from 'react';
import {
  Box, Typography, TableBody, TableCell, TableHead, TableRow, Stack,
  LinearProgress, IconButton, Button, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, Chip, Tooltip,
} from '@mui/material';
import ArchiveIcon from '@mui/icons-material/Archive';
import UnarchiveIcon from '@mui/icons-material/Unarchive';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import DashboardBox from '@/components/DashboardBox';
import PageHeader from '@/components/PageHeader';
import CardTable from '@/components/CardTable';
import {
  Tag,
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
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editBudget, setEditBudget] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

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

  const openEdit = (tag: Tag) => {
    setEditId(tag.id);
    setEditName(tag.tag_name);
    // NUMERIC arrives as a string, and a null budget has to become '' rather
    // than the string 'null' for the field to read as empty.
    setEditBudget(tag.budget === null || tag.budget === undefined ? '' : String(tag.budget));
    setEditError(null);
  };

  const handleEdit = async () => {
    if (editId === null) return;
    const name = editName.trim();
    if (!name) {
      setEditError('Give the event a name');
      return;
    }
    const budget = editBudget.trim();
    if (budget && !(Number(budget) >= 0)) {
      setEditError('The budget has to be a positive amount, or empty for none');
      return;
    }
    try {
      await updateTag({
        id: editId,
        // null rather than omitted when the field is cleared: leaving the key
        // out would keep the old budget, so there would be no way to remove one.
        updates: { tag_name: name, budget: budget === '' ? null : Number(budget) },
      }).unwrap();
      setEditId(null);
      setEditError(null);
    } catch (e: any) {
      // 409 when another event already carries the name - tag_name is unique,
      // so the message has to reach the dialog rather than closing it.
      setEditError(e?.data?.error ?? 'Could not save the event');
    }
  };

  const handleDelete = async () => {
    if (deleteId === null) return;
    await deleteTag(deleteId);
    if (selectedTagId === deleteId) setSelectedTagId(null);
    setDeleteId(null);
  };

  return (
    <>
      <PageHeader
        title="Events"
        subtitle="Spending that spans months, like a holiday or a renovation. Select one to see where the money went."
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddOpen(true)}>
            New event
          </Button>
        }
      />

      <Stack spacing={6} useFlexGap>
        <DashboardBox>
          {(!tags || tags.length === 0) ? (
            <Typography variant="body2">
              No events yet. Create one, then tag its transactions on the Transactions page.
            </Typography>
          ) : (
            <CardTable>
              <TableHead>
                <TableRow>
                  <TableCell>Event</TableCell>
                  <TableCell align="right">Transactions</TableCell>
                  <TableCell align="right">Budget</TableCell>
                  <TableCell sx={{ width: '30%' }}>Progress</TableCell>
                  <TableCell align="right"><span className="visually-hidden">Actions</span></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tags.map((tag) => (
                  <TableRow
                    key={tag.id}
                    hover
                    selected={selectedTagId === tag.id}
                    tabIndex={0}
                    aria-selected={selectedTagId === tag.id}
                    onClick={() => setSelectedTagId(tag.id === selectedTagId ? null : tag.id)}
                    onKeyDown={(e) => {
                      if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        setSelectedTagId(tag.id === selectedTagId ? null : tag.id);
                      }
                    }}
                    sx={{
                      cursor: 'pointer',
                      // Selected: tinted row plus a bar at the start - two signals.
                      '&.Mui-selected': { boxShadow: (theme) => `inset 3px 0 0 ${theme.palette.primary.main}` },
                      '&:focus-visible': { outline: (theme) => `2px solid ${theme.palette.primary.main}`, outlineOffset: -2 },
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box
                          aria-hidden
                          sx={{ width: 10, height: 10, borderRadius: 999, flexShrink: 0, bgcolor: tag.color ?? 'text.disabled' }}
                        />
                        <Typography
                          component="span"
                          sx={{ fontSize: 14, fontWeight: selectedTagId === tag.id ? 600 : 500, color: tag.is_closed ? 'text.secondary' : 'text.primary' }}
                        >
                          {tag.tag_name}
                        </Typography>
                        {tag.is_closed && <Chip size="small" variant="outlined" label="Closed" />}
                      </Box>
                    </TableCell>
                    <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>{tag.transaction_count ?? 0}</TableCell>
                    <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                      {tag.budget ? formatCurrency(Number(tag.budget)) : '—'}
                    </TableCell>
                    <TableCell>
                      <TagProgress tagId={tag.id} budget={tag.budget ? Number(tag.budget) : null} />
                    </TableCell>
                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                      <Tooltip title="Edit">
                        <IconButton size="small" aria-label={`Edit ${tag.tag_name}`} onClick={() => openEdit(tag)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={tag.is_closed ? 'Reopen' : 'Close event'}>
                        <IconButton
                          size="small"
                          aria-label={tag.is_closed ? `Reopen ${tag.tag_name}` : `Close ${tag.tag_name}`}
                          onClick={() => updateTag({ id: tag.id, updates: { is_closed: !tag.is_closed } })}
                        >
                          {tag.is_closed ? <UnarchiveIcon fontSize="small" /> : <ArchiveIcon fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" aria-label={`Delete ${tag.tag_name}`} onClick={() => setDeleteId(tag.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </CardTable>
          )}
        </DashboardBox>

        {selectedTagId !== null && <TagDetails tagId={selectedTagId} />}
      </Stack>

      <Dialog open={addOpen} onClose={() => setAddOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>New event</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Name"
            placeholder="Holiday Italy 2027"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            error={Boolean(error)}
            helperText={error}
          />
          <TextField
            fullWidth
            label="Budget (optional)"
            type="number"
            value={newBudget}
            onChange={(e) => setNewBudget(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button variant="text" onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate}>Create event</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={editId !== null}
        onClose={() => setEditId(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Edit event</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleEdit(); }}
            error={Boolean(editError)}
          />
          <TextField
            fullWidth
            label="Budget"
            type="number"
            placeholder="None"
            value={editBudget}
            onChange={(e) => setEditBudget(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleEdit(); }}
            error={Boolean(editError)}
            helperText={editError ?? 'Leave empty for no budget; the progress bar then just totals the spend.'}
          />
        </DialogContent>
        <DialogActions>
          <Button variant="text" onClick={() => setEditId(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleEdit}>Save changes</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteId !== null} onClose={() => setDeleteId(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete this event?</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            The event and its tag assignments are removed. The transactions
            themselves are kept.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="text" onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="outlined" color="error" onClick={handleDelete}>Delete event</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

/** Spend-against-budget bar; only meaningful once a budget is set. */
const TagProgress: React.FC<{ tagId: number; budget: number | null }> = ({ tagId, budget }) => {
  const { data: summary } = useGetTagSummaryQuery(tagId);
  if (!summary) return null;

  const spent = Number(summary.total_spent) - Number(summary.total_received);

  if (!budget) {
    return <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(spent)}</Typography>;
  }

  const pct = Math.min((spent / budget) * 100, 100);
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      <LinearProgress
        variant="determinate"
        value={pct}
        color={spent > budget ? 'error' : 'primary'}
        aria-label={spent > budget ? 'Over budget' : 'Spent of budget'}
        sx={{ flexGrow: 1 }}
      />
      <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums', minWidth: 88, textAlign: 'right' }}>
        {formatCurrency(spent)}
      </Typography>
    </Box>
  );
};

export default Tags;
