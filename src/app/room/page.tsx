'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LiveKitRoom,
  VideoConference,
  useRoomContext,
  useTrackToggle,
  useParticipants,
} from '@livekit/components-react';
import { RoomEvent, Track } from 'livekit-client';
import '@livekit/components-styles';
import { useToast } from '../../hooks/useToast';

const PUBLIC_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL;

type MediaDevice = { deviceId: string; label: string };
type PermState = 'unknown' | 'granted' | 'prompt' | 'denied';

function RoomContent() {
  const params = useSearchParams();
  const router = useRouter();
  const { success, error: showError, info } = useToast();
  const room = (params.get('room') || '').trim();
  const identity = (params.get('identity') || params.get('name') || '').trim();

  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [mics, setMics] = useState<MediaDevice[]>([]);
  const [cams, setCams] = useState<MediaDevice[]>([]);
  const [selectedMic, setSelectedMic] = useState<string | null>(null);
  const [selectedCam, setSelectedCam] = useState<string | null>(null);

  const [permMic, setPermMic] = useState<PermState>('unknown');
  const [permCam, setPermCam] = useState<PermState>('unknown');
  const [permError, setPermError] = useState<string | null>(null);

  useEffect(() => {
    if (!room || !identity) return;
    const fetchToken = async () => {
      try {
        setConnecting(true);
        setError(null);
        setToken(null);
        info('Connecting to meeting...');
        const res = await fetch(`/api/token?room=${encodeURIComponent(room)}&identity=${encodeURIComponent(identity)}`);
        const data = (await res.json()) as { token?: string; error?: string };
        if (!res.ok) throw new Error(data?.error || 'Token request failed');
        if (!data?.token) throw new Error('No token returned from server');
        setToken(data.token);
        success('Connected to meeting successfully!');
      } catch (e: any) {
        const errorMessage = e?.message || 'Failed to get token';
        setError(errorMessage);
        showError(`Connection failed: ${errorMessage}`);
      } finally {
        setConnecting(false);
      }
    };
    fetchToken();
  }, [room, identity, success, showError, info]);

  useEffect(() => {
    const savedMic = typeof window !== 'undefined' ? localStorage.getItem('lk_last_mic') : null;
    const savedCam = typeof window !== 'undefined' ? localStorage.getItem('lk_last_cam') : null;
    if (savedMic) setSelectedMic(savedMic);
    if (savedCam) setSelectedCam(savedCam);
  }, []);

  useEffect(() => {
    if (selectedMic) localStorage.setItem('lk_last_mic', selectedMic);
    if (selectedCam) localStorage.setItem('lk_last_cam', selectedCam);
  }, [selectedMic, selectedCam]);

  const canConnect = useMemo(() => Boolean(PUBLIC_URL && token), [token]);

  async function probePermissions() {
    try {
      if ('permissions' in navigator && (navigator as any).permissions?.query) {
        const mic = await (navigator as any).permissions.query({ name: 'microphone' });
        const cam = await (navigator as any).permissions.query({ name: 'camera' });
        setPermMic(mic.state as PermState);
        setPermCam(cam.state as PermState);
      }
    } catch {
      setPermMic('unknown');
      setPermCam('unknown');
    }
  }

  async function enumerateAllDevices() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const micList = devices.filter(d => d.kind === 'audioinput').map(d => ({ deviceId: d.deviceId, label: d.label || 'Microphone' }));
    const camList = devices.filter(d => d.kind === 'videoinput').map(d => ({ deviceId: d.deviceId, label: d.label || 'Camera' }));
    setMics(micList);
    setCams(camList);
    if (!selectedMic && micList[0]) setSelectedMic(micList[0].deviceId);
    if (!selectedCam && camList[0]) setSelectedCam(camList[0].deviceId);
  }

  async function requestAccess() {
    setPermError(null);
    try {
      info('Requesting device permissions...');
      await probePermissions();
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        success('Camera and microphone access granted!');
      } catch (errBoth: any) {
        try {
          await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          success('Microphone access granted!');
        } catch (errAudio: any) {
          try {
            await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
            success('Camera access granted!');
          } catch (errVideo: any) {
            const name = errBoth?.name || errAudio?.name || errVideo?.name || 'Error';
            const msg = errBoth?.message || errAudio?.message || errVideo?.message || 'Failed to access devices';
            setPermError(`${name}: ${msg}`);
            showError(`Device access denied: ${msg}`);
            return;
          }
        }
      }
      await enumerateAllDevices();
      await probePermissions();
    } catch (err: any) {
      const errorMsg = `${err?.name || 'Error'}: ${err?.message || 'Failed to access devices'}`;
      setPermError(errorMsg);
      showError(`Device access failed: ${errorMsg}`);
    }
  }

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) return;
    enumerateAllDevices().catch(() => {});
    probePermissions().catch(() => {});
  }, []);

  if (!room || !identity) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="card max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Missing Information</h1>
          <p className="text-gray-600 mb-4">
            Room name or identity is missing. Please check your URL.
          </p>
          <Link href="/join" className="btn-primary">
            Go to Join Page
          </Link>
        </div>
      </div>
    );
  }

  if (!PUBLIC_URL) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="card max-w-md text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Configuration Error</h1>
          <p className="text-gray-600 mb-4">
            LiveKit URL is not configured. Please add <code className="bg-gray-100 px-2 py-1 rounded text-sm">NEXT_PUBLIC_LIVEKIT_URL</code> to your environment variables.
          </p>
          <Link href="/" className="btn-primary">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="card max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Connection Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => window.location.reload()} className="btn-primary">
              Try Again
            </button>
            <Link href="/join" className="btn-secondary">
              New Meeting
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 text-white p-3 sm:p-4">
        <div className="mobile-header">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Link href="/" className="text-xl sm:text-2xl font-bold text-gradient">
              VideoMeet
            </Link>
            <div className="text-xs sm:text-sm text-gray-300">
              <span className="hidden sm:inline">Room:</span>
              <span className="sm:ml-2 font-medium">{room}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="text-xs sm:text-sm text-gray-300">
              <span className="hidden sm:inline">You are:</span>
              <span className="sm:ml-1 font-medium">{identity}</span>
            </div>
            
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
              title="Settings"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            
            <button
              onClick={() => router.push('/')}
              className="p-2 rounded-lg bg-red-600 hover:bg-red-700 transition-colors"
              title="Leave Meeting"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-gray-800 text-white p-4 border-b border-gray-700">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-lg font-semibold mb-4">Device Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Microphone</label>
                <select
                  value={selectedMic ?? ''}
                  onChange={(e) => setSelectedMic(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {mics.map((m) => (
                    <option key={m.deviceId} value={m.deviceId}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Camera</label>
                <select
                  value={selectedCam ?? ''}
                  onChange={(e) => setSelectedCam(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {cams.map((c) => (
                    <option key={c.deviceId} value={c.deviceId}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={requestAccess}
                  className="btn-primary text-sm px-4 py-2"
                >
                  Grant Access
                </button>
                <button
                  onClick={() => enumerateAllDevices()}
                  className="btn-secondary text-sm px-4 py-2"
                >
                  Refresh Devices
                </button>
              </div>
              <div className="text-sm text-gray-400">
                Mic: {permMic} • Cam: {permCam}
              </div>
            </div>
            
            {permError && (
              <div className="mt-3 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                <p className="text-red-400 text-sm">Device error: {permError}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loading State */}
      {connecting && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="spinner mx-auto mb-4"></div>
            <p className="text-white text-lg">Connecting to meeting...</p>
          </div>
        </div>
      )}

      {/* Video Conference */}
      {canConnect && (
        <div className="flex-1 relative">
          <LiveKitRoom
            serverUrl={PUBLIC_URL}
            token={token!}
            connect
            video
            audio
            data-lk-theme="default"
            className="h-full w-full"
          >
            <AutoApplyDevices selectedMic={selectedMic} selectedCam={selectedCam} />
            <VideoConference />
            <ControlsBar selectedMic={selectedMic} selectedCam={selectedCam} />
            <ParticipantCount />
          </LiveKitRoom>
        </div>
      )}
    </div>
  );
}

export default function RoomPage() {
  return (
    <Suspense fallback={<div className="h-screen w-screen bg-gray-900 flex items-center justify-center text-white">Loading…</div>}>
      <RoomContent />
    </Suspense>
  );
}

function AutoApplyDevices({ selectedMic, selectedCam }: { selectedMic: string | null; selectedCam: string | null }) {
  const room = useRoomContext();
  useEffect(() => {
    if (!room) return;
    const apply = async () => {
      try {
        if (selectedMic) await room.localParticipant.setMicrophoneEnabled(true, { deviceId: selectedMic });
        if (selectedCam) await room.localParticipant.setCameraEnabled(true, { deviceId: selectedCam });
      } catch {}
    };
    if ((room as any).state === 'connected') apply();
    const onConnected = () => void apply();
    room.on(RoomEvent.Connected, onConnected);
    return () => { room.off(RoomEvent.Connected, onConnected); };
  }, [room, selectedMic, selectedCam]);
  return null;
}

function ControlsBar({ selectedMic, selectedCam }: { selectedMic: string | null; selectedCam: string | null }) {
  return (
    <div className="mobile-controls flex gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 rounded-2xl glass-effect" role="toolbar" aria-label="Media controls">
      <MicButton selectedMic={selectedMic} />
      <CamButton selectedCam={selectedCam} />
      <ScreenShareButton />
      <ChatButton />
    </div>
  );
}

function MicButton({ selectedMic }: { selectedMic: string | null }) {
  const room = useRoomContext();
  const { enabled, pending } = useTrackToggle({ source: 'microphone' as any });
  return (
    <button
      onClick={async () => {
        if (!enabled) await room.localParticipant.setMicrophoneEnabled(true, selectedMic ? { deviceId: selectedMic } : undefined);
        else await room.localParticipant.setMicrophoneEnabled(false);
      }}
      disabled={pending}
      className={`control-button ${enabled ? 'active' : 'inactive'} ${pending ? 'opacity-60 cursor-not-allowed' : ''}`}
      title={enabled ? 'Mute microphone' : 'Unmute microphone'}
    >
      {pending ? (
        <div className="spinner"></div>
      ) : enabled ? (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      ) : (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2 2m0 0l2-2m-2 2l-2-2m2 2V9a3 3 0 00-3-3H9" />
        </svg>
      )}
    </button>
  );
}

function CamButton({ selectedCam }: { selectedCam: string | null }) {
  const room = useRoomContext();
  const { enabled, pending } = useTrackToggle({ source: 'camera' as any });
  return (
    <button
      onClick={async () => {
        if (!enabled) await room.localParticipant.setCameraEnabled(true, selectedCam ? { deviceId: selectedCam } : undefined);
        else await room.localParticipant.setCameraEnabled(false);
      }}
      disabled={pending}
      className={`control-button ${enabled ? 'active' : 'inactive'} ${pending ? 'opacity-60 cursor-not-allowed' : ''}`}
      title={enabled ? 'Turn off camera' : 'Turn on camera'}
    >
      {pending ? (
        <div className="spinner"></div>
      ) : enabled ? (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ) : (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
        </svg>
      )}
    </button>
  );
}

function ScreenShareButton() {
  const room = useRoomContext();
  const { enabled, pending } = useTrackToggle({ source: 'screen_share' as any });
  return (
    <button
      onClick={async () => {
        if (!enabled) {
          try {
            await room.localParticipant.setScreenShareEnabled(true);
          } catch (error) {
            console.error('Failed to start screen share:', error);
          }
        } else {
          await room.localParticipant.setScreenShareEnabled(false);
        }
      }}
      disabled={pending}
      className={`control-button ${enabled ? 'active' : 'inactive'} ${pending ? 'opacity-60 cursor-not-allowed' : ''}`}
      title={enabled ? 'Stop screen sharing' : 'Start screen sharing'}
    >
      {pending ? (
        <div className="spinner"></div>
      ) : (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )}
    </button>
  );
}

function ChatButton() {
  return (
    <button
      onClick={() => {
        // TODO: Implement chat functionality
        alert('Chat feature coming soon!');
      }}
      className="control-button active"
      title="Open chat"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    </button>
  );
}

function ParticipantCount() {
  const participants = useParticipants();
  return (
    <div className="fixed top-16 sm:top-20 right-2 sm:right-4 bg-black/60 text-white px-2 sm:px-3 py-1 sm:py-2 rounded-lg text-xs sm:text-sm">
      {participants.length} participant{participants.length !== 1 ? 's' : ''}
    </div>
  );
}