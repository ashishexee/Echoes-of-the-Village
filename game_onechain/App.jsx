import React, { useState } from 'react';
import PhaserGame from './components/PhaserGame';
import Hero from './components/landing';

function App() {
  const [isGameVisible, setGameVisible] = useState(false);

  const handlePlayGame = () => {
    setGameVisible(true);
  };

  if (isGameVisible) {
    return <PhaserGame />;
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