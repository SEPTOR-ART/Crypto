import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requireAuth = true, requireAdmin = false }) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Check if user is admin with enhanced validation
  const isAdmin = (user) => {
    // Check if user object exists
    if (!user) return false;
    
    // Check for admin email addresses
    const adminEmails = ['admin@cryptozen.com', 'admin@cryptoasia.com', 'Cryptozen@12345'];
    if (adminEmails.includes(user.email)) return true;
    
    // Check for isAdmin flag
    if (user.isAdmin === true) return true;
    
    // User is not an admin
    return false;
  };

  useEffect(() => {
    if (!loading) {
      // If authentication is required but user is not logged in
      if (requireAuth && !user) {
        router.push('/login');
        return;
      }
      
      // If admin access is required but user is not admin
      if (requireAdmin && user && !isAdmin(user)) {
        // Redirect to dashboard with an error message
        router.push('/dashboard?error=unauthorized');
        return;
      }
      
      // If user is logged in but trying to access auth pages (like login/signup)
      if (!requireAuth && user) {
        router.push('/dashboard');
        return;
      }
    }
  }, [user, loading, router, requireAuth, requireAdmin]);

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

  // If access is granted, render children
  if (!requireAuth || (user && !requireAdmin) || (user && requireAdmin && isAdmin(user))) {
    return children;
  }

  // Return null while redirecting
  return null;
};

export default ProtectedRoute;