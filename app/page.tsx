'use client';

import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

export default function Home() {
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState<{ username: string; message: string }[]>([]);
  const [socket, setSocket] = useState<ReturnType<typeof io> | null>(null);
  const [isUsernameSet, setIsUsernameSet] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    newSocket.on('chatMessage', (msg: { username: string; message: string }) => {
      setChat((prevChat) => [...prevChat, msg]);
    });

    newSocket.on('userJoined', (user: string) => {
      setChat((prevChat) => [...prevChat, { username: 'System', message: `${user} has joined the chat` }]);
    });

    newSocket.on('userLeft', (user: string) => {
      setChat((prevChat) => [...prevChat, { username: 'System', message: `${user} has left the chat` }]);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chat]);

  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() && socket) {
      socket.emit('setUsername', username);
      setIsUsernameSet(true);
    }
  };

  const handleMessageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && socket && isUsernameSet) {
      socket.emit('chatMessage', message);
      setMessage('');
    }
  };

  return (
    <div className="container mx-auto p-4">
      {!socket ? (
        <div>Connecting to server...</div>
      ) : !isUsernameSet ? (
        <form onSubmit={handleUsernameSubmit} className="flex flex-col items-center">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="border p-2 mb-2"
            placeholder="Enter your username"
          />
          <button type="submit" className="bg-green-500 text-white px-4 py-2">Join Chat</button>
        </form>
      ) : (
        <div className="flex flex-col h-screen">
          <div className="flex-grow overflow-auto mb-4" ref={chatContainerRef}>
            {chat.map((msg, index) => (
              <div key={index} className="mb-2">
                <span className="font-bold">{msg.username}: </span>
                {msg.message}
              </div>
            ))}
          </div>
          <form onSubmit={handleMessageSubmit} className="flex">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-grow border p-2 mr-2"
              placeholder="Type a message..."
            />
            <button type="submit" className="bg-blue-500 text-white px-4 py-2">Send</button>
          </form>
        </div>
      )}
    </div>
  );
}
