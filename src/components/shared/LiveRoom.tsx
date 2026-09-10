import { useEffect, useRef, useState } from 'react';
import { Copy, Heart, MessageCircle, Mic, MicOff, PhoneOff, Share2, Video, VideoOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/context/ToastContext';
import { supabase } from '@/lib/supabase';
import { liveService } from '@/services';
import type { LiveStream, User } from '@/types';

interface LiveRoomProps {
  stream: LiveStream;
  currentUser: User;
  host: boolean;
  onEnded?: () => void;
}

interface LiveMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
}

type LiveEvent =
  | { type: 'join'; senderId: string }
  | { type: 'offer'; senderId: string; targetId: string; description: RTCSessionDescriptionInit }
  | { type: 'answer'; senderId: string; targetId: string; description: RTCSessionDescriptionInit }
  | { type: 'candidate'; senderId: string; targetId: string; candidate: RTCIceCandidateInit }
  | { type: 'message'; senderId: string; senderName: string; text: string }
  | { type: 'reaction'; senderId: string }
  | { type: 'invite'; senderId: string };

type MediaKind = 'camera' | 'microphone';

interface CreatorMediaResult {
  stream: MediaStream;
  message?: string;
}

const mediaErrorMessage = (error: unknown, kind: MediaKind): string => {
  const name = error instanceof DOMException ? error.name : '';
  const label = kind === 'camera' ? 'caméra' : 'microphone';
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') return `L'accès au ${label} a été refusé. Autorisez le ${label} dans les réglages du navigateur puis rechargez la page.`;
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') return `Aucun ${label} n'a été détecté sur cet appareil.`;
  if (name === 'NotReadableError' || name === 'TrackStartError') return `Le ${label} est déjà utilisé ou ne peut pas être démarré.`;
  if (name === 'OverconstrainedError') return `Les contraintes demandées pour le ${label} ne sont pas compatibles avec cet appareil.`;
  return `Le ${label} n'est pas disponible.`;
};

const requestCreatorMedia = async (): Promise<CreatorMediaResult> => {
  if (!window.isSecureContext) {
    return {
      stream: new MediaStream(),
      message: "La caméra et le microphone nécessitent HTTPS. Ouvrez CreatorHub avec https:// ou utilisez http://localhost en développement.",
    };
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    return {
      stream: new MediaStream(),
      message: "Ce navigateur ne prend pas en charge l'accès à la caméra et au microphone.",
    };
  }

  try {
    return { stream: await navigator.mediaDevices.getUserMedia({ video: true, audio: true }) };
  } catch (combinedError) {
    let cameraStream: MediaStream | null = null;
    let microphoneStream: MediaStream | null = null;
    let cameraError: unknown = combinedError;
    let microphoneError: unknown = combinedError;

    try {
      cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    } catch (error) {
      cameraError = error;
    }

    try {
      microphoneStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
    } catch (error) {
      microphoneError = error;
    }

    const stream = new MediaStream([
      ...(cameraStream?.getVideoTracks() || []),
      ...(microphoneStream?.getAudioTracks() || []),
    ]);
    if (stream.getTracks().length > 0) {
      const missing: string[] = [];
      if (!cameraStream?.getVideoTracks().length) missing.push(mediaErrorMessage(cameraError, 'camera'));
      if (!microphoneStream?.getAudioTracks().length) missing.push(mediaErrorMessage(microphoneError, 'microphone'));
      return { stream, message: missing.join(' ') };
    }

    return { stream, message: `${mediaErrorMessage(cameraError, 'camera')} ${mediaErrorMessage(microphoneError, 'microphone')}` };
  }
};

const newPeerId = () => `peer-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

const copyText = async (text: string): Promise<void> => {
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const area = document.createElement('textarea');
  area.value = text;
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.appendChild(area);
  area.select();
  document.execCommand('copy');
  area.remove();
};

export function LiveRoom({ stream, currentUser, host, onEnded }: LiveRoomProps) {
  const { toast } = useToast();
  const peerId = useRef(newPeerId());
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnections = useRef(new Map<string, RTCPeerConnection>());
  const candidateQueue = useRef(new Map<string, RTCIceCandidateInit[]>());
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const viewerVideoRef = useRef<HTMLVideoElement>(null);
  const [messages, setMessages] = useState<LiveMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [likes, setLikes] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [hasCameraTrack, setHasCameraTrack] = useState(false);
  const [hasAudioTrack, setHasAudioTrack] = useState(false);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const channel = supabase.channel(`live-room:${stream.id}`, { config: { broadcast: { ack: true } } });
    channelRef.current = channel;

    const send = (payload: LiveEvent) => {
      void channel.send({ type: 'broadcast', event: 'live', payload });
    };

    const addQueuedCandidates = async (connection: RTCPeerConnection, remotePeerId: string) => {
      const queued = candidateQueue.current.get(remotePeerId) || [];
      for (const candidate of queued) await connection.addIceCandidate(candidate);
      candidateQueue.current.delete(remotePeerId);
    };

    const createConnection = (remotePeerId: string) => {
      const existing = peerConnections.current.get(remotePeerId);
      if (existing) return existing;
      const connection = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });
      peerConnections.current.set(remotePeerId, connection);
      connection.onicecandidate = (event) => {
        if (event.candidate) send({ type: 'candidate', senderId: peerId.current, targetId: remotePeerId, candidate: event.candidate.toJSON() });
      };
      connection.onconnectionstatechange = () => {
        if (['failed', 'closed', 'disconnected'].includes(connection.connectionState)) {
          connection.close();
          peerConnections.current.delete(remotePeerId);
        }
      };
      connection.ontrack = (event) => {
        if (viewerVideoRef.current && event.streams[0]) viewerVideoRef.current.srcObject = event.streams[0];
        setConnected(true);
      };
      return connection;
    };

    const handleEvent = async (event: LiveEvent) => {
      if (event.senderId === peerId.current) return;
      if (event.type === 'message') {
        setMessages((current) => [...current.slice(-49), { id: `${event.senderId}-${Date.now()}`, senderId: event.senderId, senderName: event.senderName, text: event.text }]);
        return;
      }
      if (event.type === 'reaction') {
        setLikes((current) => current + 1);
        return;
      }
      if (event.type === 'invite') return;
      if (host && event.type === 'join') {
        const connection = createConnection(event.senderId);
        localStreamRef.current?.getTracks().forEach((track) => connection.addTrack(track, localStreamRef.current as MediaStream));
        const offer = await connection.createOffer();
        await connection.setLocalDescription(offer);
        send({ type: 'offer', senderId: peerId.current, targetId: event.senderId, description: offer });
        return;
      }
      if (!host && event.type === 'offer' && event.targetId === peerId.current) {
        const connection = createConnection(event.senderId);
        await connection.setRemoteDescription(event.description);
        await addQueuedCandidates(connection, event.senderId);
        const answer = await connection.createAnswer();
        await connection.setLocalDescription(answer);
        send({ type: 'answer', senderId: peerId.current, targetId: event.senderId, description: answer });
        return;
      }
      if (host && event.type === 'answer' && event.targetId === peerId.current) {
        const connection = peerConnections.current.get(event.senderId);
        if (connection) {
          await connection.setRemoteDescription(event.description);
          await addQueuedCandidates(connection, event.senderId);
        }
        return;
      }
      if (event.type === 'candidate' && event.targetId === peerId.current) {
        const connection = peerConnections.current.get(event.senderId);
        if (connection?.remoteDescription) await connection.addIceCandidate(event.candidate);
        else candidateQueue.current.set(event.senderId, [...(candidateQueue.current.get(event.senderId) || []), event.candidate]);
      }
    };

    channel.on('broadcast', { event: 'live' }, ({ payload }) => { void handleEvent(payload as LiveEvent); });
    channel.subscribe(async (status) => {
      if (status !== 'SUBSCRIBED' || cancelled) return;
      setConnected(host);
      if (host) {
        const result = await requestCreatorMedia();
        if (cancelled) return;
        localStreamRef.current = result.stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = result.stream;
        setCameraError(result.message || null);
        setHasCameraTrack(result.stream.getVideoTracks().length > 0);
        setHasAudioTrack(result.stream.getAudioTracks().length > 0);
        setCameraEnabled(result.stream.getVideoTracks().length > 0);
        setAudioEnabled(result.stream.getAudioTracks().length > 0);
      } else {
        send({ type: 'join', senderId: peerId.current });
      }
    });

    return () => {
      cancelled = true;
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      peerConnections.current.forEach((connection) => connection.close());
      peerConnections.current.clear();
      void supabase.removeChannel(channel);
    };
  }, [host, stream.id]);

  const sendMessage = () => {
    const text = messageText.trim();
    if (!text) return;
    const payload: LiveEvent = { type: 'message', senderId: peerId.current, senderName: currentUser.name, text };
    setMessages((current) => [...current.slice(-49), { id: `${peerId.current}-${Date.now()}`, senderId: peerId.current, senderName: currentUser.name, text }]);
    void channelRef.current?.send({ type: 'broadcast', event: 'live', payload });
    setMessageText('');
  };

  const sendReaction = () => {
    setLikes((current) => current + 1);
    void channelRef.current?.send({ type: 'broadcast', event: 'live', payload: { type: 'reaction', senderId: peerId.current } satisfies LiveEvent });
  };

  const shareLive = async () => {
    const url = `${window.location.origin}/live/${stream.id}`;
    try {
      if (navigator.share) await navigator.share({ title: stream.title, text: `Regarde le live de ${currentUser.name}`, url });
      else {
        await copyText(url);
        toast('Lien du live copié');
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) toast('Impossible de partager le live', 'error');
    }
    void channelRef.current?.send({ type: 'broadcast', event: 'live', payload: { type: 'invite', senderId: peerId.current } satisfies LiveEvent });
  };

  const toggleAudio = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setMuted(!track.enabled);
    setAudioEnabled(track.enabled);
  };

  const toggleVideo = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setCameraEnabled(track.enabled);
  };

  const endStream = async () => {
    await liveService.end(stream.id);
    onEnded?.();
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <section className="overflow-hidden rounded-2xl bg-black shadow-card">
        <div className="relative aspect-video bg-ink-950">
          {host ? <video ref={localVideoRef} autoPlay muted playsInline className="h-full w-full object-cover" /> : <video ref={viewerVideoRef} autoPlay playsInline className="h-full w-full object-cover" />}
          {!host && !connected && <div className="absolute inset-0 grid place-items-center px-6 text-center text-sm text-white">Connexion au flux vidéo...</div>}
          {host && cameraError && <div className="absolute inset-x-4 bottom-4 rounded-xl bg-danger-700/90 p-3 text-sm text-white">{cameraError}</div>}
          <div className="absolute left-4 top-4 rounded-full bg-danger-600 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">Live</div>
          <div className="absolute right-4 top-4 rounded-full bg-black/60 px-3 py-1 text-xs text-white">{stream.viewerCount} spectateurs</div>
        </div>
        <div className="flex flex-wrap items-center gap-2 p-3">
          {host && <><Button size="icon" variant="secondary" onClick={toggleAudio} disabled={!hasAudioTrack} title={muted ? 'Activer le microphone' : 'Couper le microphone'}>{muted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}</Button><Button size="icon" variant="secondary" onClick={toggleVideo} disabled={!hasCameraTrack} title={cameraEnabled ? 'Couper la caméra' : 'Activer la caméra'}>{cameraEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}</Button><Button size="sm" variant="danger" onClick={() => void endStream()}><PhoneOff className="h-4 w-4" /> Terminer</Button></>}
          <Button size="sm" variant="secondary" onClick={sendReaction}><Heart className="h-4 w-4 text-danger-400" /> {likes}</Button>
          <Button size="sm" variant="secondary" onClick={() => void shareLive()}><Share2 className="h-4 w-4" /> Partager / inviter</Button>
          <Button size="sm" variant="secondary" onClick={() => void copyText(`${window.location.origin}/live/${stream.id}`).then(() => toast('Lien du live copié'))}><Copy className="h-4 w-4" /></Button>
        </div>
      </section>
      <aside className="flex min-h-[24rem] flex-col rounded-2xl border border-ink-200 bg-white">
        <div className="flex items-center gap-2 border-b border-ink-100 p-4 font-semibold text-ink-900"><MessageCircle className="h-5 w-5 text-brand-600" /> Chat en direct</div>
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.length === 0 && <p className="text-sm text-ink-500">Les commentaires du live apparaîtront ici.</p>}
          {messages.map((message) => <p key={message.id} className="text-sm"><span className="font-bold text-brand-700">{message.senderName}</span> <span className="text-ink-700">{message.text}</span></p>)}
        </div>
        <div className="flex gap-2 border-t border-ink-100 p-3"><Input value={messageText} onChange={(event) => setMessageText(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') sendMessage(); }} placeholder="Écrire un commentaire..." maxLength={300} /><Button size="icon" onClick={sendMessage} aria-label="Envoyer"><MessageCircle className="h-4 w-4" /></Button></div>
      </aside>
    </div>
  );
}
