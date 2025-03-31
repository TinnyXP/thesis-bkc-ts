'use client';

import { PropsWithChildren, useEffect, useState } from 'react';
import '../config'; // Import the i18n configuration but don't need to capture it

/**
 * TranslationProvider component
 * 
 * Ensures i18next is only initialized on the client side to prevent hydration errors
 * Wraps any components that need translation functionality
 */
export default function TranslationProvider({ children }: PropsWithChildren) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Set isClient to true once component is mounted on the client
    setIsClient(true);
  }, []);

  // During SSR, we simply render the children without i18next initialized
  if (!isClient) {
    return <>{children}</>;
  }

  // On the client, i18next is initialized through the import
  return <>{children}</>;
}