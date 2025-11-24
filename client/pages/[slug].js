import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
// import styles from '../styles/globals.css'; // Removed unused import

const KNOWN = ['support','help-center','contact','fees','docs','terms','privacy','security','compliance','staking','forgot-password'];

export default function InfoPage({ slug }) {
  const router = useRouter();
  
  // If the page is not yet generated, this will be displayed
  // initially until getStaticProps() finishes running
  if (router.isFallback) {
    return <div>Loading...</div>;
  }
  
  const known = KNOWN.includes(slug);
  
  // For known pages, we can add specific content later
  const pageContent = {
    'staking': {
      title: 'Staking',
      description: 'Earn rewards by staking your cryptocurrencies with CryptoZen.'
    },
    'security': {
      title: 'Security',
      description: 'Learn about our advanced security measures to protect your assets.'
    },
    'contact': {
      title: 'Contact Us',
      description: 'Get in touch with our support team for assistance.'
    },
    'help-center': {
      title: 'Help Center',
      description: 'Find answers to frequently asked questions and tutorials.'
    },
    'docs': {
      title: 'Documentation',
      description: 'Technical documentation for developers and advanced users.'
    },
    'compliance': {
      title: 'Compliance',
      description: 'Information about our regulatory compliance and licensing.'
    },
    'fees': {
      title: 'Fees',
      description: 'Transparent fee structure for all our services.'
    },
    'terms': {
      title: 'Terms of Service',
      description: 'Our terms and conditions for using CryptoZen services.'
    },
    'privacy': {
      title: 'Privacy Policy',
      description: 'How we collect, use, and protect your personal information.'
    },
    'support': {
      title: 'Support',
      description: 'Get help with your account, transactions, and other issues.'
    },
    'forgot-password': {
      title: 'Forgot Password',
      description: 'Reset your password if you&apos;ve forgotten it.'
    }
  };
  
  const content = pageContent[slug] || {
    title: slug.replace('-', ' '),
    description: 'Page under development. Please check back soon.'
  };
  
  return (
    <main style={{padding:'4rem 1.5rem',maxWidth:900,margin:'0 auto',minHeight:'70vh'}}>
      <Head>
        <title>{known ? `${content.title} - CryptoZen` : 'Page Not Found - CryptoZen'}</title>
        <meta name="description" content={content.description} />
      </Head>
      <h1 style={{color:'#6a0dad',marginBottom:'1rem',textTransform:'capitalize'}}>
        {content.title}
      </h1>
      {known ? (
        <div>
          <p style={{color:'#495057',fontSize:'1.1rem',lineHeight:'1.6'}}>
            {content.description}
          </p>
          <div style={{marginTop:'2rem',padding:'1.5rem',backgroundColor:'#f8f9fa',borderRadius:'8px'}}>
            <h2 style={{color:'#6a0dad',marginBottom:'1rem'}}>Coming Soon</h2>
            <p style={{color:'#495057'}}>
              This page is currently under development. We&apos;re working hard to bring you the best 
              experience possible. Please check back soon for updates.
            </p>
          </div>
        </div>
      ) : (
        <div>
          <h2 style={{color:'#6a0dad'}}>Page Not Found</h2>
          <p style={{color:'#495057',fontSize:'1.1rem',lineHeight:'1.6'}}>
            We couldn&apos;t find the page you were looking for.
          </p>
          <div style={{marginTop:'2rem'}}>
            <Link href="/" style={{color:'#6a0dad',textDecoration:'underline',fontSize:'1.1rem'}}>
              &#8592; Go back home
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}

export async function getStaticPaths() {
  // Get all known paths
  const paths = KNOWN.map((slug) => ({
    params: { slug }
  }));
  
  return {
    paths,
    fallback: true, // true means pages not returned by paths will be generated on demand
  };
}

export async function getStaticProps({ params }) {
  return { 
    props: { 
      slug: params.slug 
    }
  };
}