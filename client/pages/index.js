import Head from 'next/head';
import styles from '../styles/Home.module.css';
import { useState } from 'react';
import ChatSupport from '../components/ChatSupport';
import { useCryptoPrices } from '../hooks/useCryptoPrices';

export default function Home() {
  const { prices: cryptoPrices, loading, error } = useCryptoPrices();
  const [trends] = useState({
    BTC: 'up',
    ETH: 'up',
    LTC: 'down',
    XRP: 'up'
  });

  return (
    <div className={styles.container}>
      <Head>
        <title>CryptoZen - Asian-Inspired Cryptocurrency Exchange</title>
        <meta name="description" content="Modern, secure cryptocurrency exchange with Asian-inspired aesthetics" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Hero Section with Parallax Effect */}
      <section className={styles.hero}>
        <div className={styles.parallaxBackground}></div>
        <div className={styles.heroContent}>
          <h1 className={styles.title}>
            Welcome to <span className={styles.highlight}>CryptoZen</span>
          </h1>
          <p className={styles.description}>
            Experience the future of cryptocurrency trading with our secure, Asian-inspired platform
          </p>
          <div className={styles.ctaButtons}>
            <button className={styles.primaryButton}>Get Started</button>
            <button className={styles.secondaryButton}>Learn More</button>
          </div>
        </div>
      </section>

      {/* Real-time Price Tracker */}
      <section className={styles.priceTracker}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Real-Time Crypto Prices</h2>
          {loading ? (
            <div className={styles.loading}>Loading prices...</div>
          ) : error ? (
            <div className={styles.error}>Error loading prices: {error}</div>
          ) : (
            <div className={styles.priceGrid}>
              <div className={styles.priceCard}>
                <h3>Bitcoin (BTC)</h3>
                <p className={styles.price}>${cryptoPrices.BTC}</p>
                <div className={trends.BTC === 'up' ? styles.trendUp : styles.trendDown}>
                  {trends.BTC === 'up' ? '▲' : '▼'} 2.5%
                </div>
              </div>
              <div className={styles.priceCard}>
                <h3>Ethereum (ETH)</h3>
                <p className={styles.price}>${cryptoPrices.ETH}</p>
                <div className={trends.ETH === 'up' ? styles.trendUp : styles.trendDown}>
                  {trends.ETH === 'up' ? '▲' : '▼'} 1.8%
                </div>
              </div>
              <div className={styles.priceCard}>
                <h3>Litecoin (LTC)</h3>
                <p className={styles.price}>${cryptoPrices.LTC}</p>
                <div className={trends.LTC === 'up' ? styles.trendUp : styles.trendDown}>
                  {trends.LTC === 'up' ? '▲' : '▼'} 0.7%
                </div>
              </div>
              <div className={styles.priceCard}>
                <h3>Ripple (XRP)</h3>
                <p className={styles.price}>${cryptoPrices.XRP}</p>
                <div className={trends.XRP === 'up' ? styles.trendUp : styles.trendDown}>
                  {trends.XRP === 'up' ? '▲' : '▼'} 3.2%
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.features}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Why Choose CryptoZen?</h2>
          <div className={styles.featureGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🔒</div>
              <h3>Bank-Grade Security</h3>
              <p>Multi-layer security protocols and cold storage for maximum protection</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>💳</div>
              <h3>Multiple Payment Options</h3>
              <p>Buy crypto with credit cards, bank transfers, gift cards, and digital wallets</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>📱</div>
              <h3>Mobile Friendly</h3>
              <p>Trade on the go with our responsive platform and mobile app</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🌐</div>
              <h3>Global Access</h3>
              <p>Available in 50+ countries with local currency support</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className={styles.ctaSection}>
        <div className={styles.container}>
          <h2>Ready to Start Trading?</h2>
          <p>Join thousands of satisfied users on our secure platform</p>
          <button className={styles.largeButton}>Create Account</button>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerGrid}>
            <div className={styles.footerColumn}>
              <h3>CryptoZen</h3>
              <p>Your trusted partner in cryptocurrency trading</p>
            </div>
            <div className={styles.footerColumn}>
              <h4>Products</h4>
              <ul>
                <li>Spot Trading</li>
                <li>Margin Trading</li>
                <li>Staking</li>
                <li>Wallet</li>
              </ul>
            </div>
            <div className={styles.footerColumn}>
              <h4>Support</h4>
              <ul>
                <li>Help Center</li>
                <li>Contact Us</li>
                <li>Fee Schedule</li>
                <li>API Documentation</li>
              </ul>
            </div>
            <div className={styles.footerColumn}>
              <h4>Legal</h4>
              <ul>
                <li>Terms of Service</li>
                <li>Privacy Policy</li>
                <li>Security</li>
                <li>Compliance</li>
              </ul>
            </div>
          </div>
          <div className={styles.copyright}>
            <p>&copy; 2025 CryptoZen. All rights reserved.</p>
          </div>
        </div>
      </footer>
      <ChatSupport />
    </div>
  );
}