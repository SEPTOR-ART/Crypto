import { useState } from 'react';
import Head from 'next/head';
import styles from '../styles/Support.module.css';
import ChatSupport from '../components/ChatSupport';

export default function Support() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    category: 'general',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      // TODO: Implement actual form submission
      console.log('Support form submitted:', formData);
      setSubmitted(true);
      setFormData({
        name: '',
        email: '',
        subject: '',
        category: 'general',
        message: ''
      });
      
      setTimeout(() => {
        setSubmitted(false);
      }, 5000);
    } catch (err) {
      setError('Failed to submit support request. Please try again.');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const faqs = [
    {
      category: 'Account',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
          <path d="M6 21c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" strokeWidth="2"/>
        </svg>
      ),
      questions: [
        { q: 'How do I create an account?', a: 'Click the Sign Up button and fill in your details. Verify your email to activate your account.' },
        { q: 'How do I reset my password?', a: 'Click "Forgot Password" on the login page and follow the email instructions.' },
        { q: 'How do I enable 2FA?', a: 'Go to Settings > Security and enable Two-Factor Authentication using your preferred method.' }
      ]
    },
    {
      category: 'Trading',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 17l6-6 4 4 8-8" stroke="currentColor" strokeWidth="2"/>
          <path d="M17 7h4v4" stroke="currentColor" strokeWidth="2"/>
        </svg>
      ),
      questions: [
        { q: 'What are your trading fees?', a: 'We charge 0.1% maker fee and 0.2% taker fee. Volume discounts available for high-frequency traders.' },
        { q: 'What payment methods do you accept?', a: 'We accept credit cards, bank transfers, wallet balance, and gift cards.' },
        { q: 'How long do trades take to execute?', a: 'Most trades are executed instantly. Withdrawals may take 1-24 hours depending on the blockchain.' }
      ]
    },
    {
      category: 'Wallet & Security',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2"/>
          <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="2"/>
          <circle cx="12" cy="16" r="1" fill="currentColor"/>
        </svg>
      ),
      questions: [
        { q: 'How do I deposit funds?', a: 'Go to Wallet, select your cryptocurrency, and click Deposit to get your unique wallet address.' },
        { q: 'How do I withdraw funds?', a: 'Navigate to Wallet, select Withdraw, enter the amount and destination address, then confirm.' },
        { q: 'Are my funds safe?', a: 'Yes. We use cold storage, multi-signature wallets, and industry-leading security protocols.' }
      ]
    },
    {
      category: 'Verification',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2"/>
          <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" stroke="currentColor" strokeWidth="2"/>
        </svg>
      ),
      questions: [
        { q: 'Why do I need to verify my account?', a: 'KYC verification helps us comply with regulations and protect against fraud.' },
        { q: 'What documents do I need?', a: 'Government-issued ID (passport/license) and proof of address (utility bill/bank statement).' },
        { q: 'How long does verification take?', a: 'Most verifications are completed within 24 hours. Complex cases may take 2-3 business days.' }
      ]
    }
  ];

  const contactMethods = [
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="2"/>
        </svg>
      ),
      title: 'Live Chat',
      description: 'Chat with our support team',
      availability: '24/7 Available',
      action: 'Start Chat'
    },
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
          <path d="M3 7l9 6 9-6" stroke="currentColor" strokeWidth="2"/>
        </svg>
      ),
      title: 'Email Support',
      description: 'support@cryptozen.com',
      availability: 'Response within 24h',
      action: 'Send Email'
    },
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" stroke="currentColor" strokeWidth="2"/>
        </svg>
      ),
      title: 'Phone Support',
      description: '+1 (888) 123-4567',
      availability: 'Mon-Fri 9am-6pm EST',
      action: 'Call Now'
    }
  ];

  return (
    <>
      <Head>
        <title>Support & Help Center - CryptoZen</title>
        <meta name="description" content="Get help with your CryptoZen account. Contact support, browse FAQs, and find answers to common questions." />
      </Head>

      <div className={styles.container}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <span className={styles.label}>SUPPORT CENTER</span>
            <h1 className={styles.title}>How can we help you?</h1>
            <p className={styles.subtitle}>
              Get instant answers to common questions or reach out to our 24/7 support team
            </p>
            <div className={styles.searchBar}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <input 
                type="text" 
                placeholder="Search for help articles, guides, or FAQs..."
              />
            </div>
          </div>
        </section>

        {/* Contact Methods */}
        <section className={styles.contactMethods}>
          <h2 className={styles.sectionTitle}>Get in Touch</h2>
          <div className={styles.methodsGrid}>
            {contactMethods.map((method, index) => (
              <div key={index} className={styles.methodCard}>
                <div className={styles.methodIcon}>{method.icon}</div>
                <h3>{method.title}</h3>
                <p className={styles.methodDesc}>{method.description}</p>
                <span className={styles.availability}>{method.availability}</span>
                <button className={styles.methodButton}>{method.action}</button>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className={styles.faqSection}>
          <div className={styles.faqHeader}>
            <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>
            <p className={styles.sectionSubtitle}>Quick answers to common questions</p>
          </div>
          <div className={styles.faqGrid}>
            {faqs.map((category, index) => (
              <div key={index} className={styles.faqCategory}>
                <div className={styles.categoryHeader}>
                  <div className={styles.categoryIcon}>{category.icon}</div>
                  <h3>{category.category}</h3>
                </div>
                <div className={styles.questionsList}>
                  {category.questions.map((item, qIndex) => (
                    <details key={qIndex} className={styles.faqItem}>
                      <summary className={styles.question}>
                        {item.q}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                      </summary>
                      <p className={styles.answer}>{item.a}</p>
                    </details>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Contact Form */}
        <section className={styles.contactForm}>
          <div className={styles.formHeader}>
            <h2 className={styles.sectionTitle}>Submit a Support Request</h2>
            <p className={styles.sectionSubtitle}>Can&apos;t find what you&apos;re looking for? Send us a message</p>
          </div>
          
          {submitted && (
            <div className={styles.successMessage}>
              ✓ Your support request has been submitted successfully! We&apos;ll get back to you within 24 hours.
            </div>
          )}
          
          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="name">Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Your full name"
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="your.email@example.com"
                />
              </div>
            </div>
            
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="category">Category</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                >
                  <option value="general">General Inquiry</option>
                  <option value="account">Account Issues</option>
                  <option value="trading">Trading Support</option>
                  <option value="wallet">Wallet & Deposits</option>
                  <option value="verification">Verification</option>
                  <option value="technical">Technical Issues</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="subject">Subject</label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  placeholder="Brief description of your issue"
                />
              </div>
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows="6"
                placeholder="Please provide as much detail as possible about your issue..."
              />
            </div>
            
            <button type="submit" className={styles.submitButton}>
              Submit Request
            </button>
          </form>
        </section>

        <ChatSupport />
      </div>
    </>
  );
}
