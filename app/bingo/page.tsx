'use client';

import { useState, useEffect } from 'react';
import io from 'socket.io-client';

const BINGO_SIZE = 5;
const TOTAL_NUMBERS = 75;

type BingoCell = {
  number: number;
  marked: boolean;
};

export default function BingoGame() {
  const [socket, setSocket] = useState<ReturnType<typeof io> | null>(null);
  const [board, setBoard] = useState<BingoCell[][]>([]);
  const [username, setUsername] = useState('');
  const [isUsernameSet, setIsUsernameSet] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [users, setUsers] = useState<string[]>([]);
  const [gameEnded, setGameEnded] = useState(false);
  const [winnerMessage, setWinnerMessage] = useState<string | null>(null);

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

    newSocket.on('gameEnded', (winnerName: string) => {
      setWinner(winnerName);
      setGameEnded(true);
      setWinnerMessage(`${winnerName} has won the game!`);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (isUsernameSet) {
      generateBoard();
    }
  }, [isUsernameSet]);

  const generateBoard = () => {
    const numbers = Array.from({ length: TOTAL_NUMBERS }, (_, i) => i + 1);
    const shuffled = numbers.sort(() => 0.5 - Math.random());
    const newBoard: BingoCell[][] = [];

    for (let i = 0; i < BINGO_SIZE; i++) {
      const row: BingoCell[] = [];
      for (let j = 0; j < BINGO_SIZE; j++) {
        row.push({ number: shuffled[i * BINGO_SIZE + j], marked: false });
      }
      newBoard.push(row);
    }

    setBoard(newBoard);
  };

  const markNumber = (row: number, col: number) => {
    if (gameEnded) return; // Prevent marking after game has ended

    const newBoard = [...board];
    newBoard[row][col].marked = !newBoard[row][col].marked;
    setBoard(newBoard);

    if (checkBingo()) {
      socket?.emit('bingo', username);
      setWinner(username);
      setGameEnded(true);
      const message = `${username} has won the game!`;
      setWinnerMessage(message);
      socket?.emit('winnerMessage', message);
    }
  };

  const checkBingo = () => {
    // Check rows and columns
    for (let i = 0; i < BINGO_SIZE; i++) {
      if (board[i].every(cell => cell.marked) || board.every(row => row[i].marked)) {
        return true;
      }
    }

    // Check diagonals
    if (board.every((row, i) => row[i].marked) || board.every((row, i) => row[BINGO_SIZE - 1 - i].marked)) {
      return true;
    }

    return false;
  };

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
    generateBoard();
    socket?.emit('newGame');
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
          className="border p-2 mb-2"
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
        <div className="mb-4 text-xl font-bold text-green-600">
          {winnerMessage}
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
      <div className="grid grid-cols-5 gap-2">
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <button
              key={`${rowIndex}-${colIndex}`}
              onClick={() => markNumber(rowIndex, colIndex)}
              className={`p-4 border ${cell.marked ? 'bg-green-200' : 'bg-white'} ${gameEnded ? 'cursor-not-allowed' : ''}`}
              disabled={gameEnded}
            >
              {cell.number}
            </button>
          ))
        )}
      </div>
      {gameEnded && (
        <div className="mt-4 text-center">
          <p className="text-xl font-bold">Game Over</p>
          <p>The game has ended. Thank you for playing!</p>
          <button onClick={startNewGame} className="mt-4 bg-blue-500 text-white px-4 py-2 rounded">
            Start New Game
          </button>
        </div>
      )}
    </div>
  );
}
