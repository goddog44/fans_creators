import { useEffect, useState, useRef } from 'react';
import { Send, DollarSign, Lock, ArrowLeft, Search, Paperclip } from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { PageHeader } from '@/components/shared/StatCard';
import { Avatar } from '@/components/ui/Avatar';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { EmptyState, LoadingState } from '@/components/ui/States';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { messageService, userService } from '@/services';
import type { Conversation, Message, User as UserType } from '@/types';
import { formatTimeAgo } from '@/lib/format';
import { modelNavItems as navItems } from '@/lib/nav';

export function ModelMessages() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [participants, setParticipants] = useState<Record<string, UserType>>({});
  const [activeConv, setActiveConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [showPPV, setShowPPV] = useState(false);
  const [ppvPrice, setPpvPrice] = useState(5);
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
        setConversations((prev) => prev.map((c) => (c.id === activeConv ? { ...c, unreadCount: 0 } : c)));
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

  const handleSendPPV = async () => {
    if (!activeConv || !user) return;
    const msg = await messageService.sendMessage(activeConv, user.id, { type: 'PPV', text: 'Exclusive content for you', price: ppvPrice });
    setMessages((prev) => [...prev, msg]);
    setShowPPV(false);
    toast('PPV content sent');
  };

  if (loading) return <DashboardShell navItems={navItems}><LoadingState /></DashboardShell>;

  return (
    <DashboardShell navItems={navItems}>
      <PageHeader title="Messages" subtitle="Chat with your subscribers" />

      <div className="bg-white rounded-2xl border border-ink-200/60 shadow-soft overflow-hidden h-[calc(100vh-220px)] min-h-[500px] flex">
        {/* Conversation list */}
        <div className={`w-full sm:w-80 border-r border-ink-100 flex flex-col ${showMobileChat ? 'hidden sm:flex' : 'flex'}`}>
          <div className="p-3 border-b border-ink-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
              <Input placeholder="Search..." className="pl-9 h-9 text-sm" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {conversations.length === 0 ? (
              <EmptyState title="No conversations" />
            ) : (
              conversations.map((conv) => {
                const otherId = conv.participantIds.find((id) => id !== user?.id);
                const other = otherId ? participants[otherId] : null;
                return (
                  <button key={conv.id} onClick={() => { setActiveConv(conv.id); setShowMobileChat(true); }} className={`w-full flex items-center gap-3 p-3 border-b border-ink-50 transition-colors text-left ${activeConv === conv.id ? 'bg-brand-50' : 'hover:bg-ink-50'}`}>
                    <Avatar src={other?.avatar || ''} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-sm text-ink-900 truncate">{other?.name}</p>
                        <span className="text-xs text-ink-400">{formatTimeAgo(conv.lastMessageAt)}</span>
                      </div>
                      <p className="text-xs text-ink-500">{conv.unreadCount > 0 ? `${conv.unreadCount} unread` : 'Tap to view'}</p>
                    </div>
                    {conv.unreadCount > 0 && <span className="w-2 h-2 bg-brand-500 rounded-full" />}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat */}
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
                  return <><Avatar src={other?.avatar || ''} size="sm" /><div><p className="font-semibold text-sm">{other?.name}</p><p className="text-xs text-success-600">Online</p></div></>;
                })()}
              </div>
              <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3 bg-ink-50/50">
                {messages.map((msg) => {
                  const isMe = msg.senderId === user?.id;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className="max-w-[75%]">
                        {msg.type === 'PPV' ? (
                          <div className={`rounded-2xl p-4 ${isMe ? 'bg-brand-600 text-white' : 'bg-white border border-ink-200'}`}>
                            <div className="flex items-center gap-2 mb-2"><Lock className="w-4 h-4" /><span className="text-sm font-semibold">PPV Content</span></div>
                            <p className="text-sm opacity-90 mb-3">{msg.text}</p>
                            <div className="rounded-xl overflow-hidden bg-ink-900/20 p-8 text-center"><Lock className="w-8 h-8 mx-auto opacity-50" /><p className="text-xs mt-2 opacity-70">Locked · ${msg.price}</p></div>
                          </div>
                        ) : (
                          <div className={`rounded-2xl px-4 py-2.5 ${isMe ? 'bg-brand-600 text-white' : 'bg-white border border-ink-200'}`}>
                            <p className="text-sm">{msg.text}</p>
                          </div>
                        )}
                        <span className="text-xs text-ink-400 mt-1 block">{formatTimeAgo(msg.createdAt)}</span>
                      </div>
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>
              <div className="border-t border-ink-100 p-3">
                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-lg hover:bg-ink-100"><Paperclip className="w-5 h-5 text-ink-400" /></button>
                  <button onClick={() => setShowPPV(true)} className="p-2 rounded-lg hover:bg-brand-50"><DollarSign className="w-5 h-5 text-brand-500" /></button>
                  <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="Type a message..." className="flex-1 h-10 px-3.5 rounded-xl bg-ink-100 text-sm outline-none focus:ring-2 focus:ring-brand-500/30" />
                  <Button size="icon" onClick={handleSend}><Send className="w-4 h-4" /></Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <Modal open={showPPV} onClose={() => setShowPPV(false)} title="Send PPV Content" size="sm">
        <div className="space-y-4">
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400">$</span>
            <input type="number" value={ppvPrice} onChange={(e) => setPpvPrice(Number(e.target.value))} className="w-full h-10 pl-7 pr-3 rounded-xl border border-ink-300 text-sm outline-none focus:ring-2 focus:ring-brand-500/30" />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[3, 5, 10, 20].map((amt) => (
              <button key={amt} onClick={() => setPpvPrice(amt)} className={`h-10 rounded-xl text-sm font-semibold ${ppvPrice === amt ? 'bg-brand-600 text-white' : 'bg-ink-100'}`}>${amt}</button>
            ))}
          </div>
          <Button onClick={handleSendPPV} className="w-full">Send PPV · ${ppvPrice}</Button>
        </div>
      </Modal>
    </DashboardShell>
  );
}
