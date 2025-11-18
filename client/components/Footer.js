import styles from '../styles/Footer.module.css';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className={styles.footer} role="contentinfo">
      <div className={styles.container}>
        <div className={styles.grid}>
          <div>
            <h3 className={styles.brand}>CryptoZen</h3>
            <p>Your trusted partner in cryptocurrency trading</p>
          </div>
          <nav aria-label="Products">
            <h4 className={styles.sectionTitle}>Products</h4>
            <ul className={styles.list}>
              <li><Link href="/trade" className={styles.link}>Spot Trading</Link></li>
              <li><Link href="/trade?type=margin" className={styles.link}>Margin Trading</Link></li>
              <li><Link href="/staking" className={styles.link}>Staking</Link></li>
              <li><Link href="/wallet" className={styles.link}>Wallet</Link></li>
            </ul>
          </nav>
          <nav aria-label="Support">
            <h4 className={styles.sectionTitle}>Support</h4>
            <ul className={styles.list}>
              <li><Link href="/help-center" className={styles.link}>Help Center</Link></li>
              <li><Link href="/contact" className={styles.link}>Contact Us</Link></li>
              <li><Link href="/fees" className={styles.link}>Fee Schedule</Link></li>
              <li><Link href="/docs" className={styles.link}>API Documentation</Link></li>
            </ul>
          </nav>
          <nav aria-label="Legal">
            <h4 className={styles.sectionTitle}>Legal</h4>
            <ul className={styles.list}>
              <li><Link href="/terms" className={styles.link}>Terms of Service</Link></li>
              <li><Link href="/privacy" className={styles.link}>Privacy Policy</Link></li>
              <li><Link href="/security" className={styles.link}>Security</Link></li>
              <li><Link href="/compliance" className={styles.link}>Compliance</Link></li>
            </ul>
          </nav>
        </div>
        <div className={styles.copyright}>
          <p>&copy; {new Date().getFullYear()} CryptoZen. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}