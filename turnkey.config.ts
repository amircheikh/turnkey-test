import { TurnkeySDKBrowserConfig } from '@turnkey/sdk-browser';

export const turnkeyConfig: TurnkeySDKBrowserConfig = {
  apiBaseUrl: 'https://api.turnkey.com',
  defaultOrganizationId: process.env.NEXT_PUBLIC_ORGANIZATION_ID!,
  rpId: process.env.RPID, // Your application's domain for WebAuthn flows
  iframeUrl: 'https://auth.turnkey.com',
};
