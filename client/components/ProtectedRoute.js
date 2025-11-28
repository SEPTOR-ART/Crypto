import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';
import alertStyles from './Alert.module.css';

const ProtectedRoute = ({ children, requireAuth = true, requireAdmin = false }) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  const { isAdmin } = useAuth();

  useEffect(() => {
    if (!loading) {
      // If admin access is required but user is not admin
      if (requireAdmin && user && !isAdmin(user)) {
        router.push('/dashboard?error=unauthorized');
        return;
      }
      
      // If user is logged in but trying to access auth pages (like login/signup)
      if (!requireAuth && user) {
        router.push('/dashboard');
        return;
      }
    }
  }, [user, loading, router, requireAuth, requireAdmin, isAdmin]);

  // Show loading state
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#1a1a1a',
        color: '#f0f0f0'
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  // If auth is required and user is signed out, show a friendly notice with re-login prompt
  if (requireAuth && !user && !loading) {
    const next = encodeURIComponent(router.asPath || '/');
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#0f1220',
        color: '#eaeaea',
        padding: '1rem'
      }}>
        <div style={{ maxWidth: 680, width: '100%' }}>
          <div className={`${alertStyles.alert} ${alertStyles.info}`} role="status" aria-live="polite">
            <div className={alertStyles.alertIcon}>🔒</div>
            <div className={alertStyles.alertContent}>
              <p className={alertStyles.alertTitle}>You are signed out</p>
              <p className={alertStyles.alertMessage}>Your session is not active. Please sign in to continue to this page.</p>
            </div>
            <Link href={`/login?next=${next}&reason=auth_required`}>
              <a style={{
                background: '#2196f3',
                color: '#fff',
                padding: '0.5rem 0.9rem',
                borderRadius: 6,
                textDecoration: 'none',
                fontWeight: 600
              }}>Sign In</a>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // If access is granted, render children
  if (!requireAuth || (user && !requireAdmin) || (user && requireAdmin && isAdmin(user))) {
    return children;
  }

  // Default: show nothing while loading
  return null;
};

export default ProtectedRoute;
