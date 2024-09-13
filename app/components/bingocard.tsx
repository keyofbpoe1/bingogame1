import React, { useState, useEffect } from 'react';
import fallacies from '../fallacies.json';

interface BingoCardProps {
  onWin: (winningValues: string[]) => void;
  disabled: boolean;
  winningValues: string[];
}

const generateBingoCard = () => {
  const shuffled = [...fallacies].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 25);
};

const BingoCard: React.FC<BingoCardProps> = ({ onWin, disabled, winningValues }) => {
  const [bingoCard, setBingoCard] = useState<typeof fallacies>([]);
  const [selectedFallacies, setSelectedFallacies] = useState<Set<string>>(new Set());
  const [winner, setWinner] = useState(false);
  const [hoveredFallacy, setHoveredFallacy] = useState<string | null>(null);

  useEffect(() => {
    setBingoCard(generateBingoCard());
  }, []);

  const toggleFallacy = (fallacy: string) => {
    const newSelectedFallacies = new Set(selectedFallacies);
    if (selectedFallacies.has(fallacy)) {
      newSelectedFallacies.delete(fallacy);
    } else {
      newSelectedFallacies.add(fallacy);
    }
    setSelectedFallacies(newSelectedFallacies);
    checkWinner(newSelectedFallacies);
  };

  const checkWinner = (selected: Set<string>) => {
    const winningCombinations = [
      [0, 1, 2, 3, 4],
      [5, 6, 7, 8, 9],
      [10, 11, 12, 13, 14],
      [15, 16, 17, 18, 19],
      [20, 21, 22, 23, 24],
      [0, 5, 10, 15, 20],
      [1, 6, 11, 16, 21],
      [2, 7, 12, 17, 22],
      [3, 8, 13, 18, 23],
      [4, 9, 14, 19, 24],
      [0, 6, 12, 18, 24],
      [4, 8, 12, 16, 20],
    ];

    for (const combination of winningCombinations) {
      if (combination.every(index => selected.has(bingoCard[index].name))) {
        setWinner(true);
        const winningValues = combination.map(index => bingoCard[index].name);
        onWin(winningValues);
        return;
      }
    }
  };

  const resetGame = () => {
    setBingoCard(generateBingoCard());
    setSelectedFallacies(new Set());
    setWinner(false);
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-8">Fallacy Bingo</h1>
      <div className="grid grid-cols-5 gap-2 mb-8">
        {bingoCard.map((fallacy, index) => (
          <div key={index} className="relative">
            <button
              className={`w-32 h-32 text-xs font-bold rounded p-2 ${
                selectedFallacies.has(fallacy.name)
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-black'
              }`}
              onClick={() => toggleFallacy(fallacy.name)}
              disabled={winner || disabled}
              onMouseEnter={() => setHoveredFallacy(fallacy.name)}
              onMouseLeave={() => setHoveredFallacy(null)}
            >
              {fallacy.name}
            </button>
            {hoveredFallacy === fallacy.name && (
              <div className="absolute z-10 bg-white text-black p-2 rounded shadow-lg text-xs w-48 top-full left-1/2 transform -translate-x-1/2 mt-2">
                {fallacy.definition}
              </div>
            )}
          </div>
        ))}
      </div>
      {winner && (
        <div className="text-2xl font-bold text-green-500 mb-4">
          Congratulations! You won!
        </div>
      )}
      <button
        className="bg-green-500 text-white px-4 py-2 rounded"
        onClick={resetGame}
        disabled={disabled}
      >
        New Game
      </button>
    </div>
  );
};

export default BingoCard;