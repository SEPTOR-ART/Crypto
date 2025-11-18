import '../styles/globals.css';
import Head from 'next/head';
import { AuthProvider } from '../context/AuthContext';
import HealthCheck from '../components/HealthCheck';
import Header from '../components/Header';
import Footer from '../components/Footer';
import AnimationMonitor from '../components/AnimationMonitor';

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta charSet="utf-8" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header />
      <Component {...pageProps} />
      <Footer />
      <AnimationMonitor />
      <HealthCheck />
    </AuthProvider>
  );
}

export default MyApp;