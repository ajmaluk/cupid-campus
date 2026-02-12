import { useState, useMemo, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { PageTransition } from '../components/PageTransition';
import { Search, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface ChatPreview {
  lastMsg: string;
  time: Date;
  unread: boolean;
}

export default function Chat() {
  const { matches, currentUser } = useStore();
  const [search, setSearch] = useState('');
  const [chatDetails, setChatDetails] = useState<Record<string, ChatPreview>>({});
  const navigate = useNavigate();

  // Fetch last messages for previews
  useEffect(() => {
    const fetchLastMessages = async () => {
      if (matches.length === 0) return;

      const details: Record<string, ChatPreview> = {};
      
      await Promise.all(matches.map(async (match) => {
        const { data } = await supabase
          .from('messages')
          .select('content, created_at, is_read, sender_id')
          .eq('match_id', match.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data) {
          details[match.id] = {
            lastMsg: data.content,
            time: new Date(data.created_at),
            unread: !data.is_read && data.sender_id !== currentUser?.id
          };
        }
      }));
      
      setChatDetails(details);
    };

    fetchLastMessages();
  }, [matches, currentUser]);

  // Sort by latest message
  const chats = useMemo(() => {
    return matches.map(match => {
      const detail = chatDetails[match.id];
      // Default to match creation date if no messages
      const timestamp = detail?.time || new Date(match.created_at);
      
      return {
        ...match,
        lastMsg: detail?.lastMsg || "Start a conversation",
        time: timestamp.toLocaleDateString(),
        timestamp: timestamp, 
        unread: detail?.unread || false
      };
    }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [matches, chatDetails]);

  const filteredChats = chats.filter(c => c.profile?.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <PageTransition>
      <div className="min-h-screen bg-background pb-32 px-6 pt-6 max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Messages</h1>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
          <input 
            type="text" 
            placeholder="Search matches..." 
            className="w-full bg-gray-900 border border-gray-800 rounded-2xl py-3 pl-12 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-primary/50 transition-all"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* New Matches (Horizontal Scroll) */}
        <div className="mb-8">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">New Matches</h2>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {matches.length > 0 ? matches.map(match => (
              <div 
                key={match.id} 
                className="flex flex-col items-center gap-2 min-w-[70px] cursor-pointer active:scale-95 transition-transform"
                onClick={() => navigate(`/chat/${match.id}`)}
              >
                <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-primary to-purple-500">
                  <img src={match.profile?.primary_photo} className="w-full h-full rounded-full object-cover border-2 border-background" />
                </div>
                <span className="text-xs font-medium truncate w-full text-center">{match.profile?.name}</span>
              </div>
            )) : (
              <p className="text-sm text-gray-500">No matches yet.</p>
            )}
          </div>
        </div>

        {/* Messages List */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Conversations</h2>
          {filteredChats.length > 0 ? filteredChats.map(chat => (
            <div 
              key={chat.id} 
              className="flex items-center gap-4 p-4 bg-gray-900/50 rounded-2xl border border-white/5 active:scale-98 transition-transform cursor-pointer hover:bg-gray-800/50"
              onClick={() => navigate(`/chat/${chat.id}`)}
            >
              <div className="relative">
                <img src={chat.profile?.primary_photo} className="w-14 h-14 rounded-full object-cover" />
                {chat.unread && <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full border-2 border-background" />}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-bold text-white">{chat.profile?.name}</h3>
                  <span className="text-xs text-gray-500">{chat.time}</span>
                </div>
                <p className={`text-sm truncate ${chat.unread ? 'text-white font-medium' : 'text-gray-400'}`}>
                  {chat.lastMsg}
                </p>
              </div>
            </div>
          )) : (
            <div className="text-center py-10 text-gray-500">
              <MessageCircle size={48} className="mx-auto mb-4 opacity-20" />
              <p>No messages yet. Get swiping!</p>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
