import React, { useState, useEffect } from 'react';
import PhaserGame from './components/phaserGame';
import Hero from './components/landing';
import Conversation from './components/conversation';

// Story dialogues
// Story dialogues
const STORY_DIALOGUES = [
  { speaker: "Narrator", text: "A storm... a sudden crash... then darkness. You wake up alone in this strange, misty village." },
  { speaker: "Narrator", text: "Your friends are missing, but the villagers whisper that others arrived in the night." },
  { speaker: "Elder", text: "Welcome. To find your lost companions, you must earn our trust." },
  { speaker: "Elder", text: "Some will help you properly, others are greedy. Talk to everyone, collect hints, and hurry..." },
];

function App() {
  const [isGameVisible, setGameVisible] = useState(false);
  const [showStory, setShowStory] = useState(false);

  // Function to enter fullscreen
  const enterFullScreen = () => {
    const docEl = document.documentElement;
    if (docEl.requestFullscreen) {
      docEl.requestFullscreen().catch((err) => {
        console.warn(`Error attempting to enable fullscreen: ${err.message}`);
      });
    }
  };

  const handlePlayGame = () => {
    enterFullScreen(); // Request full screen on user interaction

    // Check if user has opted to skip the story
    const shouldSkip = localStorage.getItem('skipStoryIntro') === 'true';

    if (shouldSkip) {
      setGameVisible(true);
    } else {
      setShowStory(true);
    }
  };

  const handleStoryComplete = () => {
    setShowStory(false);
    setGameVisible(true);
  };

  if (isGameVisible) {
    return <PhaserGame />;
  }

  // Render Story Introduction
  if (showStory) {
    return (
      <div className="bg-gray-900 w-full h-screen relative">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute top-0 left-0 w-full h-full object-cover z-0"
          style={{ filter: 'blur(5px) brightness(0.4)' }}
        >
          <source src="/assets/cut-scene/landing_bg_video.mp4" type="video/mp4" />
        </video>
        <Conversation
          dialogues={STORY_DIALOGUES}
          onComplete={handleStoryComplete}
        />
      </div>
    );
  }

  return (
    <div className="bg-gray-900">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover z-0"
        style={{ filter: 'blur(3px) brightness(0.6)' }}
      >
        <source src="/assets/cut-scene/landing_bg_video.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      <div style={{ position: 'relative', zIndex: 10, backgroundColor: 'rgba(0,0,0,0.45)' }}>
        <main>
          <Hero onPlayClick={handlePlayGame} />
        </main>
      </div>
    </div>
  );
}

export default App;