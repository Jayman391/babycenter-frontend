'use client';

import React, { useState } from 'react';
import { BACKEND_IP } from '../config'; // Ensure the path is correct

// Define the shape of the response from the backend
interface QueryResponse {
  status: string;
  message: string;
  content: {
    language: string;
    format: string;
    start: string;
    end: string;
    keywords: string[];
  } | null;
}

export default function QueryPage() {
  // State variables for form inputs
  const [country, setCountry] = useState<string>('');
  const [format, setFormat] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState<string>('');

  // State variables for handling responses and loading state
  const [response, setResponse] = useState<QueryResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setResponse(null);

    // Encode keywords as comma-separated values
    const encodedKeywords = keywords.map(keyword => encodeURIComponent(keyword)).join(',');

    // Construct the URL with path parameters
    const url = `${BACKEND_IP}/query/${encodeURIComponent(country)}/${encodeURIComponent(format)}/${encodeURIComponent(startDate)}/${encodeURIComponent(endDate)}/${encodedKeywords}/`;

    try {
      const res = await fetch(url, { method: 'GET' });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const data: QueryResponse = await res.json();
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
      <h1>Query Page</h1>


      <form onSubmit={handleSubmit}>
        {/* Language Selection */}
        <div>
          <label htmlFor="country">Country:</label>
          <select
            id="country"
            name="country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            required
            style={{ color: 'black' }}
          >
            <option value="">Select a language</option>
            <option value="English">English</option>
            <option value="Spanish">Spanish</option>
            {/* Add more languages as needed */}
          </select>
        </div>

        {/* Format Selection */}
        <div>
          <label htmlFor="format">Format:</label>
          <select
            id="format"
            name="format"
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            required
            style={{ color: 'black' }}
          >
            <option value="">Select a format</option>
            <option value="PDF">PDF</option>
            <option value="DOCX">DOCX</option>
            {/* Add more formats as needed */}
          </select>
        </div>

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
          <label htmlFor="keywords"></label>
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
      {response && response.status === 'success' && response.content && (
        <div>
          <h2>Response from Server:</h2>
          <pre>{JSON.stringify(response, null, 2)}</pre>
        </div>
      )}

      {/* Display Error Message from Server */}
      {response && response.status === 'error' && (
        <div>
          <h2>Error from Server:</h2>
          <p style={{ color: 'red' }}>{response.message}</p>
        </div>
      )}
    </div>
  );
}
