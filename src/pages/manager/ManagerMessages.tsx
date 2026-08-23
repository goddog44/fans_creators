import { useEffect, useState, useRef } from 'react';
import { Send, ArrowLeft, Search } from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { PageHeader } from '@/components/shared/StatCard';
import { Avatar } from '@/components/ui/Avatar';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { EmptyState, LoadingState } from '@/components/ui/States';
import { useAuth } from '@/context/AuthContext';
import { messageService, userService } from '@/services';
import type { Conversation, Message, User as UserType } from '@/types';
import { formatTimeAgo } from '@/lib/format';
import { managerNavItems } from '@/lib/nav';

export function ManagerMessages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [participants, setParticipants] = useState<Record<string, UserType>>({});
  const [activeConv, setActiveConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    messageService.getConversations(user.id).then(async (convs) => {
      setConversations(convs);
      const ids = new Set(convs.flatMap((c) => c.participantIds.filter((id) => id !== user.id)));
      const users = await Promise.all([...ids].map((id) => userService.getById(id)));
      const map: Record<string, UserType> = {};
      users.forEach((u) => { if (u) map[u.id] = u; });
      setParticipants(map);
      setLoading(false);
    });
  }, [user]);

  useEffect(() => {
    if (activeConv) {
      messageService.getMessages(activeConv).then((msgs) => {
        setMessages(msgs);
        messageService.markRead(activeConv, user?.id || '');
      });
    }
  }, [activeConv, user]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async () => {
    if (!text.trim() || !activeConv || !user) return;
    const msg = await messageService.sendMessage(activeConv, user.id, { type: 'TEXT', text });
    setMessages((prev) => [...prev, msg]);
    setText('');
  };

  if (loading) return <DashboardShell navItems={managerNavItems} brandColor="accent"><LoadingState /></DashboardShell>;

  return (
    <DashboardShell navItems={managerNavItems} brandColor="accent">
      <PageHeader title="Messages" subtitle="Communicate with your models" />

      <div className="bg-white rounded-2xl border border-ink-200/60 shadow-soft overflow-hidden h-[calc(100vh-220px)] min-h-[500px] flex">
        <div className={`w-full sm:w-80 border-r border-ink-100 flex flex-col ${showMobileChat ? 'hidden sm:flex' : 'flex'}`}>
          <div className="p-3 border-b border-ink-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
              <Input placeholder="Search..." className="pl-9 h-9 text-sm" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {conversations.length === 0 ? <EmptyState title="No conversations" /> : conversations.map((conv) => {
              const otherId = conv.participantIds.find((id) => id !== user?.id);
              const other = otherId ? participants[otherId] : null;
              return (
                <button key={conv.id} onClick={() => { setActiveConv(conv.id); setShowMobileChat(true); }} className={`w-full flex items-center gap-3 p-3 border-b border-ink-50 text-left ${activeConv === conv.id ? 'bg-accent-50' : 'hover:bg-ink-50'}`}>
                  <Avatar src={other?.avatar || ''} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-ink-900 truncate">{other?.name}</p>
                    <p className="text-xs text-ink-500">{formatTimeAgo(conv.lastMessageAt)}</p>
                  </div>
                  {conv.unreadCount > 0 && <span className="w-2 h-2 bg-accent-500 rounded-full" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className={`flex-1 flex flex-col ${showMobileChat ? 'flex' : 'hidden sm:flex'}`}>
          {!activeConv ? (
            <div className="flex-1 flex items-center justify-center"><EmptyState title="Select a conversation" /></div>
          ) : (
            <>
              <div className="h-14 border-b border-ink-100 flex items-center gap-3 px-4">
                <button onClick={() => setShowMobileChat(false)} className="sm:hidden p-1"><ArrowLeft className="w-5 h-5" /></button>
                {(() => {
                  const otherId = conversations.find((c) => c.id === activeConv)?.participantIds.find((id) => id !== user?.id);
                  const other = otherId ? participants[otherId] : null;
                  return <><Avatar src={other?.avatar || ''} size="sm" /><p className="font-semibold text-sm">{other?.name}</p></>;
                })()}
              </div>
              <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3 bg-ink-50/50">
                {messages.map((msg) => {
                  const isMe = msg.senderId === user?.id;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`rounded-2xl px-4 py-2.5 max-w-[75%] ${isMe ? 'bg-accent-600 text-white' : 'bg-white border border-ink-200'}`}>
                        <p className="text-sm">{msg.text}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>
              <div className="border-t border-ink-100 p-3">
                <div className="flex items-center gap-2">
                  <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="Type a message..." className="flex-1 h-10 px-3.5 rounded-xl bg-ink-100 text-sm outline-none focus:ring-2 focus:ring-accent-500/30" />
                  <Button size="icon" onClick={handleSend}><Send className="w-4 h-4" /></Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
