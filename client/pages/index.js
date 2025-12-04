import Head from 'next/head';
import styles from '../styles/Home.module.css';
import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import ThreeCoin from '../components/ThreeCoin';
import HeroCanvas from '../components/HeroCanvas';
import { useCryptoPrices } from '../hooks/useCryptoPrices';

export default function Home() {
  const heroRef = useRef(null);
  const titleRef = useRef(null);
  const descRef = useRef(null);
  const ctasRef = useRef(null);
  const { prices: cryptoPrices, loading, error, refreshing } = useCryptoPrices();
  const [trends] = useState({
    BTC: 'up',
    ETH: 'up',
    LTC: 'down',
    XRP: 'up'
  });
  
  // State for retrying connection
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  // Function to retry connection
  const retryConnection = () => {
    setIsRetrying(true);
    setRetryCount(prev => prev + 1);
    // Refresh the page to retry connection
    window.location.reload();
  };

  useEffect(() => {
    if (!heroRef.current) return;
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      const ease = 'power3.out';
      gsap.timeline({ defaults: { ease } })
        .from(titleRef.current, { y: 30, opacity: 0, duration: 0.8 })
        .from(descRef.current, { y: 20, opacity: 0, duration: 0.7 }, '-=0.3')
        .from(ctasRef.current?.querySelectorAll('button'), { y: 10, opacity: 0, stagger: 0.1, duration: 0.5 }, '-=0.2');

      const cards = document.querySelectorAll(`.${styles.featureCard}`);
      cards.forEach((el) => {
        gsap.from(el, {
          y: 30,
          opacity: 0,
          duration: 0.6,
          ease,
          scrollTrigger: { trigger: el, start: 'top 80%' }
        });
      });
    }, heroRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      gsap.to(el.querySelector(`.${styles.heroContent}`), { rotateY: x * 6, rotateX: -y * 6, transformPerspective: 600, transformOrigin: 'center', duration: 0.4 });
    };
    const onLeave = () => {
      gsap.to(el.querySelector(`.${styles.heroContent}`), { rotateY: 0, rotateX: 0, duration: 0.5 });
    };
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return (
    <div className={styles.container}>
      <Head>
        <title>CryptoZen - Asian-Inspired Cryptocurrency Exchange</title>
        <meta name="description" content="Modern, secure cryptocurrency exchange with Asian-inspired aesthetics" />
        <link rel="icon" href="/favicon.svg" />
      </Head>

      {/* Hero Section with Parallax Effect */}
      <section className={styles.hero} ref={heroRef}>
        <div className={styles.parallaxBackground}></div>
        <div className={styles.heroCanvas}><HeroCanvas /></div>
        <div className={`${styles.heroContent} ${styles.heroGrid}`}>
          <div>
            <h1 className={styles.title} ref={titleRef}>
              Welcome to <span className={styles.highlight}>CryptoZen</span>
            </h1>
            <p className={styles.description} ref={descRef}>
              Experience the future of cryptocurrency trading with our secure, Asian-inspired platform
            </p>
            <div className={styles.ctaButtons} ref={ctasRef}>
              <button className={styles.primaryButton} aria-label="Get started with CryptoZen">Get Started</button>
              <button className={styles.secondaryButton} aria-label="Learn more about CryptoZen">Learn More</button>
            </div>
          </div>
          <div className={styles.heroAside} aria-hidden>
            <ThreeCoin />
          </div>
        </div>
      </section>

      {/* Real-time Price Tracker */}
      <section className={styles.priceTracker}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Real-Time Crypto Prices</h2>
          {loading ? (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              Loading prices...
            </div>
          ) : error ? (
            <div className={styles.errorContainer}>
              <div className={styles.errorIcon}>⚠️</div>
              <h3 className={styles.errorTitle}>Connection Error</h3>
              <p className={styles.errorMessage}>Error loading prices: {error}</p>
              <button 
                className={styles.retryButton} 
                onClick={retryConnection}
                disabled={isRetrying}
              >
                {isRetrying ? 'Retrying...' : 'Retry Connection'}
              </button>
              <div className={styles.errorHelp}>
                <p>Having trouble connecting? Check your internet connection or try again in a few minutes.</p>
              </div>
            </div>
          ) : (
            <div className={styles.priceGrid}>
              <div className={`${styles.priceCard} ${styles.btcCard} ${refreshing ? styles.priceCardRefreshing : ''}`}>
                <div className={styles.cardIcon}>₿</div>
                <h3>Bitcoin (BTC)</h3>
                <p className={styles.price}>${parseFloat(cryptoPrices.BTC).toLocaleString()}</p>
                <div className={`${styles.trendIndicator} ${trends.BTC === 'up' ? styles.trendUp : styles.trendDown}`}>
                  <span className={styles.trendArrow}>{trends.BTC === 'up' ? '▲' : '▼'}</span>
                  <span className={styles.trendValue}>2.5%</span>
                </div>
              </div>
              <div className={`${styles.priceCard} ${styles.ethCard} ${refreshing ? styles.priceCardRefreshing : ''}`}>
                <div className={styles.cardIcon}>Ξ</div>
                <h3>Ethereum (ETH)</h3>
                <p className={styles.price}>${parseFloat(cryptoPrices.ETH).toLocaleString()}</p>
                <div className={`${styles.trendIndicator} ${trends.ETH === 'up' ? styles.trendUp : styles.trendDown}`}>
                  <span className={styles.trendArrow}>{trends.ETH === 'up' ? '▲' : '▼'}</span>
                  <span className={styles.trendValue}>1.8%</span>
                </div>
              </div>
              <div className={`${styles.priceCard} ${styles.ltcCard} ${refreshing ? styles.priceCardRefreshing : ''}`}>
                <div className={styles.cardIcon}>Ł</div>
                <h3>Litecoin (LTC)</h3>
                <p className={styles.price}>${parseFloat(cryptoPrices.LTC).toLocaleString()}</p>
                <div className={`${styles.trendIndicator} ${trends.LTC === 'up' ? styles.trendUp : styles.trendDown}`}>
                  <span className={styles.trendArrow}>{trends.LTC === 'up' ? '▲' : '▼'}</span>
                  <span className={styles.trendValue}>0.7%</span>
                </div>
              </div>
              <div className={`${styles.priceCard} ${styles.xrpCard} ${refreshing ? styles.priceCardRefreshing : ''}`}>
                <div className={styles.cardIcon}>X</div>
                <h3>Ripple (XRP)</h3>
                <p className={styles.price}>${parseFloat(cryptoPrices.XRP).toLocaleString()}</p>
                <div className={`${styles.trendIndicator} ${trends.XRP === 'up' ? styles.trendUp : styles.trendDown}`}>
                  <span className={styles.trendArrow}>{trends.XRP === 'up' ? '▲' : '▼'}</span>
                  <span className={styles.trendValue}>3.2%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.features}>
        <div className={styles.container}>
          <div className={styles.featuresHeader}>
            <span className={styles.featuresLabel}>FEATURES</span>
            <h2 className={styles.sectionTitle}>What Makes Us Different</h2>
            <p className={styles.featuresSubtitle}>Experience the next generation of cryptocurrency trading with cutting-edge features designed for your success</p>
          </div>
          <div className={styles.featureGrid}>
            <div className={`${styles.featureCard} ${styles.featureCard3D}`}>
              <div className={styles.featureNumber}>01</div>
              <div className={styles.featureIcon} aria-hidden>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3>Advanced Trading Engine</h3>
              <p>Lightning-fast order execution with institutional-grade matching engine. Execute trades in milliseconds with 99.99% uptime guarantee.</p>
            </div>
            <div className={`${styles.featureCard} ${styles.featureCard3D}`}>
              <div className={styles.featureNumber}>02</div>
              <div className={styles.featureIcon} aria-hidden>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <h3>Military-Grade Security</h3>
              <p>Multi-signature wallets, cold storage, and 2FA authentication. Your assets are protected by bank-level encryption and security protocols.</p>
            </div>
            <div className={`${styles.featureCard} ${styles.featureCard3D}`}>
              <div className={styles.featureNumber}>03</div>
              <div className={styles.featureIcon} aria-hidden>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <h3>Real-Time Analytics</h3>
              <p>Advanced charting tools, technical indicators, and market insights. Make informed decisions with professional-grade analysis tools.</p>
            </div>
            <div className={`${styles.featureCard} ${styles.featureCard3D}`}>
              <div className={styles.featureNumber}>04</div>
              <div className={styles.featureIcon} aria-hidden>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2" y="6" width="20" height="12" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <path d="M2 10h20" stroke="currentColor" strokeWidth="2"/>
                  <path d="M6 14h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <h3>Multiple Payment Methods</h3>
              <p>Credit cards, bank transfers, gift cards, and crypto deposits. Seamlessly fund your account with your preferred payment method.</p>
            </div>
            <div className={`${styles.featureCard} ${styles.featureCard3D}`}>
              <div className={styles.featureNumber}>05</div>
              <div className={styles.featureIcon} aria-hidden>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="5" y="2" width="14" height="20" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 18h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <h3>Mobile Trading App</h3>
              <p>Trade anywhere, anytime with our native iOS and Android apps. Full trading features in the palm of your hand with biometric security.</p>
            </div>
            <div className={`${styles.featureCard} ${styles.featureCard3D}`}>
              <div className={styles.featureNumber}>06</div>
              <div className={styles.featureIcon} aria-hidden>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M2 12h20" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <h3>Global Accessibility</h3>
              <p>Available in 150+ countries with 50+ fiat currencies. Trade with local payment methods and 24/7 multilingual customer support.</p>
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

      
    </div>
  );
}
