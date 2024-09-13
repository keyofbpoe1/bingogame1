'use client';

import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import BingoCard from '../components/bingocard';

export default function BingoGame() {
  const [socket, setSocket] = useState<ReturnType<typeof io> | null>(null);
  const [username, setUsername] = useState('');
  const [isUsernameSet, setIsUsernameSet] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [users, setUsers] = useState<string[]>([]);
  const [gameEnded, setGameEnded] = useState(false);
  const [winnerMessage, setWinnerMessage] = useState<string | null>(null);
  const [winningSquares, setWinningSquares] = useState<number[]>([]);
  const [winningValues, setWinningValues] = useState<string[]>([]);

  useEffect(() => {
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    newSocket.on('bingoWinner', (winnerName: string) => {
      setWinner(winnerName);
      setGameEnded(true);
      setWinnerMessage(`${winnerName} has won the game!`);
    });

    newSocket.on('userJoined', (user: string) => {
      setUsers((prevUsers) => [...prevUsers, user]);
    });

    newSocket.on('userLeft', (user: string) => {
      setUsers((prevUsers) => prevUsers.filter((u) => u !== user));
    });

    newSocket.on('currentUsers', (currentUsers: string[]) => {
      setUsers(currentUsers);
    });

    newSocket.on('winnerMessage', (message: string) => {
      setWinnerMessage(message);
    });

    newSocket.on('gameEnded', (data: { winnerName: string, winningValues: string[] }) => {
      console.log('Game ended data:', data);
      setWinner(data.winnerName);
      setGameEnded(true);
      setWinningValues(data.winningValues);
    });

    newSocket.on('winnerAnnouncement', (message: string) => {
      setWinnerMessage(message);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() && socket) {
      socket.emit('setUsername', username);
      setIsUsernameSet(true);
    }
  };

  const startNewGame = () => {
    setGameEnded(false);
    setWinner(null);
    setWinnerMessage(null);
    socket?.emit('newGame');
  };

  const handleWin = (winningValues: string[]) => {
    if (socket) {
      socket.emit('winGame', { username, winningValues });
    }
  };

  if (!socket) {
    return <div>Connecting to server...</div>;
  }

  if (!isUsernameSet) {
    return (
      <form onSubmit={handleUsernameSubmit} className="flex flex-col items-center">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="border p-2 mb-2 text-gray-800"
          placeholder="Enter your username"
        />
        <button type="submit" className="bg-green-500 text-white px-4 py-2">Join Bingo Game</button>
      </form>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Bingo Game</h1>
      {winnerMessage && (
        <div className="mt-4 text-center text-xl font-bold text-green-600">
          {winnerMessage}
        </div>
      )}
      {gameEnded && winner && (
        <div className="mt-4 text-center">
          {/* <p className="text-xl font-bold text-green-600">
            {winner} has won the game!
          </p> */}
          <p className="mt-2">Winning fallacies: {winningValues?.join(', ') || 'None'}</p>
        </div>
      )}
      <div className="mb-4">
        <h2 className="text-xl font-bold">Players:</h2>
        <ul>
          {users.map((user, index) => (
            <li key={index} className={`${user === username ? "font-bold" : ""} ${user === winner ? "text-green-600" : ""}`}>
              {user} {user === username && "(You)"} {user === winner && "(Winner!)"}
            </li>
          ))}
        </ul>
      </div>
      <BingoCard 
        onWin={(winningValues) => handleWin(winningValues)} 
        disabled={gameEnded} 
        winningValues={winningValues}
      />
    </div>
  );
}
