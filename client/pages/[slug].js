import Head from 'next/head';
import Link from 'next/link';

const KNOWN = new Set(['support','help-center','contact','fees','docs','terms','privacy','security','compliance','staking']);

export default function InfoPage({ slug }) {
  const known = KNOWN.has(slug);
  return (
    <main style={{padding:'4rem 1.5rem',maxWidth:900,margin:'0 auto'}}>
      <Head><title>{known ? `${slug.replace('-', ' ')} - CryptoZen` : 'Page - CryptoZen'}</title></Head>
      <h1 style={{color:'#1a2a6c',marginBottom:'1rem',textTransform:'capitalize'}}>{slug.replace('-', ' ')}</h1>
      {known ? (
        <p style={{color:'#495057'}}>This page is under active development. Please check back soon.</p>
      ) : (
        <div>
          <p style={{color:'#495057'}}>We couldn’t find what you were looking for.</p>
          <Link href="/" style={{color:'#1a2a6c',textDecoration:'underline'}}>Go back home</Link>
        </div>
      )}
    </main>
  );
}

export async function getServerSideProps({ params }) {
  return { props: { slug: params.slug } };
}