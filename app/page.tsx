'use client';

import React, { useState, useEffect, CSSProperties } from 'react';
import QueryPage from './query/page';
import NgramPage from './ngram/page';
import LoginSignup from './login/page';

export default function Home() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const storedUserId = sessionStorage.getItem('userId'); // Retrieve userId on mount
    if (storedUserId) setUserId(storedUserId);
  }, []);

  const handleSetUserId = (id: string) => setUserId(id);

  const homePageStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: 'black',
  };

  const contentContainerStyle: CSSProperties = {
    display: 'flex',
    width: '80%',
    gap: '20px',
  };

  const pageStyle: CSSProperties = {
    flex: 1,
    backgroundColor: 'black',
    padding: '20px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    borderRadius: '8px',
  };

  return (
    <div style={homePageStyle}>
      {!userId ? (
        <LoginSignup onLogin={handleSetUserId} />
      ) : (
        <div style={contentContainerStyle}>
          <div style={pageStyle}>
            <QueryPage userId={userId} />
          </div>
          <div style={pageStyle}>
            <NgramPage userId={userId} />
          </div>
        </div>
      )}
    </div>
  );
}
