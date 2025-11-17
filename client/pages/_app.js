import '../styles/globals.css';
import Head from 'next/head';
import { AuthProvider } from '../context/AuthContext';
import HealthCheck from '../components/HealthCheck';

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta charSet="utf-8" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Component {...pageProps} />
      <HealthCheck />
    </AuthProvider>
  );
}

export default MyApp;