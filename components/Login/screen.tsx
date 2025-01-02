'use client';

import { Auth, useTurnkey } from '@turnkey/sdk-react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const authConfig = {
  emailEnabled: true,
  passkeyEnabled: true,
  phoneEnabled: true,
  googleEnabled: false,
  appleEnabled: false,
  facebookEnabled: false,
};

const configOrder = ['socials', 'email', 'phone', 'passkey'];

export function LoginScreen() {
  const { turnkey } = useTurnkey();
  const router = useRouter();

  const handleAuthSuccess = async () => {
    router.push('/dashboard');
  };

  const handleAuthError = (errorMessage: string) => {
    console.error(errorMessage);
  };

  useEffect(() => {
    const manageSession = async () => {
      if (turnkey) {
        const session = await turnkey?.getReadWriteSession();
        if (session && Date.now() < session.expiry) {
          await handleAuthSuccess();
        }
      }
    };
    manageSession();
  }, [turnkey]);

  return (
    <div className='flex justify-center items-center h-screen w-screen'>
      <Auth
        authConfig={authConfig}
        configOrder={configOrder}
        onAuthSuccess={handleAuthSuccess}
        onError={handleAuthError}
      />
    </div>
  );
}
