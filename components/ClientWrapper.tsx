'use client';

import React from 'react';
import { useConsoleErrorSuppression } from '../hooks/useConsoleErrorSuppression';

interface ClientWrapperProps {
  children: React.ReactNode;
}

export default function ClientWrapper({ children }: ClientWrapperProps) {
  // Apply console error suppression globally
  useConsoleErrorSuppression();

  return <>{children}</>;
}
