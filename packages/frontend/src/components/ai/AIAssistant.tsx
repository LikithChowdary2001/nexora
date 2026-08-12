import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { AIAssistantMessage } from '@nexora/shared';

const AI_TIMEOUT_MS = 120_000;

export function AIAssistant() {
  const { profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AIAssistantMessage[]>([]);
  const [input, setInput] = useState('');
  const [slowHint, setSlowHint] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const slowTimerRef = useRef<number | null>(null);

  const clearSlowTimer = () => {
    if (slowTimerRef.current !== null) {
      window.clearTimeout(slowTimerRef.current);
      slowTimerRef.current = null;
    }
    setSlowHint('');
  };

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      slowTimerRef.current = window.setTimeout(() => {
        setSlowHint('Server is waking up — this can take up to a minute on free tier…');
      }, 5000);

      try {
        const { data } = await api.post(
          '/ai/chat',
          { message, language: profile?.language || 'en' },
          { timeout: AI_TIMEOUT_MS }
        );
        if (!data?.success) {
          throw new Error(data?.error || 'AI request failed');
        }
        if (!data?.data?.message) {
          throw new Error('Empty response from AI');
        }
        return data.data;
      } finally {
        clearSlowTimer();
      }
    },
    onError: (err: unknown) => {
      clearSlowTimer();
      const axiosErr = err as { response?: { data?: { error?: string; code?: string } }; code?: string; message?: string };
      const serverMsg = axiosErr.response?.data?.error;
      const code = axiosErr.response?.data?.code;
      let content = 'Sorry, I could not respond right now. Please try again in a moment.';
      if (axiosErr.code === 'ECONNABORTED' || axiosErr.message?.includes('timeout')) {
        content = 'Request timed out. The server may still be waking up — please try again.';
      } else if (code === 'AI_NOT_CONFIGURED') {
        content = 'AI assistant is not configured on the server yet (OPENAI_API_KEY missing on Render).';
      } else if (serverMsg) {
        content = serverMsg;
      }
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-error`,
          role: 'assistant',
          content,
          timestamp: new Date().toISOString(),
        },
      ]);
    },
    onSuccess: (response) => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: response.message,
          timestamp: new Date().toISOString(),
          articleContext: response.sources,
        },
      ]);
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, slowHint]);

  useEffect(() => () => clearSlowTimer(), []);

  const handleSend = () => {
    if (!input.trim() || chatMutation.isPending) return;

    const userMessage: AIAssistantMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    chatMutation.mutate(input.trim());
    setInput('');
  };

  const sendSuggestion = (text: string) => {
    if (chatMutation.isPending) return;
    const userMessage: AIAssistantMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    chatMutation.mutate(text);
  };

  const suggestions = [
    "Summarize today's AI news",
    'Explain this article',
    'Compare two companies',
    "Explain like I'm 10",
  ];

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 text-white shadow-lg shadow-indigo-500/30 flex items-center justify-center hover:scale-105 transition-transform"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Open AI Assistant"
      >
        <Sparkles className="h-6 w-6" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-50 w-96 max-h-[600px] rounded-2xl border bg-card shadow-2xl shadow-indigo-500/10 flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-indigo-400" />
                <span className="font-semibold">AI Assistant</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px] max-h-[400px]">
              {messages.length === 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground text-center mb-4">
                    Ask me anything about the news
                  </p>
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => sendSuggestion(s)}
                      className="w-full text-left text-sm p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white'
                        : 'bg-muted'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {chatMutation.isPending && (
                <div className="flex flex-col gap-2 items-start">
                  <div className="bg-muted rounded-2xl px-4 py-2.5 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Thinking…</span>
                  </div>
                  {slowHint && (
                    <p className="text-xs text-muted-foreground px-1">{slowHint}</p>
                  )}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t">
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask anything about the news..."
                  className="flex-1 h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  disabled={chatMutation.isPending}
                />
                <Button size="icon" variant="gradient" onClick={handleSend} disabled={chatMutation.isPending}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
