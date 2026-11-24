import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import UploadButton, { BACKUP } from '@/components/UploadButton';
import UploadInvestButton from '@/components/UploadInvestButton';

/**
 * Hosts the two import dialogs for every page, opened by ?import=transactions
 * or ?import=investments from a page header's actions.
 */
const ImportDialogs: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const opened = searchParams.get('import');

  const close = () => {
    const params = new URLSearchParams(searchParams);
    params.delete('import');
    params.delete('source');
    setSearchParams(params, { replace: true });
  };

  return (
    <>
      <UploadButton
        open={opened === 'transactions'}
        onClose={close}
        onUploadSuccess={() => navigate('/transactions')}
        initialSource={searchParams.get('source') === 'backup' ? BACKUP : undefined}
      />
      <UploadInvestButton open={opened === 'investments'} onClose={close} />
    </>
  );
};

export default ImportDialogs;
