'use client';

import React, { useState } from 'react';
import { BACKEND_IP } from '../config';

type LoginSignupProps = {
  onLogin: (userId: string) => void;
};

export default function LoginSignup({ onLogin }: LoginSignupProps) {
  const [userId, setuserId] = useState('');
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false); // Toggle between login and signup
  const [error, setError] = useState<string | null>(null);

  const handleLoginSignup = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
  
    if (!userId || !password) {
      setError('UserId and password are required.');
      return;
    }
  
    try {
      if (isSignup) {
        const saveUrl = `${BACKEND_IP}/save`;
        const saveParams = {
          type: 'user',
          id: userId,
          user_id: userId,
          content: { password, userId },
        };
  
        const res = await fetch(saveUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(saveParams),
        });
  
        const data = await res.json();
        console.log('Backend Response:', data);  // Debugging
  
        if (!res.ok) throw new Error(data.message || `Server error: ${res.status}`);
  
        if (data.status === 'success') {
          alert('User registered successfully. You can now log in.');
          setIsSignup(false);
        } else {
          throw new Error(data.message || 'Error during signup.');
        }
      } else {
        const loadUrl = `${BACKEND_IP}/load?type=user&user_id=${encodeURIComponent(userId)}`;
  
        const res = await fetch(loadUrl);
        const data = await res.json();
        console.log('Backend Response:', data);  // Debugging
  
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
  
        if (data.status === 'success' && data.content.length > 0) {
          const loginInfo = JSON.parse(data['content']['0']['3']);
          const user = data.content[0];
          if (userId === loginInfo['userId'] && password === loginInfo['password']) {
            sessionStorage.setItem('userId', loginInfo['userId']);
            onLogin(loginInfo['userId']);
            console.log('User logged in:', loginInfo['userId']);
          } else {
            throw new Error('Incorrect password.');
          }
        } else {
          throw new Error('User does not exist.');
        }
      }
    } catch (err) {
      console.error('Error during login/signup:', err);
      setError((err as Error).message || 'Error during login/signup. Please try again.');
    }
  };
  
  

  return (
    <div className="login-signup-page" style={{color : "black"}}>
      <form onSubmit={handleLoginSignup} className="login-signup-form">
        <h2>{isSignup ? 'Sign Up' : 'Log In'}</h2>

        <div className="form-group">
          <label htmlFor="userId">Username:</label>
          <input
            type="text"
            id="userId"
            value={userId}
            onChange={(e) => setuserId(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className="form-group buttons">
          <input
            type="submit"
            value={isSignup ? 'Sign Up' : 'Log In'}
            className="submit-button"
          />
        </div>

        <p style={{color : "black"}}>
          {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            onClick={() => setIsSignup(!isSignup)}
            className="toggle-button"
          >
            {isSignup ? 'Log In' : 'Sign Up'}
          </button>
        </p>

        {error && <div className="error">{error}</div>}
      </form>

      <style jsx>{`
        .login-signup-page {
          max-width: 400px;
          margin: 0 auto;
          padding: 20px;
          font-family: Arial, sans-serif;
        }

        .login-signup-form {
          background-color: #f9f9f9;
          padding: 20px;
          border-radius: 5px;
        }

        .login-signup-form h2 {
          text-align: center;
          margin-bottom: 20px;
          color: #333;
        }

        .form-group {
          margin-bottom: 15px;
        }

        .form-group label {
          display: block;
          font-weight: bold;
          margin-bottom: 5px;
          color: #555;
        }

        .form-group input {
          width: 100%;
          padding: 8px;
          box-sizing: border-box;
          border: 1px solid #ccc;
          border-radius: 3px;
        }

        .form-group.buttons {
          display: flex;
          justify-content: center;
          margin-top: 20px;
        }

        .submit-button {
          padding: 10px 15px;
          background-color: #007bff;
          color: #fff;
          border: none;
          border-radius: 3px;
          cursor: pointer;
        }

        .submit-button:hover {
          background-color: #0069d9;
        }

        .toggle-button {
          background: none;
          border: none;
          color: #007bff;
          cursor: pointer;
          text-decoration: underline;
          font-size: 1em;
          padding: 0;
        }

        .error {
          margin-top: 20px;
          color: #dc3545;
          text-align: center;
        }
      `}</style>
    </div>
  );
}
