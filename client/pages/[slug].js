import Head from 'next/head';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import { createPublicSupportMessage } from '../services/supportService';
import { useRouter } from 'next/router';
// import styles from '../styles/globals.css'; // Removed unused import

const KNOWN = ['help-center','contact','fees','docs','terms','privacy','security','compliance','staking','forgot-password','blog','about','press','careers','gift-cards','partners','status','licenses'];

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
    'forgot-password': {
      title: 'Forgot Password',
      description: 'Reset your password if you&apos;ve forgotten it.'
    },
    'blog': {
      title: 'Blog',
      description: 'Latest news, insights, and updates from CryptoZen.'
    },
    'about': {
      title: 'About Us',
      description: 'Learn more about CryptoZen and our mission.'
    },
    'press': {
      title: 'Press & Media',
      description: 'Press releases and media resources.'
    },
    'careers': {
      title: 'Careers',
      description: 'Join our team and help shape the future of crypto trading.'
    },
    'gift-cards': {
      title: 'Gift Cards',
      description: 'Purchase and redeem cryptocurrency gift cards.'
    },
    'partners': {
      title: 'Partners',
      description: 'Our trusted partners and integrations.'
    },
    'status': {
      title: 'System Status',
      description: 'Check the current status of our platform and services.'
    },
    'licenses': {
      title: 'Licenses',
      description: 'Open source licenses and attributions.'
    }
  };
  
  const content = pageContent[slug] || {
    title: slug.replace('-', ' '),
    description: 'Page under development. Please check back soon.'
  };
  
  const FeeCalculator = () => {
    const [amount, setAmount] = useState('1000');
    const [pair, setPair] = useState('BTC/USD');
    const [tier, setTier] = useState('standard');
    const result = useMemo(() => {
      const rates = { standard: { maker: 0.001, taker: 0.0015 }, vip: { maker: 0.0005, taker: 0.001 } };
      const a = parseFloat(amount) || 0;
      const r = rates[tier];
      return {
        maker: (a * r.maker).toFixed(2),
        taker: (a * r.taker).toFixed(2)
      };
    }, [amount, tier]);
    return (
      <div style={{marginTop:'1.5rem',padding:'1rem',background:'#f8f9fa',borderRadius:8}}>
        <div style={{display:'flex',gap:'0.75rem',marginBottom:'1rem'}}>
          <input value={amount} onChange={(e)=>setAmount(e.target.value)} style={{flex:1,padding:'0.5rem'}} />
          <select value={pair} onChange={(e)=>setPair(e.target.value)} style={{padding:'0.5rem'}}>
            <option>BTC/USD</option>
            <option>ETH/USD</option>
            <option>LTC/USD</option>
            <option>XRP/USD</option>
          </select>
          <select value={tier} onChange={(e)=>setTier(e.target.value)} style={{padding:'0.5rem'}}>
            <option value="standard">Standard</option>
            <option value="vip">VIP</option>
          </select>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
          <div><div style={{fontWeight:700}}>Maker Fee</div><div>${result.maker}</div></div>
          <div><div style={{fontWeight:700}}>Taker Fee</div><div>${result.taker}</div></div>
        </div>
      </div>
    );
  };

  const HelpCenter = () => {
    const faqs = [
      { q:'How do I verify my account?', a:'Upload ID and proof of address in Settings.' },
      { q:'What are trading fees?', a:'See Fee Schedule for maker/taker rates and tiers.' },
      { q:'How do I deposit?', a:'Open Wallet, choose asset, copy deposit address.' },
      { q:'How do I contact support?', a:'Use Contact form or the live chat widget.' }
    ];
    return (
      <div style={{marginTop:'1.5rem'}}>
        {faqs.map((f,i)=>(
          <div key={i} style={{padding:'1rem',border:'1px solid #eee',borderRadius:8,marginBottom:'0.75rem'}}>
            <div style={{fontWeight:700}}>{f.q}</div>
            <div style={{color:'#6c757d'}}>{f.a}</div>
          </div>
        ))}
      </div>
    );
  };

  const About = () => {
    const stats = [
      { label:'Users', value:'120k+' },
      { label:'Assets', value:'200+' },
      { label:'Countries', value:'150+' },
      { label:'Uptime', value:'99.99%' }
    ];
    return (
      <div style={{marginTop:'1.5rem'}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:'1rem'}}>
          {stats.map((s,i)=> (
            <div key={i} style={{padding:'1rem',border:'1px solid #eee',borderRadius:8}}>
              <div style={{fontWeight:700}}>{s.value}</div>
              <div style={{color:'#6c757d'}}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const PressKit = () => {
    const assets = [
      { name:'Logo - Dark', note:'SVG/PNG', url:'/favicon.svg' },
      { name:'Wordmark', note:'PNG', url:'/favicon.svg' }
    ];
    return (
      <div style={{marginTop:'1.5rem'}}>
        {assets.map((a,i)=> (
          <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'1rem',border:'1px solid #eee',borderRadius:8,marginBottom:'0.75rem'}}>
            <div>
              <div style={{fontWeight:700}}>{a.name}</div>
              <div style={{color:'#6c757d'}}>{a.note}</div>
            </div>
            <a href={a.url} download style={{color:'#6a0dad'}}>Download</a>
          </div>
        ))}
      </div>
    );
  };

  const ContactForm = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [subject, setSubject] = useState('General Inquiry');
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState('');
    const [error, setError] = useState('');
    const onSubmit = async (e) => {
      e.preventDefault();
      try {
        setError('');
        setStatus('');
        if (!name.trim() || !email.trim() || !message.trim()) {
          setError('All fields are required');
          return;
        }
        await createPublicSupportMessage({ text: message.trim(), subject, name: name.trim(), email: email.trim() });
        setStatus('Submitted successfully');
        setName(''); setEmail(''); setSubject('General Inquiry'); setMessage('');
      } catch (err) {
        setError(err.message || 'Submission failed');
      }
    };
    return (
      <form onSubmit={onSubmit} style={{marginTop:'1.5rem',display:'grid',gap:'0.75rem'}}>
        {status && <div style={{color:'#198754'}}>{status}</div>}
        {error && <div style={{color:'#dc3545'}}>{error}</div>}
        <input placeholder="Your Name" value={name} onChange={(e)=>setName(e.target.value)} style={{padding:'0.75rem'}} />
        <input placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} style={{padding:'0.75rem'}} />
        <select value={subject} onChange={(e)=>setSubject(e.target.value)} style={{padding:'0.75rem'}}>
          <option>General Inquiry</option>
          <option>Account Support</option>
          <option>Technical Issue</option>
          <option>Billing</option>
        </select>
        <textarea placeholder="How can we help?" value={message} onChange={(e)=>setMessage(e.target.value)} rows={5} style={{padding:'0.75rem'}} />
        <button type="submit" style={{padding:'0.75rem',background:'#6a0dad',color:'#fff',border:'none',borderRadius:6}}>Submit</button>
      </form>
    );
  };

  const APIDocs = () => {
    const endpoints = [
      { method:'GET', path:'/api/prices', desc:'List current prices for major assets', example:`curl -s https://crypto-r29t.onrender.com/api/prices` },
      { method:'GET', path:'/api/users/profile', desc:'Get current user profile (auth required)', example:`curl -H "Authorization: Bearer <token>" https://crypto-r29t.onrender.com/api/users/profile` },
    ];
    return (
      <div style={{marginTop:'1.5rem'}}>
        {endpoints.map((e,i)=> (
          <div key={i} style={{padding:'1rem',border:'1px solid #eee',borderRadius:8,marginBottom:'0.75rem'}}>
            <div style={{display:'flex',gap:'0.5rem'}}><span style={{fontWeight:700}}>{e.method}</span><span>{e.path}</span></div>
            <div style={{color:'#6c757d'}}>{e.desc}</div>
            <pre style={{background:'#f8f9fa',padding:'0.75rem',borderRadius:6,overflow:'auto'}}>{e.example}</pre>
          </div>
        ))}
      </div>
    );
  };

  const SystemStatus = () => {
    const services = [
      { name:'API', uptime:'99.98%', status:'Operational' },
      { name:'WebSocket', uptime:'99.90%', status:'Operational' },
      { name:'Database', uptime:'99.95%', status:'Operational' },
      { name:'Email', uptime:'99.80%', status:'Degraded' },
    ];
    return (
      <div style={{marginTop:'1.5rem',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:'1rem'}}>
        {services.map((s,i)=> (
          <div key={i} style={{padding:'1rem',border:'1px solid #eee',borderRadius:8}}>
            <div style={{fontWeight:700}}>{s.name}</div>
            <div style={{color:'#6c757d'}}>Uptime: {s.uptime}</div>
            <div style={{color:s.status==='Operational'?'#198754':'#fd7e14'}}>{s.status}</div>
          </div>
        ))}
      </div>
    );
  };

  const StakingSection = () => {
    const products = [
      { asset:'BTC', apy: '3.5%', lock:'30d' },
      { asset:'ETH', apy: '4.2%', lock:'60d' },
      { asset:'LTC', apy: '2.1%', lock:'15d' },
      { asset:'XRP', apy: '6.0%', lock:'90d' },
    ];
    const [asset, setAsset] = useState('BTC');
    const [amount, setAmount] = useState('1');
    const [days, setDays] = useState('30');
    const reward = useMemo(() => {
      const a = parseFloat(amount) || 0;
      const apyMap = { BTC:0.035, ETH:0.042, LTC:0.021, XRP:0.06 };
      const r = apyMap[asset] || 0;
      const d = parseInt(days) || 0;
      return (a * r * (d/365)).toFixed(6);
    }, [asset, amount, days]);
    const history = [
      { asset:'BTC', amount:'0.100000', date:'2025-04-10', status:'Paid' },
      { asset:'ETH', amount:'0.050000', date:'2025-04-01', status:'Paid' },
    ];
    return (
      <div style={{marginTop:'1.5rem'}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:'1rem'}}>
          {products.map((p,i)=> (
            <div key={i} style={{padding:'1rem',border:'1px solid #eee',borderRadius:8}}>
              <div style={{fontWeight:700}}>{p.asset}</div>
              <div>APY {p.apy}</div>
              <div>Lock {p.lock}</div>
            </div>
          ))}
        </div>
        <div style={{marginTop:'1rem',padding:'1rem',background:'#f8f9fa',borderRadius:8}}>
          <div style={{display:'flex',gap:'0.75rem',flexWrap:'wrap'}}>
            <select value={asset} onChange={(e)=>setAsset(e.target.value)} style={{padding:'0.5rem'}}>
              <option>BTC</option><option>ETH</option><option>LTC</option><option>XRP</option>
            </select>
            <input value={amount} onChange={(e)=>setAmount(e.target.value)} style={{padding:'0.5rem'}} />
            <select value={days} onChange={(e)=>setDays(e.target.value)} style={{padding:'0.5rem'}}>
              <option>15</option><option>30</option><option>60</option><option>90</option>
            </select>
          </div>
          <div style={{marginTop:'0.5rem'}}>Estimated Reward: {reward} {asset}</div>
        </div>
        <div style={{marginTop:'1rem'}}>
          <div style={{fontWeight:700,marginBottom:'0.5rem'}}>Earning History</div>
          {history.map((h,i)=> (
            <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'0.5rem 0',borderBottom:'1px solid #eee'}}>
              <span>{h.asset}</span>
              <span>{h.amount}</span>
              <span>{h.date}</span>
              <span>{h.status}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const LegalDoc = ({ title }) => {
    const [query, setQuery] = useState('');
    const sections = [
      { h:'Introduction', t:'These terms govern your use of CryptoZen.' },
      { h:'Privacy', t:'We process data according to our privacy policy.' },
      { h:'Security', t:'We implement strong security controls.' },
      { h:'Compliance', t:'We adhere to applicable regulations.' },
    ];
    const filtered = sections.filter(s => (s.h + s.t).toLowerCase().includes(query.toLowerCase()));
    const versions = [ { version:'1.0', date:'2024-08-01' }, { version:'1.1', date:'2025-01-10' } ];
    return (
      <div style={{marginTop:'1.5rem'}}>
        <input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search document" style={{padding:'0.5rem',width:'100%',marginBottom:'0.75rem'}} />
        <div style={{border:'1px solid #eee',borderRadius:8,maxHeight:360,overflow:'auto',padding:'1rem'}}>
          {filtered.map((s,i)=> (
            <div key={i} style={{marginBottom:'1rem'}}>
              <div style={{fontWeight:700}}>{s.h}</div>
              <div style={{color:'#6c757d'}}>{s.t}</div>
            </div>
          ))}
        </div>
        <div style={{marginTop:'0.75rem'}}>
          <div style={{fontWeight:700}}>Version History</div>
          {versions.map((v,i)=> (
            <div key={i} style={{display:'flex',gap:'0.75rem'}}>
              <span>{v.version}</span>
              <span>Effective {v.date}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const Careers = () => {
    const jobs = [
      { title:'Frontend Engineer', location:'Remote', desc:'Build performant React interfaces for trading.' },
      { title:'Backend Engineer', location:'Remote', desc:'Design scalable APIs and services.' },
      { title:'Compliance Officer', location:'Singapore', desc:'Lead compliance programs and audits.' },
    ];
    return (
      <div style={{marginTop:'1.5rem'}}>
        {jobs.map((j,i)=> (
          <div key={i} style={{padding:'1rem',border:'1px solid #eee',borderRadius:8,marginBottom:'0.75rem'}}>
            <div style={{fontWeight:700}}>{j.title}</div>
            <div style={{color:'#6c757d'}}>{j.location}</div>
            <div>{j.desc}</div>
          </div>
        ))}
      </div>
    );
  };

  const Blog = () => {
    const posts = [
      { title:'Market Update', date:'2025-11-15', excerpt:'BTC hits new highs, ETH follows.' },
      { title:'Security Best Practices', date:'2025-10-02', excerpt:'How we protect your assets.' },
    ];
    return (
      <div style={{marginTop:'1.5rem'}}>
        {posts.map((p,i)=> (
          <div key={i} style={{padding:'1rem',border:'1px solid #eee',borderRadius:8,marginBottom:'0.75rem'}}>
            <div style={{fontWeight:700}}>{p.title}</div>
            <div style={{color:'#6c757d'}}>{p.date}</div>
            <div>{p.excerpt}</div>
          </div>
        ))}
      </div>
    );
  };

  const Partners = () => {
    const partners = [
      { name:'ChainSecure', desc:'Custody and security partner' },
      { name:'FiatGate', desc:'Payments partner' },
      { name:'DataPulse', desc:'Analytics partner' },
    ];
    return (
      <div style={{marginTop:'1.5rem',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:'1rem'}}>
        {partners.map((p,i)=> (
          <div key={i} style={{padding:'1rem',border:'1px solid #eee',borderRadius:8}}>
            <div style={{fontWeight:700}}>{p.name}</div>
            <div style={{color:'#6c757d'}}>{p.desc}</div>
          </div>
        ))}
      </div>
    );
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
          {slug === 'fees' && <FeeCalculator />}
          {slug === 'docs' && <APIDocs />}
          {slug === 'status' && <SystemStatus />}
          {slug === 'staking' && <StakingSection />}
          {slug === 'contact' && <ContactForm />}
          {slug === 'help-center' && <HelpCenter />}
          {slug === 'about' && <About />}
          {slug === 'press' && <PressKit />}
          {['terms','privacy','security','compliance','licenses'].includes(slug) && <LegalDoc title={content.title} />}
          {slug === 'careers' && <Careers />}
          {slug === 'blog' && <Blog />}
          {slug === 'partners' && <Partners />}
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
