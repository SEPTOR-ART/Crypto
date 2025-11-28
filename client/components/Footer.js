import styles from '../styles/Footer.module.css';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className={styles.footer} role="contentinfo">
      <div className={styles.container}>
        <div className={styles.grid}>
          {/* Brand Section */}
          <div className={styles.brandSection}>
            <h3 className={styles.brand}>CryptoZen</h3>
            <p className={styles.tagline}>The Future of Digital Asset Trading</p>
            <p className={styles.description}>Join millions of users worldwide in the most secure and innovative cryptocurrency exchange platform.</p>
            <div className={styles.socialLinks}>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className={styles.socialIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/>
                </svg>
              </a>
              <a href="https://discord.com" target="_blank" rel="noopener noreferrer" aria-label="Discord" className={styles.socialIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
              </a>
              <a href="https://t.me" target="_blank" rel="noopener noreferrer" aria-label="Telegram" className={styles.socialIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161l-1.84 8.664c-.138.613-.5.76-1.005.474l-2.776-2.05-1.338 1.288c-.148.148-.272.272-.558.272l.2-2.836 5.18-4.677c.225-.2-.05-.312-.35-.112l-6.4 4.03-2.76-.862c-.6-.187-.612-.6.125-.89l10.782-4.156c.5-.187.938.112.775.89z"/>
                </svg>
              </a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className={styles.socialIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Products */}
          <nav aria-label="Products">
            <h4 className={styles.sectionTitle}>Products</h4>
            <ul className={styles.list}>
              <li><Link href="/trade" className={styles.link}>Spot Trading</Link></li>
              <li><Link href="/trade?type=margin" className={styles.link}>Margin Trading</Link></li>
              <li><Link href="/wallet" className={styles.link}>Crypto Wallet</Link></li>
              <li><Link href="/staking" className={styles.link}>Staking & Earn</Link></li>
              <li><Link href="/gift-cards" className={styles.link}>Gift Cards</Link></li>
            </ul>
          </nav>

          {/* Company */}
          <nav aria-label="Company">
            <h4 className={styles.sectionTitle}>Company</h4>
            <ul className={styles.list}>
              <li><Link href="/about" className={styles.link}>About Us</Link></li>
              <li><Link href="/careers" className={styles.link}>Careers</Link></li>
              <li><Link href="/blog" className={styles.link}>Blog</Link></li>
              <li><Link href="/press" className={styles.link}>Press Kit</Link></li>
              <li><Link href="/partners" className={styles.link}>Partners</Link></li>
            </ul>
          </nav>

          {/* Support */}
          <nav aria-label="Support">
            <h4 className={styles.sectionTitle}>Support</h4>
            <ul className={styles.list}>
              <li><Link href="/help-center" className={styles.link}>Help Center</Link></li>
              <li><Link href="/contact" className={styles.link}>Contact Us</Link></li>
              <li><Link href="/fees" className={styles.link}>Fee Schedule</Link></li>
              <li><Link href="/docs" className={styles.link}>API Docs</Link></li>
              <li><Link href="/status" className={styles.link}>System Status</Link></li>
            </ul>
          </nav>

          {/* Legal */}
          <nav aria-label="Legal">
            <h4 className={styles.sectionTitle}>Legal</h4>
            <ul className={styles.list}>
              <li><Link href="/terms" className={styles.link}>Terms of Service</Link></li>
              <li><Link href="/privacy" className={styles.link}>Privacy Policy</Link></li>
              <li><Link href="/security" className={styles.link}>Security</Link></li>
              <li><Link href="/compliance" className={styles.link}>Compliance</Link></li>
              <li><Link href="/licenses" className={styles.link}>Licenses</Link></li>
            </ul>
          </nav>
        </div>

        {/* Bottom Bar */}
        <div className={styles.bottomBar}>
          <div className={styles.copyright}>
            <p>&copy; {new Date().getFullYear()} CryptoZen. All rights reserved.</p>
          </div>
          <div className={styles.badges}>
            <span className={styles.badge}>Secure SSL</span>
            <span className={styles.badge}>Licensed & Regulated</span>
            <span className={styles.badge}>24/7 Support</span>
          </div>
        </div>
      </div>
    </footer>
  );
}