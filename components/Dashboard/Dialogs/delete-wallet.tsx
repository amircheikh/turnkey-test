import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import { useState } from 'react';
import { TurnkeyApiTypes } from '@turnkey/sdk-browser';

interface DeleteWalletDialogProps {
  open: boolean;
  wallet: TurnkeyApiTypes['v1Wallet'];
  onClose: VoidFunction;
  onDelete: (walletIds: string[]) => Promise<void>;
}

export function DeleteWalletDialog(props: DeleteWalletDialogProps) {
  const { open, wallet, onClose, onDelete } = props;
  const [loading, setLoading] = useState(false);

  const handleDeleteWallet = async () => {
    setLoading(true);
    await onDelete([wallet.walletId]);
    setLoading(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Delete Wallet</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to delete the following wallet: <strong>{wallet.walletName}</strong>
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant='contained' color='error' disabled={loading} onClick={handleDeleteWallet}>
          {loading && <CircularProgress color='error' size={16} sx={{ marginRight: 1 }} />}
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}
