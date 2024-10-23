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
    backgroundColor: 'black',
    minHeight: '100vh',
  };

  const contentContainerStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column', // Stack elements vertically
    width: '80%',
    gap: '20px', // Add space between stacked pages
  };

  const pageStyle: CSSProperties = {
    backgroundColor: 'black',
    padding: '20px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    borderRadius: '8px',
    width: '100%', // Make each page take full width
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
