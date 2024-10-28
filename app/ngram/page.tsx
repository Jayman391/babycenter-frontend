'use client';

import React, { useEffect, useState } from 'react';
import { BACKEND_IP } from '../config';

type NgramPageProps = {
  userId: string;
};

export default function NgramPage({ userId }: NgramPageProps) {
  const [startDate, setStartDate] = useState('2010-01-01');
  const [endDate, setEndDate] = useState('2024-03-01');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [ngramName, setNgramName] = useState('');
  const [savedNgrams, setSavedNgrams] = useState<any[]>([]);
  const [selectedNgram, setSelectedNgram] = useState<string>('');
  const [response, setResponse] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSavedNgrams = async () => {
      const url = `${BACKEND_IP}/load?computed_type=ngram&user_id=${encodeURIComponent(userId)}`;
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        const data = await res.json();
        setSavedNgrams(data.content || []);
      } catch (err: any) {
        setError(err.message || 'Error loading saved N-grams.');
      }
    };
    fetchSavedNgrams();
  }, []);

  const fetchNgramData = async () => {
    setIsLoading(true);
    setError(null);
    setResponse(null);

    const encodedKeywords = keywords.map((k) => encodeURIComponent(k)).join(',') || 'all';
    const startDateInt = parseInt(startDate.replace(/-/g, ''), 10);
    const endDateInt = parseInt(endDate.replace(/-/g, ''), 10);

    const url = `${BACKEND_IP}/ngram?user_id=${encodeURIComponent(userId)}&startDate=${startDateInt}&endDate=${endDateInt}&keywords=${encodedKeywords}`;

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setResponse(data.content);
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeywordAdd = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedKeyword = keywordInput.trim();
    if (trimmedKeyword) {
      setKeywords([...keywords, trimmedKeyword]);
      setKeywordInput('');
    }
  };

  const handleKeywordDelete = (keywordToRemove: string) => {
    setKeywords(keywords.filter((keyword) => keyword !== keywordToRemove));
  };

  const handleSaveNgram = async () => {
    if (!ngramName.trim()) {
      alert('Please provide a name for your N-gram.');
      return;
    }
    const saveParams = {
      type: 'ngram',
      _id: `${userId}-ngram-${ngramName}`,
      content: { userId, startDate, endDate, keywords },
    };

    try {
      const res = await fetch(`${BACKEND_IP}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saveParams),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      alert('N-gram saved successfully.');
      setNgramName('');
    } catch (err: any) {
      setError(err.message || 'Error saving N-gram.');
    }
  };

  const handleLoadNgram = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const ngramId = event.target.value;
    setSelectedNgram(ngramId);

    const selected = savedNgrams.find((ngram) => ngram._id === ngramId);
    if (selected) {
      const { startDate, endDate, keywords } = selected.content;
      setStartDate(startDate || '2010-01-01');
      setEndDate(endDate || '2024-03-01');
      setKeywords(keywords || []);
    }
  };

  return (
    <div className="ngram-page" style={{color : 'black'}}>
      <form className="ngram-form" onSubmit={(e) => e.preventDefault()}>
        <h2>N-Gram Visualization</h2>

        <div className="form-group">
          <label htmlFor="startDate">Start Date:</label>
          <input type="date" id="startDate" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
        </div>

        <div className="form-group">
          <label htmlFor="endDate">End Date:</label>
          <input type="date" id="endDate" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
        </div>

        <div className="form-group">
          <label>Keywords:</label>
          <div className="input-group">
            <input
              type="text"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              placeholder="Enter a keyword"
            />
            <button onClick={handleKeywordAdd}>Add</button>
          </div>
          <ul className="keyword-list">
            {keywords.map((keyword, index) => (
              <li key={index}>
                {keyword}
                <button onClick={() => handleKeywordDelete(keyword)}>Delete</button>
              </li>
            ))}
          </ul>
        </div>

        <div className="form-group">
          <label htmlFor="ngramName">N-Gram Name:</label>
          <input
            type="text"
            id="ngramName"
            value={ngramName}
            onChange={(e) => setNgramName(e.target.value)}
            placeholder="Enter a name"
          />
          <button onClick={handleSaveNgram}>Save N-Gram</button>
        </div>

        <div className="form-group">
          <label>Load Saved N-Gram:</label>
          <select value={selectedNgram} onChange={handleLoadNgram}>
            <option value="">Select a Ngram Analysis</option>
            {savedNgrams.map((ngram) => (
              <option key={ngram._id} value={ngram._id}>
                {ngram._id.match(/-(\w+)$/)[1]}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group buttons">
          <button onClick={fetchNgramData} className="submit-button">
            {isLoading ? 'Loading...' : 'Submit N-gram Query'}</button>
        </div>

        {error && <p className="error">{error}</p>}
      </form>

      {response && (
        <div className="response">
          <h3>N-Gram Data:</h3>
          <pre>{JSON.stringify(response, null, 2)}</pre> 
        </div>
      )}

      <style jsx>{`
        .ngram-page {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          font-family: Arial, sans-serif;
        }

        .ngram-form {
          background-color: #f9f9f9;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .ngram-form h2 {
          text-align: center;
          margin-bottom: 20px;
        }

        .form-group {
          margin-bottom: 20px;
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
          padding: 10px;
          margin-top: 5px;
          border: 1px solid #ccc;
          border-radius: 4px;
          box-sizing: border-box;
        }

        .form-group buttons {
          display: flex;
          justify-content: center;
          margin-top: 20px;
        }

        .input-group {
          display: flex;
          gap: 10px;
        }

        .keyword-list {
          list-style: none;
          padding: 0;
          margin-top: 10px;
        }

        .keyword-list li {
          display: flex;
          justify-content: space-between;
          padding: 8px;
          background-color: #e9ecef;
          border-radius: 4px;
          margin-bottom: 5px;
        }

        .buttons {
          display: flex;
          justify-content: center;
          margin-top: 20px;
        }

        .response {
          margin-top: 20px;
          padding: 15px;
          background-color: #f1f1f1;
          border-radius: 8px;
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
          color: #dc3545;
          text-align: center;
        }
      `}</style>
    </div>
  );
}
