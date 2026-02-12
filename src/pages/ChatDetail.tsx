import { useState, useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { PageTransition } from '../components/PageTransition';
import { ArrowLeft, Send, Smile, MoreVertical } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Message } from '../types';
import { supabase } from '../lib/supabase';

export default function ChatDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { matches, currentUser } = useStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const match = matches.find(m => m.id.toString() === id);
  const profile = match?.profile;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Real-time Subscription
  useEffect(() => {
    if (!id) return;

    // Load initial messages
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', id)
        .order('created_at', { ascending: true });
      if (data) setMessages(data);
    };
    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`chat:${id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `match_id=eq.${id}`
      }, (payload: { new: Message }) => {
        setMessages(prev => [...prev, payload.new]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() || !currentUser) return;
    
    // Send to Supabase
    const { error } = await supabase
      .from('messages')
      .insert({
        match_id: Number(id),
        sender_id: currentUser.id,
        content: inputText
      });

    if (error) {
      console.error('Error sending message:', error);
      return;
    }

    // Optimistic update is handled by subscription, but for instant feedback we can add it
    // However, since we have real-time subscription, let's rely on that to avoid duplicates
    // or we can add it optimistically and filter duplicates. 
    // For now, let's trust the subscription for "correctness".
    setInputText('');
  };

  if (!profile) return null;

  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString();
  };

  return (
    <PageTransition>
      <div className="flex flex-col h-full bg-background relative">
        {/* Header */}
        <div className="flex items-center gap-4 p-4 border-b border-white/5 bg-gray-900/80 backdrop-blur-md sticky top-0 z-10 shadow-sm">
          <button onClick={() => navigate('/chat')} className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={24} />
          </button>
          
          <div className="flex-1 flex items-center gap-3 cursor-pointer" onClick={() => navigate('/profile/' + profile.id)}>
            <div className="relative">
              <img src={profile.primary_photo} className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-800" />
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900" />
            </div>
            <div>
              <h2 className="font-bold text-white leading-none mb-0.5">{profile.name}</h2>
              <span className="text-xs text-green-500 font-medium">Online now</span>
            </div>
          </div>

          <button className="text-gray-400 hover:text-white">
            <MoreVertical size={20} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, index) => {
            const isMe = msg.sender_id === currentUser?.id;
            const showDateHeader = index === 0 || 
              formatMessageDate(messages[index - 1].created_at) !== formatMessageDate(msg.created_at);

            return (
              <div key={msg.id}>
                {showDateHeader && (
                   <div className="text-center text-xs text-gray-500 my-4">
                     {formatMessageDate(msg.created_at)}
                   </div>
                )}
                <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                    isMe 
                      ? 'bg-primary text-white rounded-br-none' 
                      : 'bg-gray-800 text-gray-200 rounded-bl-none'
                  }`}>
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                    <span className={`text-[10px] block mt-1 opacity-70 ${isMe ? 'text-primary-foreground' : 'text-gray-400'}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-gray-900/60 border-t border-white/5 backdrop-blur-xl pb-safe">
          <div className="flex items-center gap-2 bg-gray-800/80 rounded-full px-4 py-2 border border-gray-700/50 focus-within:border-primary/50 focus-within:bg-gray-800 transition-all shadow-lg">
            <button className="text-gray-400 hover:text-yellow-400 transition-colors p-1">
              <Smile size={24} />
            </button>
            <input 
              type="text" 
              className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-gray-500 h-10"
              placeholder="Type a message..."
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
            />
            <button 
              onClick={handleSend}
              disabled={!inputText.trim()}
              className={`p-2 rounded-full transition-all ${
                inputText.trim() 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-100' 
                  : 'bg-gray-700 text-gray-500 scale-90'
              }`}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
