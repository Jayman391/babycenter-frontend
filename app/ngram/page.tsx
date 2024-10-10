'use client';

import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { BACKEND_IP } from '../config';

export default function NgramPage() {
  // State variables for form inputs
  const [startDate, setStartDate] = useState<string>('2010-01-01');
  const [endDate, setEndDate] = useState<string>('2024-03-01');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState<string>('');

  const router = useRouter(); // Get access to the router
  const [userId, setUserId] = useState<string | null>(null); // State to store the user ID

  // Use useEffect to extract user_id from the URL once the component is mounted
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search); // Get query parameters from the URL
      const userIdFromQuery = params.get('user_id');
      if (userIdFromQuery) {
        setUserId(userIdFromQuery); // Set the user ID
      }
    }
  }, []); // Run only on component mount

  // State variables for handling responses and loading state
  const [response, setResponse] = useState<any | null>(null); // Flexible response handling
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setResponse(null);

    // Ensure keywords have default values if empty
    const finalKeywords = keywords.length > 0 ? keywords : ['all'];

    // Encode keywords as comma-separated values
    const encodedKeywords = finalKeywords.map(keyword => encodeURIComponent(keyword)).join(',');

    // Convert start and end dates to integer format (YYYYMMDD)
    const startDateInt = parseInt(startDate.replace(/-/g, ''), 10);
    const endDateInt = parseInt(endDate.replace(/-/g, ''), 10);

    // Construct the URL using query parameters
    const url = `${BACKEND_IP}/ngram?user_id=${userId}&startDate=${startDateInt}&endDate=${endDateInt}&keywords=${encodedKeywords}`;

    try {
      const res = await fetch(url, { method: 'GET' });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const data = await res.json();
      setResponse(data);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Error fetching data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle changes in the keyword input field
  const handleKeywordChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setKeywordInput(event.target.value);
  };

  // Handle adding a keyword to the list
  const handleKeywordAdd = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedKeyword = keywordInput.trim();
    if (trimmedKeyword !== '') {
      setKeywords(prevKeywords => [...prevKeywords, trimmedKeyword]);
      setKeywordInput('');
    }
  };

  // Handle removing a keyword from the list
  const handleKeywordRemove = (index: number) => {
    setKeywords(prevKeywords => prevKeywords.filter((_, i) => i !== index));
  };

  return (
    <div>
      <h1>N-Gram Visualization Page</h1>
      <form onSubmit={handleSubmit}>
        {/* Start Date */}
        <div>
          <label htmlFor="startDate">Start Date:</label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            style={{ color: 'black' }}
          />
        </div>

        {/* End Date */}
        <div>
          <label htmlFor="endDate">End Date:</label>
          <input
            type="date"
            id="endDate"
            name="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
            style={{ color: 'black' }}
          />
        </div>

        {/* Keywords Input */}
        <div>
          <label htmlFor="keywords">Add Keywords:</label>
          <textarea
            id="keywords"
            name="keywords"
            value={keywordInput}
            onChange={handleKeywordChange}
            placeholder="Enter a keyword"
            rows={3}
            style={{ color: 'black' }}
          />
          <button type="button" onClick={handleKeywordAdd}>
            Add Keyword
          </button>
        </div>

        {/* Display Added Keywords */}
        {keywords.length > 0 && (
          <ul>
            {keywords.map((keyword, index) => (
              <li key={index}>
                {keyword}{' '}
                <button type="button" onClick={() => handleKeywordRemove(index)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Submit Button */}
        <div>
          <input type="submit" value="Submit" />
        </div>
      </form>

      {/* Loading Indicator */}
      {isLoading && <p>Loading...</p>}

      {/* Error Message */}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Display Response */}
      {response && (
        <div>
          <h2>Response from Server:</h2>
          <pre>{JSON.stringify(response, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
