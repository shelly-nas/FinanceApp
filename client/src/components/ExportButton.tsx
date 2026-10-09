import { Button } from '@mui/material';
import DownloadIcon from '@mui/icons-material/DownloadOutlined';

// Built the same way RTK Query builds its urls, so the download follows
// VITE_BASE_URL if one is ever set instead of silently hitting the page origin.
const exportHref = `${import.meta.env.VITE_BASE_URL ?? '/'}api/export`.replace(/([^:]\/)\/+/g, '$1');

/**
 * Downloads a complete backup. A plain link, not fetch-and-blob: the browser
 * streams the file to disk and honours the Content-Disposition filename, and
 * nothing has to hold the whole export in memory.
 */
const ExportButton = () => (
  <Button
    component="a"
    href={exportHref}
    variant="text"
    fullWidth
    startIcon={<DownloadIcon />}
    sx={{ justifyContent: 'flex-start', px: 3, fontWeight: 500 }}
  >
    Export everything
  </Button>
);

export default ExportButton;
