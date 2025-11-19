import { useState, useRef, useEffect } from 'react';
import styles from '../styles/ChatSupport.module.css';
import Icon from './Icon';

export default function ChatSupport() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: "Hello! How can I help you today?", sender: 'support', timestamp: new Date() }
  ]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (inputValue.trim() === '') return;

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages([...messages, userMessage]);
    setInputValue('');

    // Simulate support response after a delay
    setTimeout(() => {
      const supportResponses = [
        "Thanks for your message. Our team will get back to you shortly.",
        "I understand your concern. Let me check that for you.",
        "Could you please provide more details about your issue?",
        "I've forwarded your request to our technical team.",
        "Is there anything else I can assist you with today?"
      ];
      
      const randomResponse = supportResponses[Math.floor(Math.random() * supportResponses.length)];
      
      const supportMessage = {
        id: messages.length + 2,
        text: randomResponse,
        sender: 'support',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, supportMessage]);
    }, 1000);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className={styles.chatContainer}>
      {isOpen ? (
        <div className={styles.chatWindow}>
          <div className={styles.chatHeader}>
            <h3>Customer Support</h3>
            <button onClick={toggleChat} className={styles.closeButton}>×</button>
          </div>
          
          <div className={styles.messagesContainer}>
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
            <div ref={messagesEndRef} />
          </div>
          
          <form onSubmit={sendMessage} className={styles.inputContainer}>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
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
        </button>
      )}
    </div>
  );
}