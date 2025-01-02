'use client';

import { useTurnkey } from '@turnkey/sdk-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  DEFAULT_ETHEREUM_ACCOUNTS,
  DEFAULT_SOLANA_ACCOUNTS,
  TurnkeyApiTypes,
  TurnkeyIframeClient,
  User,
} from '@turnkey/sdk-browser';
import { ButtonBase, Divider, IconButton, ListItemIcon, ListItemText, Menu, MenuItem } from '@mui/material';
import { ExpandMore, Logout, AddRounded, MoreVert, Delete } from '@mui/icons-material';
import ethIcon from '@/assets/images/eth-icon.svg';
import solIcon from '@/assets/images/sol-icon.svg';
import Image from 'next/image';
import { CreateWalletDialog } from './Dialogs/create-wallet';
import { DeleteWalletDialog } from './Dialogs/delete-wallet';

export function DashboardScreen() {
  const { turnkey, authIframeClient } = useTurnkey();
  const router = useRouter();
  const [user, setUser] = useState<User>();
  const [allWallets, setAllWallets] = useState<TurnkeyApiTypes['v1Wallet'][]>();
  const [selectedWallet, setSelectedWallet] = useState<TurnkeyApiTypes['v1Wallet']>();
  const [selectedWalletAccounts, setSelectedWalletAccounts] = useState<TurnkeyApiTypes['v1WalletAccount'][]>();

  const [walletsMenuAnchor, setWalletsMenuAnchor] = useState<null | HTMLElement>(null);
  const [moreMenuAnchor, setMoreMenuAnchor] = useState<null | HTMLElement>(null);

  const [showCreateWalletDialog, setShowCreateWalletDialog] = useState(false);
  const [showDeleteWalletDialog, setShowDeleteWalletDialog] = useState(false);

  const handleLogout = async () => {
    if (!turnkey) return;
    await turnkey.logoutUser();
    router.push('/');
  };

  const handleSelectWallet = (wallet: TurnkeyApiTypes['v1Wallet']) => {
    setSelectedWallet(wallet);
    setWalletsMenuAnchor(null);
  };

  const handleGetWallets = async () => {
    if (!user || !authIframeClient) return;

    const walletsResponse = await authIframeClient.getWallets({
      organizationId: user.organization.organizationId,
    });

    if (!walletsResponse) return; //TODO: Should use try/catch block here
    const allWallets = walletsResponse.wallets;
    setAllWallets(allWallets);
    setSelectedWallet(allWallets?.at(0)); // Select first wallet as default
  };

  const handleGetWalletAccounts = async () => {
    if (!selectedWallet || !user || !authIframeClient) return;

    const walletAccountsResponse = await authIframeClient.getWalletAccounts({
      walletId: selectedWallet.walletId!,
      organizationId: user.organization.organizationId,
    });
    setSelectedWalletAccounts(walletAccountsResponse?.accounts);
  };

  const handleCreateWallet = async (name: string) => {
    if (!user || !authIframeClient) return;

    // This will create a wallet with 2 accounts: Ethereum and Solana
    await authIframeClient.createWallet({
      walletName: name,
      accounts: [...DEFAULT_ETHEREUM_ACCOUNTS, ...DEFAULT_SOLANA_ACCOUNTS],
    });

    await handleGetWallets();
  };

  const handleImportWallet = async (name: string, importIframeClient: TurnkeyIframeClient | null) => {
    if (!user || !authIframeClient || !importIframeClient) return;

    const initResult = await authIframeClient!.initImportWallet({
      organizationId: user.organization.organizationId,
      userId: user.userId,
    });

    const injected = await importIframeClient!.injectImportBundle(
      initResult.importBundle,
      user.organization.organizationId,
      user.userId,
    );

    if (!injected) {
      throw new Error('Failed to inject import bundle');
    }

    const encryptedBundle = await importIframeClient.extractWalletEncryptedBundle();

    if (!encryptedBundle || encryptedBundle.trim() === '') {
      throw new Error('Encrypted wallet bundle is empty or invalid');
    }

    // This will import a wallet with 2 accounts: Ethereum and Solana
    await authIframeClient.importWallet({
      userId: user.userId,
      organizationId: user.organization.organizationId,
      walletName: name,
      encryptedBundle,
      accounts: [...DEFAULT_ETHEREUM_ACCOUNTS, ...DEFAULT_SOLANA_ACCOUNTS],
    });

    await handleGetWallets();
  };

  const handleDeleteWallets = async (walletIds: string[]) => {
    if (!authIframeClient) return;
    await authIframeClient.deleteWallets({ walletIds, deleteWithoutExport: true });
    await handleGetWallets();
  };

  useEffect(() => {
    const manageSession = async () => {
      // Get current user
      const currentUser = await turnkey?.getCurrentUser();

      // Auto logout if session is expired
      if (!currentUser || !currentUser.session || Date.now() > currentUser.session.write?.expiry!) {
        router.push('/');
        return;
      }

      // Inject credential bundle
      await authIframeClient?.injectCredentialBundle(currentUser?.session?.write?.credentialBundle!);

      setUser(currentUser); // Once we set user, the other useEffects will run. We want to do this at the end of the function to ensure the credentials are injected first.
    };

    if (turnkey && authIframeClient) {
      manageSession();
    }
  }, [turnkey, authIframeClient]);

  useEffect(() => {
    handleGetWallets();
  }, [user, authIframeClient]);

  useEffect(() => {
    handleGetWalletAccounts();
  }, [selectedWallet]);

  return (
    <div className='flex flex-col items-center justify-center h-screen'>
      <IconButton onClick={handleLogout} color={'error'} className='absolute top-2 left-2 rotate-180'>
        <Logout />
      </IconButton>

      <h1 className='text-6xl'>Dashboard</h1>
      <p className='text-2xl'>Welcome, {user?.username || 'loading...'}</p>

      <div className='flex flex-col mt-8 drop-shadow-lg p-2 bg-white min-h-12 w-96 rounded-md'>
        <div className='flex flex-row justify-between items-center w-full'>
          <ButtonBase
            className='flex flex-row w-fit items-center p-0.5'
            onClick={(e) => setWalletsMenuAnchor(e.currentTarget)}
          >
            <p className='text-2xl'>{selectedWallet?.walletName || '-'}</p>
            <ExpandMore sx={{ fontSize: 24 }} />
          </ButtonBase>

          <IconButton onClick={(e) => setMoreMenuAnchor(e.currentTarget)}>
            <MoreVert />
          </IconButton>
        </div>

        <div className='flex flex-col space-y-3 mt-4'>
          {selectedWalletAccounts?.map((account) => (
            <div
              key={account.walletAccountId}
              className='flex flex-row w-full drop-shadow bg-slate-50 rounded-md p-2 items-center space-x-2 '
            >
              <Image
                className='bg-gray-200 rounded-full p-0.5'
                style={{ width: '32px', height: '32px' }}
                src={
                  account.addressFormat === 'ADDRESS_FORMAT_ETHEREUM'
                    ? ethIcon
                    : account.addressFormat === 'ADDRESS_FORMAT_SOLANA'
                    ? solIcon
                    : ''
                }
                alt={''}
              />
              <p className='accountAddress'>{`${account.address.slice(0, 5)}...${account.address.slice(-5)}`}</p>
            </div>
          ))}
        </div>
      </div>

      <Menu anchorEl={walletsMenuAnchor} open={walletsMenuAnchor !== null} onClose={() => setWalletsMenuAnchor(null)}>
        {allWallets?.map((wallet) => (
          <MenuItem key={wallet.walletId} onClick={() => handleSelectWallet(wallet)}>
            {wallet.walletName || wallet.walletId}
          </MenuItem>
        ))}
        <Divider />
        <MenuItem
          onClick={() => {
            setShowCreateWalletDialog(true);
            setWalletsMenuAnchor(null);
          }}
        >
          <ListItemIcon>
            <AddRounded />
          </ListItemIcon>
          Add Wallet
        </MenuItem>
      </Menu>

      <Menu anchorEl={moreMenuAnchor} open={moreMenuAnchor !== null} onClose={() => setMoreMenuAnchor(null)}>
        <MenuItem
          disabled={!allWallets || allWallets.length <= 1}
          onClick={() => {
            setShowDeleteWalletDialog(true);
            setMoreMenuAnchor(null);
          }}
        >
          <ListItemIcon>
            <Delete color='error' />
          </ListItemIcon>

          <ListItemText
            primary='Delete Wallet'
            secondary={!allWallets || (allWallets.length <= 1 && 'You cannot delete your only wallet!')}
          />
        </MenuItem>
      </Menu>

      <CreateWalletDialog
        open={showCreateWalletDialog}
        onClose={() => setShowCreateWalletDialog(false)}
        onCreate={handleCreateWallet}
        onImport={handleImportWallet}
      />

      {selectedWallet && allWallets && allWallets.length > 1 && (
        <DeleteWalletDialog
          open={showDeleteWalletDialog}
          wallet={selectedWallet}
          onClose={() => setShowDeleteWalletDialog(false)}
          onDelete={handleDeleteWallets}
        />
      )}
    </div>
  );
}
