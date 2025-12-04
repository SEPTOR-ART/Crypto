import '../styles/globals.css';
import Head from 'next/head';
import Script from 'next/script';
import React from 'react';
import { AuthProvider } from '../context/AuthContext';
import HealthCheck from '../components/HealthCheck';
import Header from '../components/Header';
import Footer from '../components/Footer';
import AnimationMonitor from '../components/AnimationMonitor';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch() {}
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h1>Something went wrong</h1>
          <p>Please refresh the page or try again later.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

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
      <ErrorBoundary>
        <Component {...pageProps} />
      </ErrorBoundary>
      <Footer />
      <AnimationMonitor />
      <HealthCheck />
    </AuthProvider>
  );
}

export default MyApp;
