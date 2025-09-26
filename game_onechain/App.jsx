import React, { useState, useRef, useEffect } from 'react';
import { ethers } from 'ethers';
import Hero from './components/landing';
import IntroductionPanel from './components/IntroductionPanel';
import CharacterIntro from './components/CharacterIntro';
import GameplayMechanics from './components/GameplayMechanics';
import Conversation from './components/Conversation';
import GameModeSelection from './components/gameModeSelection';

function App() {
  const [showConversation, setShowConversation] = useState(false);
  const [hasConversationTriggered, setHasConversationTriggered] = useState(false);
  const [walletAddress, setWalletAddress] = useState(null);
  const [selectedChain, setSelectedChain] = useState('0G');
  const videoRef = useRef(null);

  const dialogues = [
    { speaker: 'You', text: "Ugh... Where am I? My head... what happened?", portrait: '/assets/character_portraits/hemlock.png' },
    { speaker: 'Villager', text: "You were in an accident. I found you unconscious near a broken car.", portrait: '/assets/character_portraits/elara.png' },
    { speaker: 'You', text: "My friends! Did you see them? Were they with me?", portrait: '/assets/character_portraits/hemlock.png' },
    { speaker: 'Villager', text: "I’m sorry… I didn’t see anyone else. But perhaps they are still in the village.", portrait: '/assets/character_portraits/elara.png' },
    { speaker: 'You', text: "Then I have to find them. Please, can you help me?", portrait: '/assets/character_portraits/hemlock.png' },
    { speaker: 'Villager', text: "I will guide you. Search the village — maybe you’ll find answers there.", portrait: '/assets/character_portraits/elara.png' },
  ];

  const handleConnectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      alert("MetaMask not found. Please install the browser extension.");
      return;
    }
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setWalletAddress(address);
    } catch (error) {
      console.error("Wallet connection failed:", error);
      alert("Could not connect to the wallet.");
    }
  };

  const handlePlaySingle = () => {
    const chain = selectedChain.toLowerCase();
    const targetUrl = {
      'flow': 'http://localhost:5175',
      '0g': 'http://localhost:5176',
      'world': 'http://localhost:5177'
    }[chain];

    if (targetUrl) {
      // In production, you might use relative paths like `/${chain}/`
      window.location.href = targetUrl;
    } else {
      alert(`Game for ${selectedChain} is not available yet.`);
    }
  };

  const handleCreateRoom = () => alert("Create Room feature coming soon!");
  const handleJoinRoom = () => alert("Join Room feature coming soon!");

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100 && !hasConversationTriggered) {
        setShowConversation(true);
        setHasConversationTriggered(true);
      }
    };
    if (!hasConversationTriggered) {
      window.addEventListener('scroll', handleScroll);
    }
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasConversationTriggered]);

  return (
    <div className="bg-gray-900">
      <video
        ref={videoRef}
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
          {!walletAddress ? (
            <Hero
              onConnectClick={handleConnectWallet}
              selectedChain={selectedChain}
              onChainSelect={setSelectedChain}
            />
          ) : (
            <GameModeSelection
              onPlaySingle={handlePlaySingle}
              onCreateRoom={handleCreateRoom}
              onJoinRoom={handleJoinRoom}
            />
          )}
          {showConversation && (
            <Conversation
              dialogues={dialogues}
              onComplete={() => setShowConversation(false)}
            />
          )}
          <IntroductionPanel />
          <CharacterIntro />
          <GameplayMechanics onPlayClick={handlePlaySingle} />
        </main>
      </div>
    </div>
  );
}

export default App;

