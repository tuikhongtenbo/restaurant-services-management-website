import React, { useState, useRef, useEffect } from 'react';
import styles from './chatbot.module.css';

interface Message {
  role: 'bot' | 'user';
  text: string;
}

const INITIAL_MESSAGES: Message[] = [
  { role: 'bot', text: 'Chào mừng bạn đã đến với nhà hàng Artiste! 👋' },
  { 
    role: 'bot', 
    text: 'Thông tin liên hệ của chúng tôi:\n📍 123 Trần Hưng Đạo, Quận 1, Hồ Chí Minh\n📞 (+84) 123 456 789\n✉️ hello@artiste.vn\n⏰ Giờ mở cửa: 10:30 am - 11:00 pm'
  }
];

const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleToggle = () => setIsOpen(!isOpen);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage = inputValue.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'bot', text: data.answer }]);
    } catch (error) {
      console.error('Error connecting to AI service:', error);
      setMessages(prev => [...prev, { role: 'bot', text: 'Xin lỗi, tôi đang gặp sự cố kết nối. Vui lòng thử lại sau.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className={styles.chatbotContainer}>
      {/* Chat Window */}
      {isOpen && (
        <div className={styles.chatWindow}>
          <div className={styles.chatHeader}>
            <div className={styles.headerInfo}>
              <div className={styles.headerIcon}>
                <i className="fa-solid fa-robot"></i>
              </div>
              <div>
                <h3 className={styles.headerTitle}>Artiste Assistant</h3>
                <p className={styles.headerSubtitle}>Sẵn sàng hỗ trợ 24/7</p>
              </div>
            </div>
            <button className={styles.closeButton} onClick={handleToggle}>
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div className={styles.chatMessages}>
            {messages.map((msg, index) => (
              <div key={index} className={`${styles.messageWrapper} ${styles[msg.role]}`}>
                <div className={`${styles.avatar} ${styles[msg.role]}`}>
                  <i className={msg.role === 'bot' ? 'fa-solid fa-robot' : 'fa-solid fa-user'}></i>
                </div>
                <div className={`${styles.messageBubble} ${styles[msg.role]}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className={`${styles.messageWrapper} ${styles.bot}`}>
                <div className={`${styles.avatar} ${styles.bot}`}>
                  <i className="fa-solid fa-robot"></i>
                </div>
                <div className={`${styles.messageBubble} ${styles.bot}`}>
                  <div className={styles.typingIndicator}>
                    <span className={styles.dot}></span>
                    <span className={styles.dot}></span>
                    <span className={styles.dot}></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className={styles.chatInputContainer}>
            <input
              type="text"
              className={styles.chatInput}
              placeholder="Nhập tin nhắn..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
            />
            <button 
              className={styles.sendButton} 
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
            >
              <i className="fa-solid fa-paper-plane"></i>
            </button>
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      {!isOpen && (
        <button className={styles.toggleButton} onClick={handleToggle}>
          <i className="fa-solid fa-message"></i>
        </button>
      )}
    </div>
  );
};

export default Chatbot;
