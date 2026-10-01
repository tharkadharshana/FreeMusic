import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, RotateCcw, Mic, Upload, Globe, Music, AlertTriangle, CheckCircle2, Radio } from 'lucide-react';
import { AudioTrack, DetectionResult, SentinelSettings, WatchlistItem } from '../types';
import { DEMO_TRACKS } from '../data/defaults';
import { audioEngine } from '../utils/audioSynthesizer';
import { checkAudioAgainstWatchlist } from '../utils/fuzzyMatcher';

interface AudioPlayerSimulatorProps {
  watchlist: WatchlistItem[];
  settings: SentinelSettings;
  onDetectionTriggered: (result: DetectionResult, source: string) => void;
  activeDetection: DetectionResult | null;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  onClearDetection: () => void;
}

export const AudioPlayerSimulator: React.FC<AudioPlayerSimulatorProps> = ({
  watchlist,
  settings,
  onDetectionTriggered,
  activeDetection,
  isMuted,
  setIsMuted,
  onClearDetection,
}) => {
  const [selectedTrack, setSelectedTrack] = useState<AudioTrack>(DEMO_TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [simulatedDomain, setSimulatedDomain] = useState('youtube.com/watch?v=demo-stream');
  const [isMicMode, setIsMicMode] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customArtist, setCustomArtist] = useState('');
  const [showCustomForm, setShowCustomForm] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioFileRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Synchronize audio engine volume
  useEffect(() => {
    audioEngine.setVolume(isMuted ? 0 : volume);
    if (audioFileRef.current) {
      audioFileRef.current.volume = isMuted ? 0 : volume;
      audioFileRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  // Canvas visualizer loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = audioEngine.getAnalyser();
    const bufferLength = analyser ? analyser.frequencyBinCount : 128;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animationFrameRef.current = requestAnimationFrame(render);
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Background grid
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      if (analyser && (isPlaying || isMicMode)) {
        analyser.getByteFrequencyData(dataArray);

        const barWidth = (width / bufferLength) * 2.2;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * (height * 0.85);

          // If copyright match, paint red warning frequency bars!
          if (activeDetection && activeDetection.isMatch) {
            ctx.fillStyle = `rgb(${180 + dataArray[i] * 0.3}, ${30}, ${50})`;
          } else {
            ctx.fillStyle = `rgb(${20 + dataArray[i] * 0.4}, ${160 + dataArray[i] * 0.3}, ${240})`;
          }

          ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);
          x += barWidth;
        }
      } else {
        // Idle line
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
      }
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, isMicMode, activeDetection]);

  // Evaluate detection whenever track changes or plays
  const evaluateTrack = (title: string, artist: string) => {
    if (!settings.isEnabled) {
      onClearDetection();
      return;
    }
    const result = checkAudioAgainstWatchlist(title, artist, watchlist, settings.fuzzyThreshold);
    if (result.isMatch) {
      if (settings.soundAlert) {
        audioEngine.playCautionAlert();
      }
      if (settings.autoPauseOnMatch) {
        handlePause();
      }
    }
    onDetectionTriggered(result, simulatedDomain);
  };

  const handlePlay = () => {
    if (isMicMode) {
      setIsMicMode(false);
      audioEngine.stopMicrophoneCapture();
    }

    setIsPlaying(true);
    evaluateTrack(selectedTrack.title, selectedTrack.artist);

    // If using custom uploaded file
    if (selectedTrack.source === 'custom_upload' && audioFileRef.current) {
      audioFileRef.current.play();
    } else {
      // Use built-in Web Audio synth generator
      const profile = selectedTrack.frequencyProfile || 'pop';
      audioEngine.startTrackSynth(profile, (secs) => {
        setCurrentTime((prev) => (prev + 1) % selectedTrack.duration);
      });
    }
  };

  const handlePause = () => {
    setIsPlaying(false);
    audioEngine.stopSynth();
    if (audioFileRef.current) {
      audioFileRef.current.pause();
    }
  };

  const handleTrackSelect = (track: AudioTrack) => {
    handlePause();
    setCurrentTime(0);
    setSelectedTrack(track);
    if (track.source === 'preset_copyrighted') {
      setSimulatedDomain('youtube.com/watch?v=music-video-stream');
    } else {
      setSimulatedDomain('royaltyfreebeats.io/player');
    }
    // Pre-evaluate
    evaluateTrack(track.title, track.artist);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle) return;
    const newTrack: AudioTrack = {
      id: 'custom-' + Date.now(),
      title: customTitle,
      artist: customArtist || 'Unknown Artist',
      duration: 180,
      source: 'synthetic',
      category: 'Custom',
      description: 'Custom simulated audio stream for testing watchlist matching.',
      isCopyrighted: false,
      frequencyProfile: 'synthwave'
    };
    setSelectedTrack(newTrack);
    setShowCustomForm(false);
    setCustomTitle('');
    setCustomArtist('');
    evaluateTrack(newTrack.title, newTrack.artist);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    const fileName = file.name.replace(/\.[^/.]+$/, "");
    const parts = fileName.split('-');
    const artist = parts.length > 1 ? parts[0].trim() : 'Local Audio Artist';
    const title = parts.length > 1 ? parts.slice(1).join('-').trim() : fileName;

    const newTrack: AudioTrack = {
      id: 'upload-' + Date.now(),
      title,
      artist,
      duration: 180,
      source: 'custom_upload',
      category: 'Custom',
      description: `Uploaded local file: ${file.name}`,
      isCopyrighted: false,
    };

    if (audioFileRef.current) {
      audioFileRef.current.src = url;
    }

    setSelectedTrack(newTrack);
    evaluateTrack(title, artist);
  };

  const toggleMic = async () => {
    if (isMicMode) {
      audioEngine.stopMicrophoneCapture();
      setIsMicMode(false);
    } else {
      handlePause();
      const ok = await audioEngine.startMicrophoneCapture();
      if (ok) {
        setIsMicMode(true);
        const micTrack: AudioTrack = {
          id: 'mic-active',
          title: 'Live Microphone / System Audio Stream',
          artist: 'Ambient Environment Stream',
          duration: 3600,
          source: 'mic_input',
          category: 'Custom',
          description: 'Streaming real-time audio input from your local microphone or desktop audio capture.',
          isCopyrighted: false,
        };
        setSelectedTrack(micTrack);
        evaluateTrack(micTrack.title, micTrack.artist);
      }
    }
  };

  const formatSeconds = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="space-y-6">
      {/* Hidden audio element for custom file uploads */}
      <audio
        ref={audioFileRef}
        onTimeUpdate={() => {
          if (audioFileRef.current) {
            setCurrentTime(Math.floor(audioFileRef.current.currentTime));
          }
        }}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Simulated Tab Frame Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        {/* Browser Top Bar with URL bar */}
        <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
            <span className="text-slate-400 font-mono text-[11px] ml-2">Simulated Browser Tab</span>
          </div>

          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-md px-3 py-1 text-slate-300 w-1/2 max-w-md font-mono text-[11px]">
            <Globe className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <input
              type="text"
              value={simulatedDomain}
              onChange={(e) => setSimulatedDomain(e.target.value)}
              className="bg-transparent border-none outline-none w-full text-slate-200"
              placeholder="e.g. youtube.com/watch?v=..."
            />
          </div>

          <div className="flex items-center gap-2">
            {activeDetection?.isMatch ? (
              <span className="flex items-center gap-1.5 text-red-400 font-semibold text-xs">
                <AlertTriangle className="w-3.5 h-3.5 animate-bounce" />
                <span>RESTRICTED AUDIO</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium text-xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>UNRESTRICTED</span>
              </span>
            )}
          </div>
        </div>

        {/* Visualizer Canvas & Playing Info */}
        <div className="relative p-6 bg-slate-950/90">
          <canvas
            ref={canvasRef}
            width={720}
            height={160}
            className="w-full h-40 rounded-lg border border-slate-800 shadow-inner"
          />

          {/* Overlay Status Badge */}
          <div className="absolute top-9 left-9 flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isPlaying || isMicMode ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'
              }`}
            />
            <span className="text-xs font-mono font-medium uppercase tracking-wider text-slate-300 bg-slate-900/90 px-2 py-0.5 rounded border border-slate-700">
              {isMicMode ? 'MIC INPUT ACTIVE' : isPlaying ? 'AUDIO PLAYING' : 'PLAYER IDLE'}
            </span>
          </div>

          {/* Current Track Info */}
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-800/80 pt-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">{selectedTrack.title}</h3>
                {selectedTrack.isCopyrighted ? (
                  <span className="text-[11px] font-mono font-bold text-red-400 bg-red-950/70 border border-red-700/50 px-2 py-0.5 rounded">
                    COPYRIGHTED CATALOGUE
                  </span>
                ) : (
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/70 border border-emerald-700/50 px-2 py-0.5 rounded">
                    ROYALTY-FREE / CC0
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-400 mt-0.5">
                Artist: <span className="text-slate-200 font-semibold">{selectedTrack.artist}</span>
                {selectedTrack.album && <span className="text-slate-500"> · Album: {selectedTrack.album}</span>}
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-xl">{selectedTrack.description}</p>
            </div>

            {/* Playback Scrubber & Tabular Time */}
            <div className="text-right shrink-0">
              <span className="font-mono text-sm font-semibold tabular-nums text-slate-300">
                {formatSeconds(currentTime)} / {formatSeconds(selectedTrack.duration)}
              </span>
              <div className="w-36 h-1.5 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    activeDetection?.isMatch ? 'bg-red-500' : 'bg-cyan-500'
                  }`}
                  style={{
                    width: `${Math.min(100, (currentTime / (selectedTrack.duration || 1)) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Audio Controls Bar */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800">
            <div className="flex items-center gap-3">
              <button
                onClick={isPlaying ? handlePause : handlePlay}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg font-semibold text-xs shadow-md transition-all ${
                  isPlaying
                    ? 'bg-amber-600 hover:bg-amber-500 text-white'
                    : 'bg-rose-600 hover:bg-rose-500 text-white'
                }`}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
                <span>{isPlaying ? 'Pause Audio' : 'Play Audio'}</span>
              </button>

              <button
                onClick={() => {
                  handlePause();
                  setCurrentTime(0);
                }}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                title="Reset Track"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={toggleMic}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                  isMicMode
                    ? 'bg-red-950 border-red-500 text-red-300'
                    : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                }`}
                title="Test with Live Microphone Audio"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>{isMicMode ? 'Stop Mic Capture' : 'Listen via Mic'}</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors"
                title="Upload MP3 or WAV file"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Load File</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Volume Control */}
            <div className="flex items-center gap-2.5 text-xs text-slate-400">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="text-slate-300 hover:text-white"
              >
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  setIsMuted(false);
                  setVolume(parseFloat(e.target.value));
                }}
                className="w-24 accent-rose-500 h-1 bg-slate-700 rounded-lg cursor-pointer"
              />
              <span className="font-mono tabular-nums text-slate-300 text-[11px] w-8">
                {isMuted ? 'MUTED' : `${Math.round(volume * 100)}%`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Preset Tracks Grid & Custom Stream Test */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-white tracking-tight">Test Library & Demo Tracks</h4>
            <p className="text-xs text-slate-400">
              Select a preset track or enter custom song & artist to simulate the Sentinel auto-detection hook.
            </p>
          </div>
          <button
            onClick={() => setShowCustomForm(!showCustomForm)}
            className="text-xs text-rose-400 hover:text-rose-300 font-medium transition-colors"
          >
            {showCustomForm ? 'Close Custom Input' : '+ Test Custom Song / Artist'}
          </button>
        </div>

        {/* Custom Input Form */}
        {showCustomForm && (
          <form
            onSubmit={handleCustomSubmit}
            className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3 animate-in fade-in duration-150"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Song Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cruel Summer, Anti-Hero, One Dance..."
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Artist / Channel Name</label>
                <input
                  type="text"
                  placeholder="e.g. Taylor Swift, Drake, Metallica..."
                  value={customArtist}
                  onChange={(e) => setCustomArtist(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCustomForm(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold"
              >
                Simulate & Evaluate
              </button>
            </div>
          </form>
        )}

        {/* Demo Tracks Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {DEMO_TRACKS.map((track) => {
            const isCurrent = selectedTrack.id === track.id;
            return (
              <div
                key={track.id}
                onClick={() => handleTrackSelect(track)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  isCurrent
                    ? track.isCopyrighted
                      ? 'bg-red-950/40 border-red-600/70 shadow-md shadow-red-950/50'
                      : 'bg-emerald-950/40 border-emerald-600/70 shadow-md shadow-emerald-950/50'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="font-semibold text-sm text-slate-100 block truncate">
                      {track.title}
                    </span>
                    <span className="text-xs text-slate-400 block truncate mt-0.5">
                      {track.artist}
                    </span>
                  </div>
                  {track.isCopyrighted ? (
                    <span className="text-[10px] font-mono font-bold text-red-400 bg-red-950 border border-red-800/60 px-1.5 py-0.5 rounded shrink-0">
                      RESTRICTED
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 border border-emerald-800/60 px-1.5 py-0.5 rounded shrink-0">
                      ROYALTY-FREE
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 mt-2 line-clamp-2">
                  {track.description}
                </p>

                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 font-mono tabular-nums border-t border-slate-800/60 pt-2">
                  <span>{formatSeconds(track.duration)}</span>
                  <span className="text-rose-400 font-sans text-xs">
                    {isCurrent && isPlaying ? '▶ Playing Now' : 'Click to Load'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
