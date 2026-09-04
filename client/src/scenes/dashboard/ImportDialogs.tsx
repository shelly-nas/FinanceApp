import React from 'react';
import UploadButton from '@/components/UploadButton';
import UploadInvestButton from '@/components/UploadInvestButton';
import { useNavigate } from 'react-router-dom';

interface Props {
  /** 'transactions' or 'investments', from the ?import= parameter. */
  opened: string | null;
  onClose: () => void;
}

/**
 * Hosts the two import dialogs, opened from the header's action menu.
 *
 * They used to sit in a third dashboard column as panels styled exactly like the
 * ones showing figures, which made buttons read as summaries.
 */
const ImportDialogs: React.FC<Props> = ({ opened, onClose }) => {
  const navigate = useNavigate();

  return (
    <>
      <UploadButton
        openExternally={opened === 'transactions'}
        onCloseExternally={onClose}
        onUploadSuccess={() => navigate('/transactions')}
      />
      <UploadInvestButton
        openExternally={opened === 'investments'}
        onCloseExternally={onClose}
      />
    </>
  );
};

export default ImportDialogs;
