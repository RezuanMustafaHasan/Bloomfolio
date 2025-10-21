import React, { useEffect, useMemo, useRef, useState } from 'react';
import { stockAPI, aiAPI } from '../services/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './AIFinancialAdvisor.css';

function AIFinancialAdvisor() {
  const [allStocks, setAllStocks] = useState([]);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [selectorQuery, setSelectorQuery] = useState('');
  const [selectedStocks, setSelectedStocks] = useState([]); // { tradingCode, companyName }

  const [messages, setMessages] = useState([
    { from: 'ai', text: 'Hi! I am your AI Financial Advisor. Select some stocks and ask me anything about them, like risk, diversification, or valuation trends.', ts: Date.now() }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const chatRef = useRef(null);
  const queryInputRef = useRef(null);

  useEffect(() => {
    let ignore = false;
    (async () => {
      const res = await stockAPI.getAllStocks();
      if (!ignore && res?.success) {
        setAllStocks(Array.isArray(res.data) ? res.data : []);
      }
    })();
    return () => { ignore = true; };
  }, []);

  useEffect(() => {
    if (!chatRef.current) return;
    chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, isTyping]);

  const matches = useMemo(() => {
    const q = selectorQuery.trim().toLowerCase();
    if (!q) return allStocks.slice(0, 10);
    return allStocks
      .filter(s => (
        s.tradingCode?.toLowerCase().includes(q) ||
        s.companyName?.toLowerCase().includes(q) ||
        s.sector?.toLowerCase().includes(q)
      ))
      .slice(0, 10);
  }, [selectorQuery, allStocks]);

  const addStock = (stock) => {
    if (!stock?.tradingCode) return;
    setSelectedStocks(prev => {
      if (prev.some(s => s.tradingCode === stock.tradingCode)) return prev;
      return [...prev, { tradingCode: stock.tradingCode, companyName: stock.companyName }];
    });
    setSelectorOpen(false);
    setSelectorQuery('');
  };

  const removeStock = (code) => {
    setSelectedStocks(prev => prev.filter(s => s.tradingCode !== code));
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;
    setMessages(prev => [...prev, { from: 'user', text, ts: Date.now() }]);
    setInput('');

    const tradingCodes = selectedStocks.map(s => s.tradingCode);
    if (tradingCodes.length === 0) {
      setMessages(prev => [...prev, { from: 'ai', text: 'Please add at least one stock (e.g., SIBL, BRACBANK) to build context before asking questions.', ts: Date.now() }]);
      return;
    }

    // Call backend AI chat
    setIsTyping(true);
    let res = await aiAPI.chat({ tradingCodes, question: text, model: 'gemini-2.5-flash' });

    // If first attempt fails, try one quick retry (handles transient errors)
    if (!res?.success) {
      await new Promise(r => setTimeout(r, 500));
      res = await aiAPI.chat({ tradingCodes, question: text, model: 'gemini-2.5-flash' });
    }

    setIsTyping(false);

    if (res?.success && res?.data?.answer) {
      setMessages(prev => [...prev, { from: 'ai', text: res.data.answer, ts: Date.now() }]);
    } else {
      const errText = res?.message || res?.error || 'Unable to get AI response right now.';
      setMessages(prev => [...prev, { from: 'ai', text: `Sorry, I ran into an issue: ${errText}`, ts: Date.now() }]);
    }
  };

  const onKeyDownInput = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const onKeyDownSelector = (e) => {
    if (e.key === 'Escape') {
      setSelectorOpen(false);
    }
  };

  return (
    <div className="advisor-page" aria-label="AI Financial Advisor Page">
      <div className="advisor-card" role="region" aria-labelledby="advisor-title">
        {/* Header */}
        <header className="advisor-header">
          <div className="advisor-titles">
            <h1 id="advisor-title">AI Financial Advisor</h1>
            <p className="advisor-subtitle">Get AI-driven insights on selected stocks. Build context, ask questions, and explore strategy ideas.</p>
          </div>
        </header>

        {/* Context Builder */}
        <section className="context-builder" aria-label="Context Builder">
          <div className="selector">
            <label htmlFor="stock-combobox" className="selector-label">Add stocks</label>
            <div className="selector-combobox" role="combobox" aria-expanded={selectorOpen} aria-owns="stock-listbox" aria-haspopup="listbox">
              <input
                id="stock-combobox"
                ref={queryInputRef}
                type="text"
                className="selector-input"
                placeholder="Search stock by code, name, or sector"
                value={selectorQuery}
                onChange={(e) => { setSelectorQuery(e.target.value); setSelectorOpen(true); }}
                onFocus={() => setSelectorOpen(true)}
                onKeyDown={onKeyDownSelector}
                aria-autocomplete="list"
                aria-controls="stock-listbox"
                aria-label="Stock search input"
              />
              {selectorOpen && (
                <ul id="stock-listbox" role="listbox" className="selector-dropdown" aria-label="Available stocks">
                  {matches.length === 0 && (
                    <li className="dropdown-empty" role="option" aria-disabled="true">No matches</li>
                  )}
                  {matches.map((s) => (
                    <li
                      key={s.tradingCode}
                      role="option"
                      tabIndex={0}
                      className="dropdown-item"
                      onClick={() => addStock(s)}
                      onKeyDown={(e) => { if (e.key === 'Enter') addStock(s); }}
                      aria-label={`Add ${s.companyName || s.tradingCode}`}
                    >
                      <span className="code">{s.tradingCode}</span>
                      <span className="name">{s.companyName}</span>
                      <span className="sector">{s.sector}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {selectedStocks.length > 0 && (
            <div className="selected-pills" aria-label="Selected stocks">
              {selectedStocks.map(s => (
                <div key={s.tradingCode} className="pill" aria-label={`${s.tradingCode} selected`}>
                  <span className="pill-code">{s.tradingCode}</span>
                  <button
                    className="pill-remove"
                    onClick={() => removeStock(s.tradingCode)}
                    aria-label={`Remove ${s.tradingCode}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Chat Interface */}
        <section className="chat-section" aria-label="Chat Interface">
          <div className="chat-window" ref={chatRef} aria-live="polite" aria-relevant="additions">
            {messages.map((m, idx) => (
              <MessageBubble key={idx} from={m.from} text={m.text} />
            ))}
            {isTyping && (
              <TypingIndicator />
            )}
          </div>

          {/* Input Controls */}
          <div className="chat-inputbar" role="form" aria-label="Chat input">
            <textarea
              className="chat-input"
              placeholder="Type your question…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDownInput}
              rows={1}
              aria-label="Message input"
            />
            <button className="send-btn" onClick={sendMessage} aria-label="Send message" disabled={isTyping}>
              <SendIcon />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function MessageBubble({ from, text }) {
  const isUser = from === 'user';
  return (
    <div className={`msg-row ${isUser ? 'user' : 'ai'}`}>
      <div className={`msg-bubble ${isUser ? 'user' : 'ai'}`}>
        {isUser ? (
          text
        ) : (
          <div className="msg-markdown">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" />,
              }}
            >
              {text}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="msg-row ai" role="status" aria-label="AI is typing">
      <div className="typing">
        <span className="dot"></span>
        <span className="dot"></span>
        <span className="dot"></span>
      </div>
    </div>
  );
}

function SendIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 12l18-9-6 18-4-7-7-2z" fill="currentColor" />
    </svg>
  );
}

export default AIFinancialAdvisor;