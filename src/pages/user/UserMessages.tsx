import { useState, useEffect, useRef } from 'react';
import { UserShell } from '@/components/layout/UserShell';
import { Avatar } from '@/components/ui/Avatar';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { messageService, userService } from '@/services';
import type { Conversation, Message, User as UserType } from '@/types';
import { formatTimeAgo } from '@/lib/format';
import { Send, ImageIcon, DollarSign, Lock, ArrowLeft, Search, Paperclip } from 'lucide-react';

export function UserMessages() {
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    messageService.getConversations(user.id).then(async (convs) => {
      setConversations(convs);
      const allP = new Set(convs.flatMap((c) => c.participantIds.filter((id) => id !== user.id)));
      const users = await Promise.all([...allP].map((id) => userService.getById(id)));
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    toast('PPV content sent', 'success');
  };

  const handleUnlock = async (msgId: string) => {
    const updated = await messageService.unlockMessage(msgId);
    setMessages((prev) => prev.map((m) => (m.id === msgId ? updated : m)));
    toast('Content unlocked!', 'success');
  };

  if (loading) return <UserShell><LoadingState /></UserShell>;

  return (
    <UserShell>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display font-bold text-2xl text-ink-900">Messages</h1>
      </div>

      <div className="bg-white rounded-2xl border border-ink-200/60 shadow-soft overflow-hidden h-[calc(100vh-200px)] min-h-[500px] flex">
        {/* Conversation list */}
        <div className={`w-full sm:w-80 border-r border-ink-100 flex flex-col ${showMobileChat ? 'hidden sm:flex' : 'flex'}`}>
          <div className="p-3 border-b border-ink-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
              <Input placeholder="Search conversations..." className="pl-9 h-9 text-sm" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {conversations.length === 0 ? (
              <EmptyState title="No conversations" description="Start messaging a creator" />
            ) : (
              conversations.map((conv) => {
                const otherId = conv.participantIds.find((id) => id !== user?.id);
                const other = otherId ? participants[otherId] : null;
                const isActive = activeConv === conv.id;
                return (
                  <button
                    key={conv.id}
                    onClick={() => { setActiveConv(conv.id); setShowMobileChat(true); }}
                    className={`w-full flex items-center gap-3 p-3 border-b border-ink-50 transition-colors text-left ${isActive ? 'bg-brand-50' : 'hover:bg-ink-50'}`}
                  >
                    <Avatar src={other?.avatar || ''} size="md" online={conv.typing === otherId} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-sm text-ink-900 truncate">{other?.name}</p>
                        <span className="text-xs text-ink-400 flex-shrink-0">{formatTimeAgo(conv.lastMessageAt)}</span>
                      </div>
                      <p className="text-xs text-ink-500 truncate">
                        {conv.typing === otherId ? <span className="text-brand-600">typing...</span> : `${conv.unreadCount > 0 ? `${conv.unreadCount} unread` : 'Tap to view'}`}
                      </p>
                    </div>
                    {conv.unreadCount > 0 && <span className="w-2 h-2 bg-brand-500 rounded-full flex-shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className={`flex-1 flex flex-col ${showMobileChat ? 'flex' : 'hidden sm:flex'}`}>
          {!activeConv ? (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState title="Select a conversation" description="Choose a conversation to start messaging" />
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="h-14 border-b border-ink-100 flex items-center gap-3 px-4">
                <button onClick={() => setShowMobileChat(false)} className="sm:hidden p-1 rounded-lg hover:bg-ink-100">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                {(() => {
                  const otherId = conversations.find((c) => c.id === activeConv)?.participantIds.find((id) => id !== user?.id);
                  const other = otherId ? participants[otherId] : null;
                  return (
                    <>
                      <Avatar src={other?.avatar || ''} size="sm" online />
                      <div>
                        <p className="font-semibold text-sm text-ink-900">{other?.name}</p>
                        <p className="text-xs text-success-600">Online</p>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3 bg-ink-50/50">
                {messages.map((msg) => {
                  const isMe = msg.senderId === user?.id;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                        {msg.type === 'PPV' ? (
                          <div className={`rounded-2xl p-4 ${isMe ? 'bg-brand-600 text-white' : 'bg-white border border-ink-200'}`}>
                            <div className="flex items-center gap-2 mb-2">
                              <Lock className="w-4 h-4" />
                              <span className="text-sm font-semibold">PPV Content</span>
                            </div>
                            <p className="text-sm opacity-90 mb-3">{msg.text}</p>
                            {msg.unlocked ? (
                              <div className="rounded-xl overflow-hidden">
                                <img src={msg.mediaUrl} alt="" className="w-full" />
                              </div>
                            ) : (
                              <Button size="sm" variant={isMe ? 'outline' : 'primary'} onClick={() => handleUnlock(msg.id)} className={isMe ? 'bg-white/20 border-white/30 text-white hover:bg-white/30' : ''}>
                                Unlock for ${msg.price}
                              </Button>
                            )}
                          </div>
                        ) : msg.type === 'IMAGE' ? (
                          <div className={`rounded-2xl overflow-hidden ${isMe ? 'bg-brand-600' : 'bg-white border border-ink-200'}`}>
                            <img src={msg.mediaUrl} alt="" className="w-full max-w-xs" />
                            {msg.text && <p className="p-2 text-sm">{msg.text}</p>}
                          </div>
                        ) : (
                          <div className={`rounded-2xl px-4 py-2.5 ${isMe ? 'bg-brand-600 text-white' : 'bg-white border border-ink-200 text-ink-800'}`}>
                            <p className="text-sm">{msg.text}</p>
                          </div>
                        )}
                        <span className="text-xs text-ink-400 mt-1 px-1">{formatTimeAgo(msg.createdAt)}</span>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Composer */}
              <div className="border-t border-ink-100 p-3">
                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-lg hover:bg-ink-100 transition-colors"><Paperclip className="w-5 h-5 text-ink-400" /></button>
                  <button onClick={() => setShowPPV(true)} className="p-2 rounded-lg hover:bg-brand-50 transition-colors"><DollarSign className="w-5 h-5 text-brand-500" /></button>
                  <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Type a message..."
                    className="flex-1 h-10 px-3.5 rounded-xl bg-ink-100 text-sm outline-none focus:ring-2 focus:ring-brand-500/30"
                  />
                  <Button size="icon" onClick={handleSend}><Send className="w-4 h-4" /></Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* PPV Modal */}
      <Modal open={showPPV} onClose={() => setShowPPV(false)} title="Send PPV Content" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-ink-700 mb-1.5">Price</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400">$</span>
              <input type="number" value={ppvPrice} onChange={(e) => setPpvPrice(Number(e.target.value))} className="w-full h-10 pl-7 pr-3 rounded-xl border border-ink-300 text-sm outline-none focus:ring-2 focus:ring-brand-500/30" />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[3, 5, 10, 20].map((amt) => (
              <button key={amt} onClick={() => setPpvPrice(amt)} className={`h-10 rounded-xl text-sm font-semibold transition-all ${ppvPrice === amt ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-700'}`}>${amt}</button>
            ))}
          </div>
          <Button onClick={handleSendPPV} className="w-full">Send PPV · ${ppvPrice}</Button>
        </div>
      </Modal>
    </UserShell>
  );
}
