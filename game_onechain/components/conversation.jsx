import React, { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Props:
 * - dialogues: Array<{ speaker: string, text: string, portrait?: string }>
 * - onComplete: () => void
 */
export default function Conversation({ dialogues = [], onComplete }) {
  const [index, setIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isExiting, setIsExiting] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  // Refs to hold interval/timeout IDs and the speech utterance instance
  const typingRef = useRef(null);
  const utterRef = useRef(null);
  const advanceTimeoutRef = useRef(null);
  const currentIndexRef = useRef(index);

  useEffect(() => {
    currentIndexRef.current = index;
  }, [index]);

  // Cleanup function
  const cleanup = useCallback(() => {
    clearInterval(typingRef.current);
    clearTimeout(advanceTimeoutRef.current);
    if (utterRef.current) {
      utterRef.current.onend = null;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

  // Handle exit and completion
  useEffect(() => {
    if (isExiting) {
      const timer = setTimeout(() => {
        if (dontShowAgain) {
          localStorage.setItem('skipStoryIntro', 'true');
        }
        if (onComplete) onComplete();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isExiting, onComplete, dontShowAgain]);

  const advance = useCallback(() => {
    cleanup();
    if (index + 1 >= dialogues.length) {
      setIsExiting(true);
    } else {
      setIndex((prevIndex) => prevIndex + 1);
    }
  }, [index, dialogues.length, cleanup]);

  // Effect for typing and speech
  useEffect(() => {
    if (isExiting) return;

    cleanup();

    const line = dialogues[index];
    if (!line) return;

    // Typing Effect
    let pos = 0;
    setDisplayText('');
    typingRef.current = setInterval(() => {
      pos++;
      setDisplayText(line.text.slice(0, pos));
      if (pos >= line.text.length) {
        clearInterval(typingRef.current);
      }
    }, 80); // Slightly faster typing

    // Text-to-Speech handlers
    const handleSpeechSuccess = () => {
      if (currentIndexRef.current === index) {
        // Speech finished normally, wait a bit then advance
        advanceTimeoutRef.current = setTimeout(() => {
          advance();
        }, 800);
      }
    };

    const handleSpeechError = (e) => {
      console.warn("TTS Error:", e);
      if (currentIndexRef.current === index) {
        // Speech failed (e.g. prevented by browser or no voice), fallback to reading timer
        const estimatedTime = Math.max(3000, line.text.length * 50);
        advanceTimeoutRef.current = setTimeout(() => {
          advance();
        }, estimatedTime);
      }
    };

    if ('speechSynthesis' in window && line.text) {
      window.speechSynthesis.cancel();

      const utter = new SpeechSynthesisUtterance(line.text);
      utter.lang = 'en-US';
      utter.volume = 0.8;
      utter.rate = 1.1;
      utter.onend = handleSpeechSuccess;
      utter.onerror = handleSpeechError;

      utterRef.current = utter;
      window.speechSynthesis.speak(utter);
    } else {
      // Fallback auto-advance if TTS is not available
      const estimatedTime = Math.max(3000, line.text.length * 50);
      advanceTimeoutRef.current = setTimeout(() => {
        advance();
      }, estimatedTime);
    }

    return cleanup;
  }, [index, dialogues, cleanup, advance, isExiting]);

  const skip = () => {
    cleanup();
    setIsExiting(true);
  };

  const currentLine = dialogues[index];
  if (!currentLine) return null;

  // Speaker logic
  const speakers = [...new Set(dialogues.map(d => d.speaker))];
  const leftSpeakerName = speakers[0];
  const rightSpeakerName = speakers[1] || 'Friend';

  const isLeftSpeakerActive = currentLine.speaker === leftSpeakerName;

  return (
    <div className={`fixed inset-0 z-50 flex flex-col justify-end items-center transition-opacity duration-700 ${isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>

      {/* Background Dim - allows seeing the game/menu behind faintly if desired, or solid black */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>

      {/* Character Portraits Container */}
      <div className="absolute bottom-0 w-full max-w-7xl mx-auto h-full flex justify-between items-end pointer-events-none">
        {/* Left Character */}
        <div
          className={`transition-all duration-500 ease-out transform ${isLeftSpeakerActive ? 'opacity-100 scale-100 translate-x-0 grayscale-0' : 'opacity-40 scale-90 -translate-x-12 grayscale'
            } ${isExiting ? 'translate-y-24 opacity-0' : 'translate-y-0'}`}
        >
          <img
            src='/assets/images/characters/villager03.png'
            alt={leftSpeakerName}
            className="h-[50vh] max-h-[500px] object-contain drop-shadow-[0_0_15px_rgba(0,0,0,0.8)]"
          />
        </div>

        {/* Right Character */}
        <div
          className={`transition-all duration-500 ease-out transform ${!isLeftSpeakerActive ? 'opacity-100 scale-100 translate-x-0 grayscale-0' : 'opacity-40 scale-90 translate-x-12 grayscale'
            } ${isExiting ? 'translate-y-24 opacity-0' : 'translate-y-0'}`}
        >
          <img
            src='/assets/images/characters/villager04.png'
            alt={rightSpeakerName}
            className="h-[50vh] max-h-[500px] object-contain drop-shadow-[0_0_15px_rgba(0,0,0,0.8)]"
          />
        </div>
      </div>

      {/* Dialogue Interface */}
      <div className={`relative z-20 w-full max-w-4xl mb-12 flex flex-col items-center transition-transform duration-500 ${isExiting ? 'translate-y-20' : 'translate-y-0'}`}>

        {/* Main Dialogue Box */}
        <div className="w-full bg-[#1a1a2e]/95 border-2 border-[#d4af37] rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.6)] p-6 min-h-[160px] relative overflow-hidden backdrop-blur-md">

          {/* Decorative Corner Elements */}
          <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-[#d4af37]"></div>
          <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-[#d4af37]"></div>
          <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-[#d4af37]"></div>
          <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-[#d4af37]"></div>

          {/* Speaker Name Label */}
          <div className="absolute -top-4 left-8">
            <div className={`px-6 py-1 rounded-full border border-[#d4af37] text-sm font-bold tracking-widest uppercase shadow-lg ${isLeftSpeakerActive ? 'bg-[#d4af37] text-[#1a1a2e]' : 'bg-[#2c2c54] text-[#d4af37]'
              }`}>
              {currentLine.speaker}
            </div>
          </div>

          {/* Text Content */}
          <p className="mt-4 text-xl md:text-2xl text-gray-100 leading-relaxed font-serif tracking-wide drop-shadow-md">
            {displayText}
            <span className="animate-pulse ml-1 text-[#d4af37]">|</span>
          </p>
        </div>

        {/* Controls Row */}
        <div className="w-full flex flex-col md:flex-row justify-between items-center mt-6 px-4 gap-4">

          {/* Don't Show Again Checkbox */}
          <button
            onClick={() => setDontShowAgain(!dontShowAgain)}
            className="group flex items-center space-x-3 text-[#cccccc] hover:text-white transition-colors"
          >
            <div className={`w-6 h-6 border-2 rounded flex items-center justify-center transition-all ${dontShowAgain ? 'bg-[#d4af37] border-[#d4af37] text-[#1a1a2e]' : 'border-gray-500 group-hover:border-[#d4af37]'
              }`}>
              {dontShowAgain && (
                <svg className="w-4 h-4 font-bold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span className="text-sm font-medium tracking-wide">Don't show this intro again</span>
          </button>

          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            <button
              onClick={skip}
              className="px-6 py-2 text-gray-400 hover:text-white font-medium hover:underline tracking-wider transition-colors"
            >
              Skip All
            </button>
            <button
              onClick={advance}
              className="px-10 py-3 bg-[#d4af37] text-[#1a1a2e] text-lg font-bold rounded-lg 
                         hover:bg-[#ffe74a] transform hover:scale-105 transition-all duration-200 
                         shadow-[0_0_15px_rgba(212,175,55,0.4)] flex items-center gap-2"
            >
              <span>{index + 1 >= dialogues.length ? "Begin Journey" : "Next"}</span>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
