import '../app/globals.css';
import type { AppProps } from 'next/app';
import { useEffect } from 'react';

function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
  }, []);
  return <Component {...pageProps} />;
}

export default MyApp;
