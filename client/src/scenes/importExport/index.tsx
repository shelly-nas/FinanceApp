import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUploadOutlined';
import LineAxisIcon from '@mui/icons-material/LineAxis';
import DownloadIcon from '@mui/icons-material/DownloadOutlined';
import RestoreIcon from '@mui/icons-material/SettingsBackupRestoreOutlined';
import PageHeader from '@/components/PageHeader';
import DashboardBox from '@/components/DashboardBox';
import WidgetHeader from '@/components/WidgetHeader';
import { useOpenImport } from '@/scenes/layout/ImportActions';

// Built the same way RTK Query builds its urls, so the download follows
// VITE_BASE_URL if one is ever set instead of silently hitting the page origin.
// A plain link, not fetch-and-blob: the browser streams the file to disk and
// honours the Content-Disposition filename.
const exportHref = `${import.meta.env.VITE_BASE_URL ?? '/'}api/export`.replace(/([^:]\/)\/+/g, '$1');

/**
 * Every way data goes in or out, in one place: bank exports, the values of
 * investment accounts, a full backup and restoring one. These used to be
 * spread over page headers and the sidebar. "Import transactions" stays as the
 * quick action on Transactions as well.
 */
const ImportExport: React.FC = () => {
  const openImport = useOpenImport();

  return (
    <>
      <PageHeader title="Import & export" subtitle="Bank exports in, investment values, and a full backup" />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4 }}>
        <DashboardBox>
          <WidgetHeader
            title="Import bank exports"
            subtitle="One or more CSV files from the same bank. Rows already stored are recognised and skipped."
          />
          <Button variant="contained" startIcon={<CloudUploadIcon />} onClick={() => openImport('transactions')}>
            Import transactions
          </Button>
        </DashboardBox>

        <DashboardBox>
          <WidgetHeader
            title="Investments"
            subtitle="Accounts that ship no export of their own: enter their value at a date."
          />
          <Button variant="outlined" startIcon={<LineAxisIcon />} onClick={() => openImport('investments')}>
            Update values
          </Button>
        </DashboardBox>

        <DashboardBox>
          <WidgetHeader
            title="Backup"
            subtitle="Everything in one JSON file: transactions, accounts, categories, events and transfers."
          />
          <Button variant="outlined" component="a" href={exportHref} startIcon={<DownloadIcon />}>
            Export everything
          </Button>
        </DashboardBox>

        <DashboardBox sx={{ borderColor: 'error.light' }}>
          <WidgetHeader
            title="Restore a backup"
            subtitle="Merge adds what is missing. Replace deletes everything currently stored first, and cannot be undone."
          />
          <Typography variant="body2" sx={{ mb: 3 }}>
            You choose between merge and replace after picking the file.
          </Typography>
          <Button
            variant="outlined"
            color="error"
            startIcon={<RestoreIcon />}
            onClick={() => openImport('transactions', { source: 'backup' })}
          >
            Restore a backup…
          </Button>
        </DashboardBox>
      </Box>
    </>
  );
};

export default ImportExport;
