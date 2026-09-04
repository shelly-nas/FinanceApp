import React, { useState } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableHead, TableRow,
  Button, IconButton, TextField, MenuItem, Select, Tooltip, Chip, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, Snackbar,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import DashboardBox from '@/components/DashboardBox';
import {
  Account,
  UnknownAccount,
  useGetAccountsQuery,
  useGetUnknownAccountsQuery,
  useCreateAccountMutation,
  useUpdateAccountMutation,
  useDeleteAccountMutation,
} from '@/api';

const ACCOUNT_TYPES: Account['account_type'][] = [
  'Checking Account',
  'Savings Account',
  'Investments',
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(value);

interface DraftAccount {
  account_type: Account['account_type'];
  account_name: string;
  details: string;
  balance_when_created: string;
}

const emptyDraft = (): DraftAccount => ({
  account_type: 'Checking Account',
  account_name: '',
  details: '',
  balance_when_created: '',
});

/**
 * Manage the accounts the app knows about.
 *
 * Checking and savings accounts announce themselves in the imports, so the ones
 * seen but not yet named are offered here for adoption. Investment accounts
 * appear in no export and can only be added by hand - the investments dialog
 * reads its dropdown from this table, so without an entry there is nothing to
 * pick.
 *
 * Two fields carry weight beyond their label. `details` is the identifier the
 * bank writes in its exports, and transactions are matched to an account by it,
 * so it has to be exact. `balance_when_created` is what the account held before
 * the first imported transaction - leave it at zero and the balance shown is
 * only the movement since then.
 */
const Accounts: React.FC = () => {
  const { data: accounts } = useGetAccountsQuery();
  const { data: unknown } = useGetUnknownAccountsQuery();
  const [createAccount] = useCreateAccountMutation();
  const [updateAccount] = useUpdateAccountMutation();
  const [deleteAccount] = useDeleteAccountMutation();

  const [addOpen, setAddOpen] = useState(false);
  const [draft, setDraft] = useState<DraftAccount>(emptyDraft());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [edit, setEdit] = useState<Partial<Account>>({});
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null);
  const [toast, setToast] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);

  const openAdd = (prefill?: Partial<DraftAccount>) => {
    setDraft({ ...emptyDraft(), ...prefill });
    setAddOpen(true);
  };

  const handleCreate = async () => {
    if (!draft.account_name.trim() || !draft.details.trim()) {
      setToast({ message: 'A name and an account identifier are both required.', severity: 'error' });
      return;
    }

    try {
      await createAccount({
        account_type: draft.account_type,
        account_name: draft.account_name.trim(),
        details: draft.details.trim(),
        balance_when_created: draft.balance_when_created === '' ? 0 : Number(draft.balance_when_created),
      }).unwrap();
      setAddOpen(false);
      setDraft(emptyDraft());
      setToast({ message: 'Account added', severity: 'success' });
    } catch (e: any) {
      setToast({ message: e?.data?.error ?? 'Could not add the account', severity: 'error' });
    }
  };

  const startEdit = (account: Account) => {
    setEditingId(account.id);
    setEdit({
      account_type: account.account_type,
      account_name: account.account_name,
      details: account.details,
      balance_when_created: account.balance_when_created,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEdit({});
  };

  const saveEdit = async (id: number) => {
    try {
      await updateAccount({
        id,
        updates: {
          ...edit,
          balance_when_created:
            edit.balance_when_created === '' || edit.balance_when_created === null
              ? 0
              : Number(edit.balance_when_created),
        },
      }).unwrap();
      cancelEdit();
      setToast({ message: 'Account updated', severity: 'success' });
    } catch (e: any) {
      setToast({ message: e?.data?.error ?? 'Could not save the account', severity: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteAccount(deleteTarget.id).unwrap();
      setToast({ message: 'Account deleted', severity: 'success' });
      setDeleteTarget(null);
    } catch (e: any) {
      setToast({ message: e?.data?.error ?? 'Could not delete the account', severity: 'error' });
      setDeleteTarget(null);
    }
  };

  const adopt = (account: UnknownAccount) =>
    openAdd({
      details: account.details,
      account_name: account.details,
      account_type: 'Checking Account',
    });

  return (
    <Box>
      {/* Accounts seen in imports but not yet named */}
      {unknown && unknown.length > 0 && (
        <DashboardBox sx={{ mb: 1.5, p: 1.5, textAlign: 'left' }}>
          <Typography variant="h3" sx={{ mb: 0.5 }}>
            Seen in your transactions, not yet added
          </Typography>
          <Typography variant="body3" sx={{ display: 'block', mb: 1 }}>
            These account numbers appear in imported transactions but have no entry
            here, so they are missing from your balances and cannot be recognised
            as transfers.
          </Typography>

          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Account number</TableCell>
                <TableCell align="right">Transactions</TableCell>
                <TableCell>Period</TableCell>
                <TableCell>Last seen as</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {unknown.map((account) => (
                <TableRow key={account.details} hover>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{account.details}</TableCell>
                  <TableCell align="right">{account.transaction_count}</TableCell>
                  <TableCell>
                    <Typography variant="body3">
                      {account.first_seen?.slice(0, 10)} — {account.last_seen?.slice(0, 10)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body3">{account.last_description ?? '—'}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Button size="small" onClick={() => adopt(account)}>
                      Add this account
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DashboardBox>
      )}

      <DashboardBox sx={{ p: 1.5, textAlign: 'left' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography variant="h3" sx={{ flexGrow: 1 }}>Accounts</Typography>
          <Button size="small" startIcon={<AddIcon />} onClick={() => openAdd()}>
            New account
          </Button>
        </Box>

        {(!accounts || accounts.length === 0) ? (
          <Typography variant="body3">
            No accounts yet. Add one, or import a bank export and adopt the accounts
            it mentions.
          </Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Account number</TableCell>
                <TableCell align="right">
                  <Tooltip title="What the account held before the first imported transaction">
                    <span>Opening balance</span>
                  </Tooltip>
                </TableCell>
                <TableCell align="right">Transactions</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {accounts.map((account) => {
                const isEditing = editingId === account.id;

                return (
                  <TableRow key={account.id} hover>
                    <TableCell>
                      {isEditing ? (
                        <TextField
                          size="small"
                          value={edit.account_name ?? ''}
                          onChange={(e) => setEdit((p) => ({ ...p, account_name: e.target.value }))}
                        />
                      ) : (
                        account.account_name
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Select
                          size="small"
                          value={edit.account_type ?? account.account_type}
                          onChange={(e: SelectChangeEvent) =>
                            setEdit((p) => ({ ...p, account_type: e.target.value as Account['account_type'] }))
                          }
                        >
                          {ACCOUNT_TYPES.map((type) => (
                            <MenuItem key={type} value={type}>{type}</MenuItem>
                          ))}
                        </Select>
                      ) : (
                        <Chip size="small" label={account.account_type} variant="outlined" />
                      )}
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>
                      {isEditing ? (
                        <TextField
                          size="small"
                          value={edit.details ?? ''}
                          onChange={(e) => setEdit((p) => ({ ...p, details: e.target.value }))}
                          helperText="Exactly as the bank writes it"
                        />
                      ) : (
                        account.details
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {isEditing ? (
                        <TextField
                          size="small"
                          type="number"
                          value={edit.balance_when_created ?? ''}
                          onChange={(e) => setEdit((p) => ({ ...p, balance_when_created: e.target.value }))}
                        />
                      ) : (
                        formatCurrency(Number(account.balance_when_created ?? 0))
                      )}
                    </TableCell>
                    <TableCell align="right">{account.transaction_count ?? 0}</TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                      {isEditing ? (
                        <>
                          <Tooltip title="Save">
                            <IconButton size="small" onClick={() => saveEdit(account.id)}>
                              <CheckIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Cancel">
                            <IconButton size="small" onClick={cancelEdit}>
                              <CloseIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      ) : (
                        <>
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => startEdit(account)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" onClick={() => setDeleteTarget(account)}>
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
          </Table>
        )}
      </DashboardBox>

      {/* Add */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>New account</DialogTitle>
        <DialogContent>
          <TextField
            select
            fullWidth
            margin="dense"
            label="Type"
            value={draft.account_type}
            onChange={(e) => setDraft((p) => ({ ...p, account_type: e.target.value as Account['account_type'] }))}
          >
            {ACCOUNT_TYPES.map((type) => (
              <MenuItem key={type} value={type}>{type}</MenuItem>
            ))}
          </TextField>
          <TextField
            autoFocus
            fullWidth
            margin="dense"
            label="Name"
            placeholder="Jelle's Betaalrekening"
            value={draft.account_name}
            onChange={(e) => setDraft((p) => ({ ...p, account_name: e.target.value }))}
          />
          <TextField
            fullWidth
            margin="dense"
            label="Account number"
            placeholder="NL61RABO0128050403"
            helperText={
              draft.account_type === 'Investments'
                ? 'Any identifier you recognise — investment accounts appear in no bank export.'
                : 'Exactly as the bank writes it in its export, or transactions will not match.'
            }
            value={draft.details}
            onChange={(e) => setDraft((p) => ({ ...p, details: e.target.value }))}
          />
          <TextField
            fullWidth
            margin="dense"
            type="number"
            label="Opening balance (optional)"
            helperText="What the account held before your first imported transaction."
            value={draft.balance_when_created}
            onChange={(e) => setDraft((p) => ({ ...p, balance_when_created: e.target.value }))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button onClick={handleCreate}>Add</Button>
        </DialogActions>
      </Dialog>

      {/* Delete */}
      <Dialog open={deleteTarget !== null} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Delete account</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            {deleteTarget?.transaction_count
              ? `${deleteTarget.account_name} still has ${deleteTarget.transaction_count} transaction(s). Those have to be removed or reassigned first.`
              : `${deleteTarget?.account_name} will be removed. Its transactions are kept.`}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button color="error" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={toast !== null}
        autoHideDuration={3000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setToast(null)}
          severity={toast?.severity ?? 'success'}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {toast?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Accounts;
