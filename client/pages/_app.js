import '../styles/globals.css';
import Head from 'next/head';
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
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <TawkLoader />
      <Header />
      <Component {...pageProps} />
      <Footer />
      <AnimationMonitor />
      <HealthCheck />
    </AuthProvider>
  );
}

export default MyApp;

function TawkLoader() {
  useEffect(() => {
    const propertyId = process.env.NEXT_PUBLIC_TAWK_PROPERTY_ID;
    const widgetId = process.env.NEXT_PUBLIC_TAWK_WIDGET_ID;
    if (!propertyId || !widgetId) return;
    const s1 = document.createElement('script');
    s1.async = true;
    s1.src = `https://embed.tawk.to/${propertyId}/${widgetId}`;
    s1.charset = 'UTF-8';
    s1.setAttribute('crossorigin', '*');
    document.body.appendChild(s1);
    return () => {
      try { s1.remove(); } catch {}
    };
  }, []);
  return null;
}
