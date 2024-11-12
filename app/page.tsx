'use client';

import React, { useState, useEffect, CSSProperties } from 'react';
import QueryPage from './query/page';
import NgramPage from './ngram/page';
import GroupNgramPage from './group/page';

sessionStorage.setItem('sessionID', Math.random().toString()); // Set userId on mount

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
    flexDirection: 'column', // Stack elements horizontally
    width: '100%',
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
        <div style={contentContainerStyle}>
          <div style={pageStyle}>
            <QueryPage />
          </div>
          <div style={pageStyle}>
            <NgramPage />
          </div>
          <div style={pageStyle}>
            <GroupNgramPage />
          </div>
        </div>
    </div>
  );
}
