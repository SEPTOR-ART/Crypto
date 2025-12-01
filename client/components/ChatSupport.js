import { useState, useRef, useEffect } from 'react';
import styles from '../styles/ChatSupport.module.css';
import { useAuth } from '../context/AuthContext';
import { createSupportMessage, getMySupportMessages } from '../services/supportService';
import Icon from './Icon';

export default function ChatSupport() {
  const loadMessages = () => {
    try {
      if (typeof window !== 'undefined') {
        const raw = window.localStorage.getItem('chat_support_messages');
        if (raw) {
          const parsed = JSON.parse(raw);
          return parsed.map(m => ({ ...m, timestamp: new Date(m.timestamp) }));
        }
      }
    } catch {}
    return null;
  };
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(() => loadMessages() || [
    { id: 1, text: "Hello! How can I help you today?", sender: 'support', timestamp: new Date() }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [typing, setTyping] = useState(false);
  const [unread, setUnread] = useState(0);
  const messagesEndRef = useRef(null);
  const listRef = useRef(null);
  const autoScrollRef = useRef(true);

  const toggleChat = () => {
    const next = !isOpen;
    setIsOpen(next);
    if (next) setUnread(0);
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (inputValue.trim() === '') return;

    // Add user message
    const userMessage = {
      id: Date.now(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setTyping(true);
    // Persist to backend when authenticated
    if (user) {
      createSupportMessage({ text: userMessage.text }).catch(() => {});
    }
    setTimeout(() => {
      const responses = [
        "Thanks for your message. Our team will get back to you shortly.",
        "I understand your concern. Let me check that for you.",
        "Could you please provide more details about your issue?",
        "I've forwarded your request to our technical team.",
        "Is there anything else I can assist you with today?"
      ];
      const reply = responses[Math.floor(Math.random() * responses.length)];
      const supportMessage = {
        id: Date.now() + 1,
        text: reply,
        sender: 'support',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, supportMessage]);
      setTyping(false);
      if (!isOpen) setUnread(u => u + 1);
    }, 1000);
  };

  const scrollToBottom = () => {
    if (autoScrollRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Load history from backend when chat opens and user authenticated
    const load = async () => {
      if (user && isOpen) {
        try {
          const serverMessages = await getMySupportMessages();
          if (Array.isArray(serverMessages) && serverMessages.length > 0) {
            const hydrated = serverMessages.flatMap(m => [
              { id: m._id, text: m.text, sender: 'user', timestamp: new Date(m.createdAt) },
              ...((m.replies || []).map(r => ({ id: `${m._id}-${r.timestamp}`, text: r.text, sender: r.sender, timestamp: new Date(r.timestamp) })))
            ]);
            hydrated.sort((a, b) => a.timestamp - b.timestamp);
            setMessages(hydrated);
          }
        } catch {}
      }
    };
    load();
  }, [isOpen, user]);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('chat_support_messages', JSON.stringify(messages));
      }
    } catch {}
  }, [messages]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }
  }, [isOpen]);

  const onInputKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      return sendMessage(e);
    }
  };

  const onScroll = () => {
    if (!listRef.current) return;
    const el = listRef.current;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
    autoScrollRef.current = nearBottom;
  };

  return (
    <div className={styles.chatContainer}>
      {isOpen ? (
        <div className={styles.chatWindow} role="dialog" aria-modal="true" aria-labelledby="chat-title">
          <div className={styles.chatHeader}>
            <h3 id="chat-title">Customer Support</h3>
            <button onClick={toggleChat} className={styles.closeButton} aria-label="Close chat">×</button>
          </div>
          
          <div ref={listRef} onScroll={onScroll} className={styles.messagesContainer} aria-live="polite">
            {messages.map(message => (
              <div 
                key={message.id} 
                className={`${styles.message} ${styles[message.sender]}`}
              >
                <div className={styles.messageContent}>
                  {message.text}
                </div>
                <div className={styles.timestamp}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
            {typing && (
              <div className={`${styles.message} ${styles.support}`}>
                <div className={styles.typingIndicator} aria-live="polite">Support is typing…</div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <form onSubmit={sendMessage} className={styles.inputContainer}>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={onInputKeyDown}
              placeholder="Type your message..."
              className={styles.messageInput}
            />
            <button type="submit" className={styles.sendButton}>Send</button>
          </form>
        </div>
      ) : (
        <button onClick={toggleChat} className={styles.chatButton} aria-label="Open support chat">
          <Icon name="chat" size={24} color="#fff" />
          <span>Support</span>
          {unread > 0 && <span className={styles.badge} aria-label={`${unread} new messages`}>{unread}</span>}
        </button>
      )}
    </div>
  );
}
