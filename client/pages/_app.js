import '../styles/globals.css';
import Head from 'next/head';
import Script from 'next/script';
import { useEffect } from 'react';
import { AuthProvider } from '../context/AuthContext';
import HealthCheck from '../components/HealthCheck';
import Header from '../components/Header';
import Footer from '../components/Footer';
import AnimationMonitor from '../components/AnimationMonitor';

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta charSet="utf-8" />
        <link rel="icon" href="/favicon.svg" />
      </Head>
      <Script
        id="tawk-script"
        strategy="afterInteractive"
        src="https://embed.tawk.to/6930001e1613f8197dbbec60/default"
      />
      <Header />
      <Component {...pageProps} />
      <Footer />
      <AnimationMonitor />
      <HealthCheck />
    </AuthProvider>
  );
}

export default MyApp;
