import Link from 'next/link';

export default function NotFound() {
  return (
    <main style={{padding:'6rem 1.5rem',textAlign:'center'}}>
      <h1 style={{fontSize:'2rem',color:'#1a2a6c',marginBottom:'1rem'}}>Page Not Found</h1>
      <p style={{color:'#495057',marginBottom:'1.5rem'}}>The page you’re looking for doesn’t exist or has moved.</p>
      <Link href="/" style={{color:'#1a2a6c',textDecoration:'underline'}}>Return to Home</Link>
    </main>
  );
}