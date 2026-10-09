import React, { useState } from 'react';
import {
  Box, Typography, TableBody, TableCell, TableHead, TableRow,
  Button, IconButton, TextField, MenuItem, Tooltip, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import DashboardBox from '@/components/DashboardBox';
import PageHeader from '@/components/PageHeader';
import CardTable from '@/components/CardTable';
import Toast, { ToastMessage } from '@/components/Toast';
import {
  Category,
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} from '@/api';

const CATEGORY_TYPES = ['Vast', 'Variabel'];
const INCOME_OUTCOME = ['Uitgaven', 'Inkomsten'];

const emptyDraft = () => ({
  category_name: '',
  color: '#8cc2b3',
  category_type: 'Variabel',
  income_outcome: 'Uitgaven',
});

/**
 * Manage categories.
 *
 * Three fields carry weight beyond their label, which is why this screen exists
 * rather than leaving the seeded list fixed:
 *
 * - `color` is what the spending breakdown draws with.
 * - `category_type` (Vast / Variabel) splits the period summary into costs you
 *   can influence this month and costs you cannot.
 * - `income_outcome` decides which side of that summary a category lands on -
 *   set it wrong and salary is counted as spending.
 */
const Categories: React.FC = () => {
  const { data: categories } = useGetCategoriesQuery();
  const [createCategory] = useCreateCategoryMutation();
  const [updateCategory] = useUpdateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();

  const [addOpen, setAddOpen] = useState(false);
  const [draft, setDraft] = useState(emptyDraft());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [edit, setEdit] = useState<Partial<Category>>({});
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const handleCreate = async () => {
    if (!draft.category_name.trim()) {
      setToast({ message: 'Give the category a name.', severity: 'error' });
      return;
    }
    try {
      await createCategory({ ...draft, category_name: draft.category_name.trim() }).unwrap();
      setAddOpen(false);
      setDraft(emptyDraft());
      setToast({ message: 'Category added', severity: 'success' });
    } catch (e: any) {
      setToast({ message: e?.data?.error ?? 'Could not add the category', severity: 'error' });
    }
  };

  const startEdit = (category: Category) => {
    setEditingId(category.id);
    setEdit({
      category_name: category.category_name,
      color: category.color,
      category_type: category.category_type,
      income_outcome: category.income_outcome,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEdit({});
  };

  const saveEdit = async (id: number) => {
    try {
      await updateCategory({ id, updates: edit }).unwrap();
      cancelEdit();
      setToast({ message: 'Category updated', severity: 'success' });
    } catch (e: any) {
      setToast({ message: e?.data?.error ?? 'Could not save the category', severity: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCategory(deleteTarget.id).unwrap();
      setToast({ message: 'Category deleted', severity: 'success' });
    } catch (e: any) {
      setToast({ message: e?.data?.error ?? 'Could not delete the category', severity: 'error' });
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Categories"
        subtitle="The colour is used in the spending breakdown. Fixed or variable splits the period summary; income or expense decides which side a category counts on."
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddOpen(true)}>
            New category
          </Button>
        }
      />

      <DashboardBox>
        <CardTable>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Colour</TableCell>
              <TableCell>Fixed / variable</TableCell>
              <TableCell>Counts as</TableCell>
              <TableCell align="right">Transactions</TableCell>
              <TableCell align="right"><span className="visually-hidden">Actions</span></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(categories ?? []).map((category) => {
              const isEditing = editingId === category.id;

              return (
                <TableRow key={category.id} hover>
                  <TableCell sx={{ color: 'text.primary', fontWeight: 500 }}>
                    {isEditing ? (
                      <TextField
                        size="small"
                        inputProps={{ 'aria-label': 'Name' }}
                        value={edit.category_name ?? ''}
                        onChange={(e) => setEdit((p) => ({ ...p, category_name: e.target.value }))}
                        helperText="Renaming updates every transaction using it"
                      />
                    ) : (
                      category.category_name
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <TextField
                        size="small"
                        type="color"
                        inputProps={{ 'aria-label': 'Colour' }}
                        value={edit.color ?? '#8cc2b3'}
                        onChange={(e) => setEdit((p) => ({ ...p, color: e.target.value }))}
                        sx={{ width: 70 }}
                      />
                    ) : (
                      <Box
                        aria-label={category.color ? `Colour ${category.color}` : 'No colour'}
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: 1.5,
                          backgroundColor: category.color ?? 'transparent',
                          border: 1,
                          borderColor: 'divider',
                        }}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <TextField
                        select
                        size="small"
                        inputProps={{ 'aria-label': 'Fixed or variable' }}
                        value={edit.category_type ?? 'Variabel'}
                        onChange={(e) => setEdit((p) => ({ ...p, category_type: e.target.value }))}
                        sx={{ minWidth: 110 }}
                      >
                        {CATEGORY_TYPES.map((type) => (
                          <MenuItem key={type} value={type}>{type}</MenuItem>
                        ))}
                      </TextField>
                    ) : (
                      <Chip size="small" variant="outlined" label={category.category_type ?? '—'} />
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <TextField
                        select
                        size="small"
                        inputProps={{ 'aria-label': 'Counts as' }}
                        value={edit.income_outcome ?? 'Uitgaven'}
                        onChange={(e) => setEdit((p) => ({ ...p, income_outcome: e.target.value }))}
                        sx={{ minWidth: 120 }}
                      >
                        {INCOME_OUTCOME.map((value) => (
                          <MenuItem key={value} value={value}>{value}</MenuItem>
                        ))}
                      </TextField>
                    ) : (
                      <Chip
                        size="small"
                        variant="outlined"
                        color={category.income_outcome === 'Inkomsten' ? 'success' : 'default'}
                        label={category.income_outcome ?? '—'}
                      />
                    )}
                  </TableCell>
                  <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>{category.transaction_count ?? 0}</TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    {isEditing ? (
                      <>
                        <Tooltip title="Save">
                          <IconButton size="small" aria-label="Save" onClick={() => saveEdit(category.id)}>
                            <CheckIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Cancel">
                          <IconButton size="small" aria-label="Cancel" onClick={cancelEdit}>
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </>
                    ) : (
                      <>
                        <Tooltip title="Edit">
                          <IconButton size="small" aria-label={`Edit ${category.category_name}`} onClick={() => startEdit(category)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" aria-label={`Delete ${category.category_name}`} onClick={() => setDeleteTarget(category)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </CardTable>
      </DashboardBox>

      <Dialog open={addOpen} onClose={() => setAddOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>New category</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Name"
            value={draft.category_name}
            onChange={(e) => setDraft((p) => ({ ...p, category_name: e.target.value }))}
          />
          <TextField
            fullWidth
            type="color"
            label="Colour"
            value={draft.color}
            onChange={(e) => setDraft((p) => ({ ...p, color: e.target.value }))}
          />
          <TextField
            select
            fullWidth
            label="Fixed or variable"
            helperText="Fixed costs recur at a set amount; variable ones you can influence"
            value={draft.category_type}
            onChange={(e) => setDraft((p) => ({ ...p, category_type: e.target.value }))}
          >
            {CATEGORY_TYPES.map((type) => (
              <MenuItem key={type} value={type}>{type}</MenuItem>
            ))}
          </TextField>
          <TextField
            select
            fullWidth
            label="Counts as"
            value={draft.income_outcome}
            onChange={(e) => setDraft((p) => ({ ...p, income_outcome: e.target.value }))}
          >
            {INCOME_OUTCOME.map((value) => (
              <MenuItem key={value} value={value}>{value}</MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button variant="text" onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate}>Add category</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteTarget !== null} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete this category?</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            {deleteTarget?.transaction_count
              ? `${deleteTarget.transaction_count} transaction(s) still use ${deleteTarget.category_name}. Move them to another category first.`
              : `${deleteTarget?.category_name} will be removed.`}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="text" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="outlined" color="error" onClick={handleDelete}>Delete category</Button>
        </DialogActions>
      </Dialog>

      <Toast toast={toast} onClose={() => setToast(null)} />
    </>
  );
};

export default Categories;
