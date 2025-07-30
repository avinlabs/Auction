
import React, { useState, useEffect } from 'react';
import { User } from '../types.ts';
import { UserCircleIcon } from './icons.tsx';

// --- Seeding Data for Multi-User Simulation ---
const seedInitialUsers = () => {
    if (!localStorage.getItem('cricket-auction-users')) {
        const users = [
            { username: 'admin', password: 'pass', role: 'admin' },
            { username: 'user1', password: 'pass', role: 'user' },
            { username: 'user2', password: 'pass', role: 'user' },
            { username: 'user3', password: 'pass', role: 'user' },
            { username: 'user4', password: 'pass', role: 'user' },
        ];
        localStorage.setItem('cricket-auction-users', JSON.stringify(users));
        console.log('Initial users have been seeded into localStorage.');
    }
};

// --- Component ---
interface AuthProps {
  onAuthSuccess: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    seedInitialUsers();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password.trim()) {
        setError('Username and password cannot be empty.');
        return;
    }

    try {
        const users = JSON.parse(localStorage.getItem('cricket-auction-users') || '[]');
        
        if (isLogin) {
            const user = users.find((u: any) => u.username === username && u.password === password);
            if (user) {
                onAuthSuccess({ username: user.username, role: user.role });
            } else {
                setError('Invalid credentials. Please try again or register.');
            }
        } else { // Register
            const existingUser = users.find((u: any) => u.username === username);
            if (existingUser) {
                setError('Username already exists. Please choose another one or log in.');
            } else {
                const newUser = { username, password, role: 'user' as const }; // New registrations are always 'user'
                users.push(newUser);
                localStorage.setItem('cricket-auction-users', JSON.stringify(users));
                onAuthSuccess({ username: newUser.username, role: newUser.role });
            }
        }
    } catch (err) {
        setError('An unexpected error occurred. Please try again.');
        console.error(err);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto mt-10">
      <form onSubmit={handleSubmit} className="bg-cricket-900/50 backdrop-blur-sm p-8 rounded-xl shadow-2xl border border-cricket-700">
        <div className="text-center mb-8">
            <UserCircleIcon className="mx-auto h-16 w-16 text-gold-400"/>
            <h2 className="mt-4 text-3xl font-bold text-white">{isLogin ? 'Welcome Back!' : 'Create Account'}</h2>
            <p className="text-gray-400">{isLogin ? 'Sign in to continue' : 'Get started with your auction'}</p>
        </div>

        {error && <div className="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded-lg mb-6 text-sm">{error}</div>}

        <div className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-cricket-800 border border-cricket-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-gold-500 focus:outline-none transition-colors"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-cricket-800 border border-cricket-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-gold-500 focus:outline-none transition-colors"
              required
            />
          </div>
        </div>

        <div className="mt-8">
          <button type="submit" className="w-full bg-gold-500 hover:bg-gold-400 text-cricket-950 font-bold py-3 px-4 rounded-lg transition-colors duration-300 text-lg">
            {isLogin ? 'Login' : 'Register'}
          </button>
        </div>

        <div className="mt-6 text-center">
            <button type="button" onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-sm text-gold-400 hover:text-gold-300 font-medium">
                {isLogin ? 'Need an account? Register' : 'Already have an account? Login'}
            </button>
        </div>
      </form>
    </div>
  );
};

export default Auth;
