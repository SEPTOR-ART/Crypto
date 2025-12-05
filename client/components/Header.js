import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/Header.module.css';

export default function Header() {
  const [open, setOpen] = useState(false);
  const [isSticky, setSticky] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navRef = useRef(null);
  const dropdownRef = useRef(null);
  const [motionOff, setMotionOff] = useState(false);
  const { user, logout } = useAuth();

  useEffect(() => {
    const onScroll = () => {
      setSticky(window.scrollY > 24);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        setDropdownOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className={`${styles.header} ${isSticky ? styles.sticky : ''}`}> 
      <div className={styles.container}>
        <Link href="/" aria-label="Go to home" className={styles.brand}>
          <span className={styles.logo} aria-hidden>₿</span>
          <span className={styles.title}>CryptoZen</span>
        </Link>

        <button
          className={styles.motionToggle}
          aria-label={motionOff ? 'Enable motion' : 'Reduce motion'}
          aria-pressed={motionOff}
          onClick={() => {
            const next = !motionOff;
            setMotionOff(next);
            if (next) document.documentElement.setAttribute('data-motion', 'off');
            else document.documentElement.removeAttribute('data-motion');
          }}
        >
          {motionOff ? 'Motion Off' : 'Motion On'}
        </button>

        <button
          className={styles.menuToggle}
          aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={open}
          aria-controls="primary-nav"
          onClick={() => setOpen((v) => !v)}
        >
          <span className={styles.hamburger} />
        </button>

        <nav
          id="primary-nav"
          ref={navRef}
          className={`${styles.nav} ${open ? styles.open : ''}`}
          role="navigation"
          aria-label="Primary"
        >
          <ul className={styles.navList}>
            {user ? (
              <>
                <li><Link href="/dashboard" className={styles.navLink} onMouseEnter={(e)=>gsap.to(e.currentTarget,{y:-2,duration:.2})} onMouseLeave={(e)=>gsap.to(e.currentTarget,{y:0,duration:.2})}>Dashboard</Link></li>
                <li><Link href="/trade" className={styles.navLink} onMouseEnter={(e)=>gsap.to(e.currentTarget,{y:-2,duration:.2})} onMouseLeave={(e)=>gsap.to(e.currentTarget,{y:0,duration:.2})}>Trade</Link></li>
                <li><Link href="/rates" className={styles.navLink} onMouseEnter={(e)=>gsap.to(e.currentTarget,{y:-2,duration:.2})} onMouseLeave={(e)=>gsap.to(e.currentTarget,{y:0,duration:.2})}>Rates</Link></li>
                <li><Link href="/margin" className={styles.navLink} onMouseEnter={(e)=>gsap.to(e.currentTarget,{y:-2,duration:.2})} onMouseLeave={(e)=>gsap.to(e.currentTarget,{y:0,duration:.2})}>Margin</Link></li>
                <li><Link href="/[slug]" as="/staking" className={styles.navLink} onMouseEnter={(e)=>gsap.to(e.currentTarget,{y:-2,duration:.2})} onMouseLeave={(e)=>gsap.to(e.currentTarget,{y:0,duration:.2})}>Staking</Link></li>
                <li><Link href="/wallet" className={styles.navLink} onMouseEnter={(e)=>gsap.to(e.currentTarget,{y:-2,duration:.2})} onMouseLeave={(e)=>gsap.to(e.currentTarget,{y:0,duration:.2})}>Wallet</Link></li>
                <li><Link href="/settings" className={styles.navLink} onMouseEnter={(e)=>gsap.to(e.currentTarget,{y:-2,duration:.2})} onMouseLeave={(e)=>gsap.to(e.currentTarget,{y:0,duration:.2})}>Settings</Link></li>
                <li className={styles.userMenuContainer} ref={dropdownRef}>
                  <button 
                    className={styles.userMenuButton}
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    aria-expanded={dropdownOpen}
                    aria-haspopup="true"
                  >
                    <span className={styles.userAvatar}>{user.firstName?.[0] || 'U'}</span>
                    <span className={styles.userName}>{user.firstName || 'User'}</span>
                    <span className={styles.dropdownArrow}>▼</span>
                  </button>
                  {dropdownOpen && (
                    <div className={styles.dropdown}>
                      <div className={styles.dropdownHeader}>
                        <div className={styles.dropdownUserName}>{user.firstName} {user.lastName}</div>
                        <div className={styles.dropdownUserEmail}>{user.email}</div>
                      </div>
                      <Link href="/profile" className={styles.dropdownItem} onClick={() => setDropdownOpen(false)}>
                        <span className={styles.dropdownIcon}>👤</span>
                        Profile
                      </Link>
                      <Link href="/settings" className={styles.dropdownItem} onClick={() => setDropdownOpen(false)}>
                        <span className={styles.dropdownIcon}>⚙️</span>
                        Settings
                      </Link>
                      <div className={styles.dropdownDivider}></div>
                      <button className={`${styles.dropdownItem} ${styles.logoutButton}`} onClick={handleLogout}>
                        <span className={styles.dropdownIcon}>🚪</span>
                        Logout
                      </button>
                    </div>
                  )}
                </li>
              </>
            ) : (
              <>
                <li><Link href="/trade" className={styles.navLink} onMouseEnter={(e)=>gsap.to(e.currentTarget,{y:-2,duration:.2})} onMouseLeave={(e)=>gsap.to(e.currentTarget,{y:0,duration:.2})}>Trade</Link></li>
                <li><Link href="/rates" className={styles.navLink} onMouseEnter={(e)=>gsap.to(e.currentTarget,{y:-2,duration:.2})} onMouseLeave={(e)=>gsap.to(e.currentTarget,{y:0,duration:.2})}>Rates</Link></li>
                <li><Link href="/margin" className={styles.navLink} onMouseEnter={(e)=>gsap.to(e.currentTarget,{y:-2,duration:.2})} onMouseLeave={(e)=>gsap.to(e.currentTarget,{y:0,duration:.2})}>Margin</Link></li>
                <li><Link href="/[slug]" as="/staking" className={styles.navLink} onMouseEnter={(e)=>gsap.to(e.currentTarget,{y:-2,duration:.2})} onMouseLeave={(e)=>gsap.to(e.currentTarget,{y:0,duration:.2})}>Staking</Link></li>
                <li><Link href="/support" className={styles.navLink} onMouseEnter={(e)=>gsap.to(e.currentTarget,{y:-2,duration:.2})} onMouseLeave={(e)=>gsap.to(e.currentTarget,{y:0,duration:.2})}>Support</Link></li>
                <li><Link href="/login" className={styles.navLink} onMouseEnter={(e)=>gsap.to(e.currentTarget,{y:-2,duration:.2})} onMouseLeave={(e)=>gsap.to(e.currentTarget,{y:0,duration:.2})}>Login</Link></li>
                <li><Link href="/signup" className={`${styles.navLink} ${styles.cta}`} onMouseEnter={(e)=>gsap.to(e.currentTarget,{y:-3,boxShadow:'0 6px 16px rgba(255,215,0,.4)',duration:.2})} onMouseLeave={(e)=>gsap.to(e.currentTarget,{y:0,boxShadow:'0 0 0 rgba(0,0,0,0)',duration:.2})}>Sign Up</Link></li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
}
