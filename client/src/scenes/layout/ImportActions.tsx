import React from 'react';
import { Button } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUploadOutlined';
import LineAxisIcon from '@mui/icons-material/LineAxis';
import { useSearchParams } from 'react-router-dom';

export type ImportKind = 'transactions' | 'investments';

/**
 * Opens one of the import dialogs on the current page, through ?import=, so a
 * reload or the back button lands where the user was.
 */
export const useOpenImport = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  return (kind: ImportKind) => {
    const params = new URLSearchParams(searchParams);
    params.set('import', kind);
    setSearchParams(params);
  };
};

interface Props {
  /** Show "Update investments" beside the import. */
  withInvestments?: boolean;
}

/** The page header's import actions; importing is the primary one. */
const ImportActions: React.FC<Props> = ({ withInvestments = false }) => {
  const openImport = useOpenImport();

  return (
    <>
      {withInvestments && (
        <Button
          variant="outlined"
          startIcon={<LineAxisIcon />}
          onClick={() => openImport('investments')}
        >
          Update investments
        </Button>
      )}
      <Button
        variant="contained"
        startIcon={<CloudUploadIcon />}
        onClick={() => openImport('transactions')}
      >
        Import transactions
      </Button>
    </>
  );
};

export default ImportActions;
