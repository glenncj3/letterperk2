import { useState, useEffect } from 'react';
import { GameProvider, useGameState } from './contexts/GameContext';
import { GameHeader } from './components/game/GameHeader';
import { WordDisplay } from './components/game/WordDisplay';
import { GameBoard } from './components/game/GameBoard';
import { GameControls } from './components/game/GameControls';
import { HowToPlayModal } from './components/modals/HowToPlayModal';
import { GameOverModal } from './components/modals/GameOverModal';
import { DailyAlreadyPlayedModal } from './components/modals/DailyAlreadyPlayedModal';

function GameContainer() {
  const { state, actions } = useGameState();
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  useEffect(() => {
    actions.initializeGame('daily');
  }, []);

  const handlePlayAgain = () => {
    actions.initializeGame(state.gameMode, true);
  };

  if (state.isLoading) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-2xl font-semibold text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <GameHeader onHelpClick={() => setShowHowToPlay(true)} />
      <WordDisplay />
      <GameBoard />
      <GameControls />

      <footer className="w-full max-w-[25.2rem] mx-auto px-4 py-1.5 text-center text-[10px] text-gray-500">
        © 2025 Glenn Jones
      </footer>

      <HowToPlayModal
        isOpen={showHowToPlay}
        onClose={() => setShowHowToPlay(false)}
      />

      <GameOverModal
        isOpen={state.gameStatus === 'gameover'}
        onPlayAgain={handlePlayAgain}
      />

      <DailyAlreadyPlayedModal
        isOpen={state.dailyGameAlreadyPlayed !== null && state.gameStatus !== 'gameover'}
        onClose={() => actions.clearDailyGameAlreadyPlayed()}
        score={state.dailyGameAlreadyPlayed?.score ?? 0}
      />

      {state.error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg">
          {state.error}
          <button
            onClick={actions.clearError}
            className="ml-4 underline"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <GameProvider>
      <GameContainer />
    </GameProvider>
  );
}

export default App;
