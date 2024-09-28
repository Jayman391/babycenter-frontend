// app/query.tsx

"use client"; // Ensure this is the first line

import React, { useState, useEffect } from 'react';
import { BACKEND_IP } from './config'; // Import from config.ts

export default function Query() {
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (submittedQuery) {
      fetch(`${BACKEND_IP}/query/${encodeURIComponent(submittedQuery)}`)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          setData(data);
          setError(null); // Clear any previous errors
        })
        .catch((error: Error) => {
          setError(error.message);
          setData(null); // Clear any previous data
        });

      }
  }, [submittedQuery]);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevent the default form submission behavior
    if (query.trim() === '') {
      setError('Query cannot be empty.');
      setData(null);
      return;
    }
    setSubmittedQuery(query); // Set the query for useEffect to trigger
  };

  return (
    <div>
      <h1>Query</h1>

      <form onSubmit={handleSubmit}>
        <label>
          Query:
          <input
            type="text"
            name="query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <input type="submit" value="Submit" />
      </form>


      {/* Display data or error */}
      {data && (
        <div>
          <h2>Data:</h2>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
      {error && (
        <div style={{ color: 'red' }}>
          <h2>Error:</h2>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}
