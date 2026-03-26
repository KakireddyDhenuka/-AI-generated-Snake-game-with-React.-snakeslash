import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Terminal, Cpu } from 'lucide-react';

const TRACKS = [
  { id: 1, title: 'SEQ_01: NEURAL_DECAY', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 2, title: 'SEQ_02: CYBER_PSYCHOSIS', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: 3, title: 'SEQ_03: SYSTEM_FAILURE', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
];

const GRID_SIZE = 20;
const CANVAS_SIZE = 400;

export default function App() {
  // --- Music Player State ---
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // --- Game State ---
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Game Refs to avoid stale closures in setInterval
  const snakeRef = useRef([{ x: 10, y: 10 }]);
  const directionRef = useRef({ x: 0, y: -1 });
  const lastProcessedDirectionRef = useRef({ x: 0, y: -1 });
  const foodRef = useRef({ x: 15, y: 15 });

  // --- Music Player Logic ---
  const togglePlay = () => {
    if (audioRef.current) {
      if (isMusicPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => console.error("Audio play failed:", e));
      }
      setIsMusicPlaying(!isMusicPlaying);
    }
  };

  const nextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
    setIsMusicPlaying(true);
  };

  const prevTrack = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
    setIsMusicPlaying(true);
  };

  useEffect(() => {
    if (audioRef.current) {
      if (isMusicPlaying) {
        audioRef.current.play().catch(e => console.error("Audio play failed:", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [currentTrackIndex, isMusicPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    const handleEnded = () => nextTrack();
    if (audio) {
      audio.addEventListener('ended', handleEnded);
      return () => audio.removeEventListener('ended', handleEnded);
    }
  }, []);

  // --- Game Logic ---
  const startGame = () => {
    snakeRef.current = [{ x: 10, y: 10 }];
    directionRef.current = { x: 0, y: -1 };
    lastProcessedDirectionRef.current = { x: 0, y: -1 };
    foodRef.current = {
      x: Math.floor(Math.random() * (CANVAS_SIZE / GRID_SIZE)),
      y: Math.floor(Math.random() * (CANVAS_SIZE / GRID_SIZE)),
    };
    setScore(0);
    setGameOver(false);
    setIsPlaying(true);
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#050505'; // Deep black
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Draw grid lines
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1;
    for (let i = 0; i <= CANVAS_SIZE; i += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, CANVAS_SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(CANVAS_SIZE, i);
      ctx.stroke();
    }

    // Draw food (Magenta)
    ctx.fillStyle = '#ff00ff';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ff00ff';
    ctx.fillRect(
      foodRef.current.x * GRID_SIZE + 2,
      foodRef.current.y * GRID_SIZE + 2,
      GRID_SIZE - 4,
      GRID_SIZE - 4
    );
    ctx.shadowBlur = 0;

    // Draw snake (Cyan)
    snakeRef.current.forEach((segment, index) => {
      ctx.fillStyle = index === 0 ? '#ffffff' : '#00ffff'; 
      ctx.shadowBlur = index === 0 ? 15 : 5;
      ctx.shadowColor = '#00ffff';
      ctx.fillRect(
        segment.x * GRID_SIZE + 1,
        segment.y * GRID_SIZE + 1,
        GRID_SIZE - 2,
        GRID_SIZE - 2
      );
      ctx.shadowBlur = 0;
    });
  };

  useEffect(() => {
    if (!isPlaying) {
      draw();
    }
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying || gameOver) return;

    const moveSnake = () => {
      const newSnake = [...snakeRef.current];
      const head = { ...newSnake[0] };

      // Update last processed direction
      lastProcessedDirectionRef.current = { ...directionRef.current };

      head.x += directionRef.current.x;
      head.y += directionRef.current.y;

      // Check collision with walls
      if (
        head.x < 0 ||
        head.x >= CANVAS_SIZE / GRID_SIZE ||
        head.y < 0 ||
        head.y >= CANVAS_SIZE / GRID_SIZE
      ) {
        setGameOver(true);
        setIsPlaying(false);
        return;
      }

      // Check collision with self
      if (newSnake.some((segment) => segment.x === head.x && segment.y === head.y)) {
        setGameOver(true);
        setIsPlaying(false);
        return;
      }

      newSnake.unshift(head);

      // Check food
      if (head.x === foodRef.current.x && head.y === foodRef.current.y) {
        setScore((s) => s + 10);
        foodRef.current = {
          x: Math.floor(Math.random() * (CANVAS_SIZE / GRID_SIZE)),
          y: Math.floor(Math.random() * (CANVAS_SIZE / GRID_SIZE)),
        };
      } else {
        newSnake.pop();
      }

      snakeRef.current = newSnake;
      draw();
    };

    const intervalId = setInterval(moveSnake, 100);
    return () => clearInterval(intervalId);
  }, [isPlaying, gameOver]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(e.key)) {
        e.preventDefault();
      }

      if (!isPlaying || gameOver) return;

      const key = e.key.toLowerCase();
      const lastDir = lastProcessedDirectionRef.current;

      switch (key) {
        case 'arrowup':
        case 'w':
          if (lastDir.y !== 1) directionRef.current = { x: 0, y: -1 };
          break;
        case 'arrowdown':
        case 's':
          if (lastDir.y !== -1) directionRef.current = { x: 0, y: 1 };
          break;
        case 'arrowleft':
        case 'a':
          if (lastDir.x !== 1) directionRef.current = { x: -1, y: 0 };
          break;
        case 'arrowright':
        case 'd':
          if (lastDir.x !== -1) directionRef.current = { x: 1, y: 0 };
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, gameOver]);

  return (
    <div className="min-h-screen bg-[#050505] text-[#00ffff] flex flex-col items-center justify-center p-4 font-mono selection:bg-[#ff00ff]/50 overflow-hidden scanlines relative">
      <div className="static-bg" />

      <audio
        ref={audioRef}
        src={TRACKS[currentTrackIndex].url}
        preload="auto"
      />

      <header className="mb-10 text-center z-10 relative">
        <h1 className="text-6xl font-black tracking-tighter mb-2 glitch-text uppercase" data-text="SNAKE.EXE">
          SNAKE.EXE
        </h1>
        <p className="text-[#ff00ff] font-bold tracking-widest uppercase text-xl mt-2 bg-black px-4 py-1 border border-[#ff00ff] inline-block shadow-[4px_4px_0px_#00ffff]">
          AUDIO.SYNC // NEURAL.LINK.ESTABLISHED
        </p>
      </header>

      <div className="flex flex-col lg:flex-row gap-12 w-full max-w-6xl items-center lg:items-stretch justify-center z-10">
        
        {/* Music Player Sidebar */}
        <div className="w-full lg:w-96 bg-black p-8 border-2 border-[#00ffff] shadow-[8px_8px_0px_#ff00ff] flex flex-col items-center justify-center relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-[#ff00ff] animate-pulse" />
          <div className="absolute bottom-0 right-0 w-full h-1 bg-[#00ffff] animate-pulse" />
          
          <div className="absolute top-2 left-2 text-[#ff00ff] flex items-center gap-2 text-sm">
            <Cpu size={16} />
            <span>SYS.AUDIO.MODULE</span>
          </div>

          <div 
            className="w-48 h-48 mb-8 mt-6 border-4 border-[#00ffff] p-2 relative"
          >
            <div className="absolute inset-0 border-2 border-[#ff00ff] m-2 animate-ping opacity-20" />
            <div className="w-full h-full bg-[#050505] flex items-center justify-center border border-[#ff00ff]">
              <Terminal size={64} className="text-[#00ffff]" strokeWidth={1.5} />
            </div>
          </div>

          <div className="text-center mb-8 w-full border-b border-[#333] pb-4">
            <h3 className="text-2xl font-bold text-[#00ffff] mb-2 truncate px-2 uppercase tracking-wider" title={TRACKS[currentTrackIndex].title}>
              {TRACKS[currentTrackIndex].title}
            </h3>
            <p className="text-lg text-[#ff00ff] font-bold uppercase tracking-widest animate-pulse">
              {isMusicPlaying ? ">> PLAYING" : "|| HALTED"}
            </p>
          </div>

          <div className="flex items-center gap-6">
            <button 
              onClick={prevTrack} 
              className="p-3 text-[#00ffff] border border-[#00ffff] hover:bg-[#00ffff] hover:text-black transition-colors uppercase font-bold tracking-wider text-sm shadow-[2px_2px_0px_#ff00ff] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              <SkipBack size={20} className="inline mr-1" /> PREV
            </button>
            <button 
              onClick={togglePlay} 
              className="p-4 bg-[#ff00ff] text-black border-2 border-[#00ffff] hover:bg-[#00ffff] hover:border-[#ff00ff] transition-colors uppercase font-black tracking-widest shadow-[4px_4px_0px_#00ffff] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
            >
              {isMusicPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
            </button>
            <button 
              onClick={nextTrack} 
              className="p-3 text-[#00ffff] border border-[#00ffff] hover:bg-[#00ffff] hover:text-black transition-colors uppercase font-bold tracking-wider text-sm shadow-[2px_2px_0px_#ff00ff] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              NEXT <SkipForward size={20} className="inline ml-1" />
            </button>
          </div>
        </div>

        {/* Game Area */}
        <div className="flex-1 w-full max-w-md lg:max-w-none bg-black p-8 border-2 border-[#ff00ff] shadow-[-8px_8px_0px_#00ffff] flex flex-col items-center relative">
          <div className="w-full flex justify-between items-center mb-6 px-2 max-w-[400px]">
            <div className="flex items-center gap-3 text-[#00ffff] bg-black px-4 py-2 border border-[#00ffff] shadow-[2px_2px_0px_#ff00ff]">
              <span className="font-bold text-xl uppercase tracking-widest">SCORE:</span>
              <span className="font-black text-2xl text-[#ff00ff]">{score.toString().padStart(4, '0')}</span>
            </div>
            <div className="text-[#00ffff] font-bold text-sm uppercase tracking-widest border border-[#333] px-3 py-1">
              INPUT: WASD
            </div>
          </div>

          <div className="relative border-4 border-[#00ffff] p-1 bg-[#111]">
            <canvas
              ref={canvasRef}
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              className="bg-[#050505] w-full max-w-[400px] aspect-square block"
            />

            {!isPlaying && !gameOver && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-20">
                <button
                  onClick={startGame}
                  className="px-8 py-4 bg-[#00ffff] text-black border-2 border-[#ff00ff] hover:bg-[#ff00ff] hover:border-[#00ffff] font-black transition-colors uppercase tracking-widest text-xl shadow-[6px_6px_0px_#ff00ff] hover:shadow-[6px_6px_0px_#00ffff] active:translate-x-[6px] active:translate-y-[6px] active:shadow-none"
                >
                  EXECUTE
                </button>
              </div>
            )}

            {gameOver && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm z-20 border-4 border-[#ff00ff]">
                <h2 className="text-5xl font-black text-[#ff00ff] mb-4 glitch-text" data-text="FATAL_ERROR">FATAL_ERROR</h2>
                <p className="text-[#00ffff] mb-8 font-bold text-2xl tracking-widest bg-black px-4 py-2 border border-[#00ffff]">
                  FINAL_SCORE: {score.toString().padStart(4, '0')}
                </p>
                <button
                  onClick={startGame}
                  className="px-8 py-4 bg-[#00ffff] text-black border-2 border-[#ff00ff] hover:bg-[#ff00ff] hover:border-[#00ffff] font-black transition-colors uppercase tracking-widest text-xl shadow-[6px_6px_0px_#ff00ff] hover:shadow-[6px_6px_0px_#00ffff] active:translate-x-[6px] active:translate-y-[6px] active:shadow-none"
                >
                  REBOOT
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
