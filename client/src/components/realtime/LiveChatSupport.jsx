import React, { useState, useRef, useEffect } from 'react';
import { useRealTimeChat } from '../../hooks/useSocket';

const LiveChatSupport = ({ roomId = 'support', isAdmin = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  
  const { messages, typingUsers, sendMessage, startTyping, stopTyping } = useRealTimeChat(roomId);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (messageInput.trim()) {
      sendMessage(messageInput.trim());
      setMessageInput('');
      handleStopTyping();
    }
  };

  const handleInputChange = (e) => {
    setMessageInput(e.target.value);
    
    if (!isTyping) {
      setIsTyping(true);
      startTyping();
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      handleStopTyping();
    }, 1000);
  };

  const handleStopTyping = () => {
    if (isTyping) {
      setIsTyping(false);
      stopTyping();
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getUserInitials = (email) => {
    return email?.split('@')[0]?.substring(0, 2)?.toUpperCase() || 'U';
  };

  const getUserColor = (email) => {
    const colors = [
      'bg-primary', 'bg-success', 'bg-info', 'bg-warning', 
      'bg-danger', 'bg-secondary', 'bg-dark'
    ];
    const hash = email?.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        className={`btn btn-primary position-fixed ${messages.length > 0 ? 'pulse' : ''}`}
        style={{ 
          bottom: '20px', 
          right: '20px', 
          zIndex: 1050,
          borderRadius: '50%',
          width: '60px',
          height: '60px',
          fontSize: '24px'
        }}
        onClick={() => setIsOpen(!isOpen)}
        title="Live Chat Support"
      >
        💬
        {messages.length > 0 && !isOpen && (
          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
            {messages.length}
          </span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div 
          className="card position-fixed shadow-lg"
          style={{ 
            bottom: '90px', 
            right: '20px', 
            width: '350px', 
            height: '500px',
            zIndex: 1040
          }}
        >
          {/* Chat Header */}
          <div className="card-header d-flex justify-content-between align-items-center bg-primary text-white">
            <div>
              <h6 className="mb-0">💬 Live Support</h6>
              <small className="opacity-75">
                {isAdmin ? 'Admin Chat' : 'Customer Support'}
              </small>
            </div>
            <button
              className="btn-close btn-close-white btn-sm"
              onClick={() => setIsOpen(false)}
            ></button>
          </div>

          {/* Messages Area */}
          <div 
            className="card-body p-2"
            style={{ 
              height: '350px', 
              overflowY: 'auto',
              backgroundColor: '#f8f9fa'
            }}
          >
            {messages.length === 0 ? (
              <div className="text-center text-muted mt-4">
                <div className="mb-2">💬</div>
                <div>Start a conversation</div>
                <small>We're here to help!</small>
              </div>
            ) : (
              <div className="messages-container">
                {messages.map((message, index) => (
                  <div key={index} className="mb-3">
                    <div className="d-flex align-items-start">
                      <div 
                        className={`rounded-circle text-white d-flex align-items-center justify-content-center me-2 ${getUserColor(message.userEmail)}`}
                        style={{ width: '32px', height: '32px', fontSize: '12px' }}
                      >
                        {getUserInitials(message.userEmail)}
                      </div>
                      <div className="flex-grow-1">
                        <div className="d-flex align-items-center mb-1">
                          <small className="fw-semibold text-muted">
                            {message.userEmail?.split('@')[0]}
                          </small>
                          {message.userRole === 'admin' && (
                            <span className="badge bg-warning text-dark ms-1" style={{ fontSize: '10px' }}>
                              Admin
                            </span>
                          )}
                          <small className="text-muted ms-auto">
                            {formatTime(message.timestamp)}
                          </small>
                        </div>
                        <div 
                          className="bg-white rounded p-2 shadow-sm"
                          style={{ fontSize: '14px' }}
                        >
                          {message.message}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Typing Indicators */}
                {typingUsers.length > 0 && (
                  <div className="mb-3">
                    <div className="d-flex align-items-center">
                      <div className="typing-indicator me-2">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                      <small className="text-muted">
                        {typingUsers.length === 1 
                          ? `Someone is typing...`
                          : `${typingUsers.length} people are typing...`
                        }
                      </small>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Message Input */}
          <div className="card-footer p-2">
            <form onSubmit={handleSendMessage}>
              <div className="input-group">
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Type your message..."
                  value={messageInput}
                  onChange={handleInputChange}
                  onBlur={handleStopTyping}
                />
                <button 
                  type="submit" 
                  className="btn btn-primary btn-sm"
                  disabled={!messageInput.trim()}
                >
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .pulse {
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(0, 123, 255, 0.7);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(0, 123, 255, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(0, 123, 255, 0);
          }
        }

        .typing-indicator {
          display: flex;
          align-items: center;
          gap: 2px;
        }

        .typing-indicator span {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background-color: #6c757d;
          animation: typing 1.4s infinite ease-in-out;
        }

        .typing-indicator span:nth-child(1) {
          animation-delay: -0.32s;
        }

        .typing-indicator span:nth-child(2) {
          animation-delay: -0.16s;
        }

        @keyframes typing {
          0%, 80%, 100% {
            transform: scale(0.8);
            opacity: 0.5;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }

        .messages-container {
          max-height: 100%;
        }
      `}</style>
    </>
  );
};

export default LiveChatSupport;