import {
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  InputLabel,
  TextField,
} from '@mui/material';
import { useTurnkey } from '@turnkey/sdk-react';
import { TurnkeyIframeClient } from '@turnkey/sdk-browser';
import { ChangeEvent, useEffect, useRef, useState } from 'react';

interface CreateWalletDialogProps {
  open: boolean;
  onClose: VoidFunction;
  onCreate: (name: string) => Promise<void>;
  onImport: (name: string, importIframeClient: TurnkeyIframeClient | null) => Promise<void>;
}

export function CreateWalletDialog(props: CreateWalletDialogProps) {
  const { open, onClose, onCreate, onImport } = props;
  const [name, setName] = useState('My Wallet');
  const [loading, setLoading] = useState(false);
  const [isImport, setIsImport] = useState(false);

  const [importIframeClient, setImportIframeClient] = useState<TurnkeyIframeClient | null>(null);

  const iframeContainerRef = useRef<HTMLDivElement | null>(null);

  const { turnkey } = useTurnkey(); // This should be consistent with the dashboard component right?

  const TurnkeyIframeElementId = 'turnkey-default-iframe-element-id';

  const handleAddWallet = async () => {
    setLoading(true);

    if (isImport) await onImport(name, importIframeClient);
    else await onCreate(name);

    setLoading(false);
    onClose();
  };

  useEffect(() => {
    if (!open || !isImport) return;

    requestAnimationFrame(async () => {
      if (!iframeContainerRef.current) {
        console.error('Iframe container not found.');
        return;
      }

      const existingIframe = document.getElementById(TurnkeyIframeElementId);
      if (!existingIframe) {
        try {
          const newImportIframeClient = await turnkey?.iframeClient({
            iframeContainer: iframeContainerRef.current,
            iframeUrl: process.env.NEXT_PUBLIC_IMPORT_IFRAME_URL!,
          });
          setImportIframeClient(newImportIframeClient!);
        } catch (error) {
          console.error('Error initializing IframeStamper:', error);
        }
      }
    });
  }, [open, isImport]);

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Add Wallet</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        <TextField
          sx={{ marginTop: 1, width: '24rem' }}
          label='Wallet Name'
          defaultValue={name}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
        />
        <FormControlLabel
          control={<Checkbox checked={!isImport} onChange={() => setIsImport(!isImport)} />}
          label='Automatically generate seed phrase'
        />
        {isImport && (
          <>
            <InputLabel sx={{ fontSize: 12, fontStyle: 'italic' }}> Enter your 12-24 word seed phrase</InputLabel>

            <div ref={iframeContainerRef} className='w-96 overflow-hidden border border-gray-300 rounded-lg' />
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant='contained' disabled={loading} onClick={handleAddWallet}>
          {loading && <CircularProgress size={16} sx={{ marginRight: 1 }} />}
          {isImport ? 'Import' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
