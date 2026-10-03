import { useState } from 'react';
import toast from 'react-hot-toast';
import { askAssistant } from '../api/assistant';
import { userError } from '../utils/userErrors';

const suggestions = [
  'Make me a 30-minute study plan for today.',
  'Explain spaced repetition in simple terms.',
  'Help me break a difficult topic into smaller tasks.'
];

export default function Assistant() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [pending, setPending] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    const prompt = message.trim();
    if (!prompt || pending) return;

    setMessages((current) => [...current, { role: 'user', text: prompt }]);
    setMessage('');
    setPending(true);
    try {
      const { data } = await askAssistant(prompt);
      setMessages((current) => [...current, { role: 'assistant', text: data.answer }]);
    } catch (error) {
      const errorMessage = userError(error, 'The assistant could not respond. Check that Gemini is configured.');
      toast.error(errorMessage);
      setMessages((current) => [...current, { role: 'error', text: errorMessage }]);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="assistant-page page-enter">
      <div className="assistant-heading">
        <div><p className="eyebrow">Your study co-pilot</p><h1>Ask StudyMind</h1><p className="lede">Get clear explanations, practical plans, and encouragement when you need it.</p></div>
        <div className="assistant-orb" aria-hidden="true">✦</div>
      </div>
      <div className="assistant-card">
        <div className="assistant-messages" aria-live="polite">
          {messages.length === 0 && <div className="assistant-welcome"><span className="assistant-spark">✦</span><h2>What are you working on?</h2><p>Try a prompt below or ask anything about your learning.</p><div className="assistant-suggestions">{suggestions.map((suggestion) => <button key={suggestion} type="button" onClick={() => setMessage(suggestion)}>{suggestion}</button>)}</div></div>}
          {messages.map((item, index) => <div className={`assistant-message ${item.role}`} key={`${item.role}-${index}`}><span>{item.role === 'user' ? 'You' : 'StudyMind'}</span><p>{item.text}</p></div>)}
          {pending && <div className="assistant-message assistant"><span>StudyMind</span><p className="assistant-thinking">Thinking<span>.</span><span>.</span><span>.</span></p></div>}
        </div>
        <form className="assistant-composer" onSubmit={submit}><textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Ask for a plan, explanation, or study idea..." maxLength={2000} rows={2} aria-label="Message StudyMind Assistant" /><button className="primary-button" disabled={pending || !message.trim()}>{pending ? 'Thinking...' : 'Ask assistant'} <span>→</span></button></form>
        <small className="assistant-disclaimer">AI can make mistakes. Verify important information.</small>
      </div>
    </div>
  );
}
