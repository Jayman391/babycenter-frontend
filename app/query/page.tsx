'use client';

import React, { useEffect, useState } from 'react';
import { BACKEND_IP } from '../config';

type QueryPageProps = {
  userId: string;
};

export default function QueryPage({ userId }: QueryPageProps) {
  const [country, setCountry] = useState('USA');
  const [startDate, setStartDate] = useState('2010-01-01');
  const [endDate, setEndDate] = useState('2024-03-01');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [queryName, setQueryName] = useState(''); // Added for saving queries
  const [savedQueries, setSavedQueries] = useState<any[]>([]); // For loading saved queries
  const [selectedQuery, setSelectedQuery] = useState<string>('');
  const [response, setResponse] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch saved queries on mount
  useEffect(() => {
    const fetchSavedQueries = async () => {
      const url = `${BACKEND_IP}/load?computed_type=query&name=${encodeURIComponent(userId)}`;
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        const data = await res.json();
        setSavedQueries(data.content || []);
      } catch (err: any) {
        setError(err.message || 'Error loading saved queries.');
      }
    };
    fetchSavedQueries();
  }, []);

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setResponse(null);

    const encodedKeywords = keywords.length > 0
      ? keywords.map((keyword) => encodeURIComponent(keyword)).join(',')
      : 'all';

    const startDateInt = parseInt(startDate.replace(/-/g, ''), 10);
    const endDateInt = parseInt(endDate.replace(/-/g, ''), 10);

    const url = `${BACKEND_IP}/query?user_id=${encodeURIComponent(
      userId
    )}&country=${encodeURIComponent(country)}&startDate=${startDateInt}&endDate=${endDateInt}&keywords=${encodedKeywords}&groups=all&num_comments=-1&post_or_comment=posts&num_documents=50`;

    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }
      const data = await res.json();
      setResponse(data.response);
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle saving a query
  const handleSaveQuery = async () => {
    if (!queryName.trim()) {
      alert('Please provide a name for your query before saving.');
      return;
    }
  
    const saveUrl = `${BACKEND_IP}/save`;
    const saveParams = {
      type: 'query',
      name: queryName, // Query name (query identifier)
      _id: `${userId}-${queryName}`, // Unique ID combining userId and query name
      content: {
        userId, // Ensure the userId is passed
        country,
        startDate,
        endDate,
        keywords,
      },
    };
  
    try {
      const res = await fetch(saveUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saveParams),
      });
  
      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }
  
      alert('Query saved successfully.');
      setQueryName(''); // Reset query name after saving
    } catch (err: any) {
      setError(err.message || 'Error saving query.');
    }
  };
  

  // Handle loading a saved query
  const handleLoadQuery = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const queryId = event.target.value;
    setSelectedQuery(queryId);

    const selectedQuery = savedQueries.find((query) => query._id === queryId);
    if (selectedQuery) {
      const { country, startDate, endDate, keywords } = selectedQuery.content;
      setCountry(country || 'USA');
      setStartDate(startDate || '2010-01-01');
      setEndDate(endDate || '2024-03-01');
      setKeywords(keywords || []);
    }
  };

  const handleKeywordAdd = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedKeyword = keywordInput.trim();
    if (trimmedKeyword !== '') {
      setKeywords([...keywords, trimmedKeyword]);
      setKeywordInput('');
    }
  };

  return (
    <div className="query-page" style={{color : 'black'}}>
      <form onSubmit={handleSubmit} className="query-form">
        <h2>Custom Query</h2>

        <div className="form-group">
          <label htmlFor="country">Country:</label>
          <select
            id="country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            required
            style={{
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              marginTop: '5px',
            }}
          >
            <option value="" disabled>
              Select a country
            </option>
            <option value="USA">USA</option>
            <option value="Brazil">Brazil</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="startDate">Start Date:</label>
          <input
            type="date"
            id="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="endDate">End Date:</label>
          <input
            type="date"
            id="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="keywords">Keywords:</label>
          <div className="input-group">
            <input
              type="text"
              id="keywords"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              placeholder="Enter a keyword"
            />
            <button type="button" onClick={handleKeywordAdd}>
              Add 
            </button>
          </div>
          <ul className="keyword-list">
            {keywords.map((keyword, index) => (
              <li key={index}>{keyword}</li>
            ))}
          </ul>
        </div>

        <div className="form-group">
          <label htmlFor="queryName">Query Name:</label>
          <input
            type="text"
            id="queryName"
            value={queryName}
            onChange={(e) => setQueryName(e.target.value)}
            placeholder="Enter a name for your query"
          />
          <button type="button" onClick={handleSaveQuery}>
            Save Query
          </button>
        </div>

        <div className="form-group">
          <label htmlFor="loadQuery">Load Saved Query:</label>
          <select
            id="loadQuery"
            value={selectedQuery}
            onChange={handleLoadQuery}
          >
            <option value="">Select a Query</option>
            {savedQueries.map((query) => (
              <option key={query._id} value={query._id}>
                {query._id}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group buttons">
          <button type="submit" className="submit-button">
            {isLoading ? 'Submitting...' : 'Submit BabyCenter Query'}
          </button>
        </div>

        {error && <p className="error">{error}</p>}
      </form>

      {response && (
        <div className="response">
          <h3>Query Response:</h3>
          {/* <pre>{JSON.stringify(response, null, 2)}</pre> */}
        </div>
      )}

      <style jsx>{`
        .query-page {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          font-family: Arial, sans-serif;
        }

        .query-form {
          background-color: #f9f9f9;
          padding: 20px;
          border-radius: 5px;
        }

        .query-form h2 {
          text-align: center;
          margin-bottom: 20px;
        }

        .form-group {
          margin-bottom: 15px;
          width: 100%;
        }

        .form-group label {
          display: block;
          font-weight: bold;
          margin-bottom: 5px;
        }

        .form-group input,
        .form-group select {
          width: 100%;
          padding: 8px;
          margin-top: 5px;
          box-sizing: border-box;
          border: 1px solid #ccc;
          border-radius: 3px;
        }

        .input-group {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .input-group input {
          flex: 1;
        }

        .keyword-list {
          list-style-type: none;
          padding: 0;
          margin-top: 10px;
        }

        .keyword-list li {
          background-color: #e9ecef;
          padding: 8px;
          margin-bottom: 5px;
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

        .error {
          margin-top: 20px;
          color: #dc3545;
          text-align: center;
        }

        .response {
          margin-top: 30px;
          background-color: #f1f1f1;
          padding: 15px;
          border-radius: 5px;
        }

        .response h3 {
          margin-bottom: 10px;
        }
      `}</style>
    </div>
  );
}
