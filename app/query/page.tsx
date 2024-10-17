'use client';

import React, { useEffect, useState } from 'react';
import { BACKEND_IP } from '../config'; // Ensure the path is correct

export default function QueryPage() {
  // State variables for form inputs with default values
  const [country, setCountry] = useState<string>('USA');
  const [startDate, setStartDate] = useState<string>('2010-01-01');
  const [endDate, setEndDate] = useState<string>('2024-03-01');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [groups, setGroups] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState<string>('');
  const [groupInput, setGroupInput] = useState<string>('');
  const [numComments, setNumComments] = useState<number>(-1);
  const [postOrComment, setPostOrComment] = useState<string>('posts');
  const [numDocuments, setNumDocuments] = useState<number>(50);
  const [queryName, setQueryName] = useState<string>(''); // New state variable for query name

  // State variables for handling responses and loading state
  const [response, setResponse] = useState<any | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // New state variables for loading saved queries
  const [savedQueries, setSavedQueries] = useState<any[]>([]);
  const [selectedQueryName, setSelectedQueryName] = useState<string>('');
  const [isLoadingQueries, setIsLoadingQueries] = useState<boolean>(false);

  // Fetch saved queries when the component mounts
  useEffect(() => {
    const fetchSavedQueries = async () => {
      setIsLoadingQueries(true);
      setError(null);
      try {
        const url = `${BACKEND_IP}/load?computed_type=query&name=all`;
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`Server error: ${res.status}`);
        }
        const data = await res.json();
        setSavedQueries(data.content || []);
      } catch (err: any) {
        console.error('Error fetching saved queries:', err);
        setError(err.message || 'Error fetching saved queries. Please try again.');
      } finally {
        setIsLoadingQueries(false);
      }
    };

    fetchSavedQueries();
  }, []);

  // Handle selecting a saved query
  const handleSelectSavedQuery = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const queryName = event.target.value;
    setSelectedQueryName(queryName);

    // Find the selected query in the savedQueries array
    const selectedQuery = savedQueries.find((query) => query._id === queryName);
    if (selectedQuery) {
      const content = selectedQuery.content;
      setCountry(content.country || 'USA');
      setStartDate(content.start_date || '2010-01-01');
      setEndDate(content.end_date || '2024-03-01');
      setKeywords(content.keywords || []);
      setGroups(content.groups || []);
      setNumComments(content.num_comments !== undefined ? content.num_comments : -1);
      setPostOrComment(content.post_or_comment || 'posts');
      setNumDocuments(content.num_documents || 50);
    }
  };

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setResponse(null);

    const finalKeywords = keywords.length > 0 ? keywords : ['all'];
    const finalGroups = groups.length > 0 ? groups : ['all'];

    const encodedKeywords = finalKeywords.map(keyword => encodeURIComponent(keyword)).join(',');
    const encodedGroups = finalGroups.map(group => encodeURIComponent(group)).join(',');

    const startDateInt = parseInt(startDate.replace(/-/g, ''), 10);
    const endDateInt = parseInt(endDate.replace(/-/g, ''), 10);

    const url = `${BACKEND_IP}/query?country=${encodeURIComponent(country)}&startDate=${startDateInt}&endDate=${endDateInt}&keywords=${encodedKeywords}&groups=${encodedGroups}&num_comments=${numComments}&post_or_comment=${postOrComment}&num_documents=${numDocuments}`;

    try {
      const res = await fetch(url, { method: 'GET' });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const data = await res.json();
      setResponse(data.response);
      setUserId(data.user);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Error fetching data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Save Query Function
  const handleSave = async () => {
    setIsLoading(true);
    setError(null);

    if (!queryName.trim()) {
      alert('Please enter a name for your query before saving.');
      setIsLoading(false);
      return;
    }

    const saveUrl = `${BACKEND_IP}/save`;

    const saveParams = {
      type: "query",
      name: queryName, // Use the user-provided name
      content: {
        "country": country,
        "start_date": startDate,
        "end_date": endDate,
        "keywords": keywords,
        "groups": groups,
        "num_comments": numComments,
        "post_or_comment": postOrComment,
        "num_documents": numDocuments
      }
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

      const data = await res.json();
      alert('Query saved successfully');

      // Optionally, refresh the saved queries list
      setSavedQueries(prev => [...prev, saveParams]);
      setQueryName(''); // Clear the query name after saving
    } catch (err: any) {
      console.error('Error saving query:', err);
      setError(err.message || 'Error saving query. Please try again.');
    } finally {
      setIsLoading(false);
    }
    location.reload();
  };

  // Handle changes in the keyword and group input fields
  const handleKeywordChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setKeywordInput(event.target.value);
  };
  const handleGroupChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setGroupInput(event.target.value);
  };

  // Handle adding a keyword or group to the list
  const handleKeywordAdd = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedKeyword = keywordInput.trim();
    if (trimmedKeyword !== '') {
      setKeywords(prevKeywords => [...prevKeywords, trimmedKeyword]);
      setKeywordInput('');
    }
  };
  const handleGroupAdd = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedGroup = groupInput.trim();
    if (trimmedGroup !== '') {
      setGroups(prevGroups => [...prevGroups, trimmedGroup]);
      setGroupInput('');
    }
  };

  // Handle removing a keyword or group from the list
  const handleKeywordRemove = (index: number) => {
    setKeywords(prevKeywords => prevKeywords.filter((_, i) => i !== index));
  };
  const handleGroupRemove = (index: number) => {
    setGroups(prevGroups => prevGroups.filter((_, i) => i !== index));
  };

  return (
    <div className="query-page">

      {/* Load Saved Queries Section */}
      <div className="load-query-section">
        {isLoadingQueries ? (
          <p>Loading saved queries...</p>
        ) : (
          <select
            id="savedQueries"
            value={selectedQueryName}
            onChange={handleSelectSavedQuery}
            style={{ color: 'black' }} // Ensure the font color is black
          >
            <option value="" style={{ color: 'black' }}>-- Select a Saved BabyCenterDB Query --</option>
            {savedQueries.map((query, index) => (
              <option key={index} value={query._id} style={{ color: 'black' }}>
                {query._id}
              </option>
            ))}
          </select>
        )}
      </div>

      <form onSubmit={handleSubmit} className="query-form">
        {/* Query Name Input */}
        <div className="form-group">
          <label htmlFor="queryName">Query Name:</label>
          <input
            type="text"
            id="queryName"
            value={queryName}
            onChange={(e) => setQueryName(e.target.value)}
            placeholder="Enter a name for your query"
            required
            style={{ color: 'black' }}
          />
        </div>

        {/* Country Selection */}
        <div className="form-group">
          <label htmlFor="country">Select Country:</label>
          <input
            id="country"
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            required
            style={{ color: 'black' }}
            placeholder="USA"
          />
        </div>

        {/* Start Date */}
        <div className="form-group">
          <label htmlFor="startDate">Select Start Date:</label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{ color: 'black' }}
            required
          />
        </div>

        {/* End Date */}
        <div className="form-group">
          <label htmlFor="endDate">Select End Date:</label>
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
        <div className="form-group">
          <label htmlFor="keywords">Add N-Grams or leave blank for default:</label>
          <div className="input-button-group">
            <textarea
              id="keywords"
              value={keywordInput}
              onChange={handleKeywordChange}
              placeholder="Enter a keyword"
              rows={2}
              style={{ color: 'black' }}
            />
            <button type="button" onClick={handleKeywordAdd} className="add-button">
              Add N-Gram
            </button>
          </div>
          <ul className="keyword-list">
            {keywords.map((keyword, index) => (
              <li key={index} style={{ color: 'black' }}>
                {keyword}{' '}
                <button
                  type="button"
                  onClick={() => handleKeywordRemove(index)}
                  className="remove-button"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Groups Input */}
        <div className="form-group">
          <label htmlFor="groups">Add Groups or leave blank for all:</label>
          <div className="input-button-group">
            <textarea
              id="groups"
              value={groupInput}
              onChange={handleGroupChange}
              placeholder="Enter a group"
              rows={2}
              style={{ color: 'black' }}
            />
            <button type="button" onClick={handleGroupAdd} className="add-button">
              Add Group
            </button>
          </div>
          <ul className="group-list">
            {groups.map((group, index) => (
              <li key={index} style={{ color: 'black' }}>
                {group}{' '}
                <button
                  type="button"
                  onClick={() => handleGroupRemove(index)}
                  className="remove-button"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Number of Comments */}
        <div className="form-group">
          <label htmlFor="numComments">Select Number of Comments per Post if applicable:</label>
          <input
            type="number"
            id="numComments"
            name="numComments"
            value={numComments}
            onChange={(e) => setNumComments(parseInt(e.target.value))}
            style={{ color: 'black' }}
          />
        </div>

        {/* Post or Comment */}
        <div className="form-group">
          <label htmlFor="postOrComment">Just Posts or Comments?</label>
          <select
            id="postOrComment"
            value={postOrComment}
            onChange={(e) => setPostOrComment(e.target.value)}
            style={{ color: 'black' }}
          >
            <option value="posts" style={{ color: 'black' }}>Posts</option>
            <option value="comments" style={{ color: 'black' }}>Comments</option>
          </select>
        </div>

        {/* Number of Documents */}
        <div className="form-group">
          <label htmlFor="numDocuments">Select Number of Documents:</label>
          <input
            type="number"
            id="numDocuments"
            name="numDocuments"
            value={numDocuments}
            onChange={(e) => setNumDocuments(parseInt(e.target.value))}
            style={{ color: 'black' }}
          />
        </div>

        {/* Save and Submit Buttons */}
        <div className="form-group buttons">
          <button type="button" onClick={handleSave} className="save-button">
            Save Query
          </button>
          <input type="submit" value="Submit" className="submit-button" />
        </div>
      </form>

      {/* After Submit, display hyperlinks to ngram and topic pages */}
      {response && userId && (
        <div className="results"> 
          <p>Choose an Analysis to Conduct </p>
          <ul>
            <li>
              <a href={`/ngram?user_id=${userId}`}>N-Gram Visualization</a>
            </li>
            <li>
              <a href={`/topic?user_id=${userId}`}>Topic Modeling</a>
            </li>
          </ul>
        </div>
      )}

      {/* Error handling */}
      {error && <div className="error">{error}</div>}

      <style jsx>{`
        .query-page {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          font-family: Arial, sans-serif;
        }

        .page-title {
          text-align: center;
          color: #333;
          margin-bottom: 20px;
        }

        .load-query-section {
          margin-bottom: 20px;
        }

        .load-query-section label {
          font-weight: bold;
          margin-right: 10px;
          color: #555;
        }

        .load-query-section select {
          padding: 8px;
          border: 1px solid #ccc;
          border-radius: 3px;
          width: 100%;
          box-sizing: border-box;
          color: black; /* Set the font color to black */
        }

        .load-query-section select option {
          color: black; /* Ensure all options have black text */
        }

        .query-form {
          background-color: #f9f9f9;
          padding: 20px;
          border-radius: 5px;
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

        .form-group input[type='text'],
        .form-group input[type='date'],
        .form-group input[type='number'],
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 8px;
          box-sizing: border-box;
          border: 1px solid #ccc;
          border-radius: 3px;
        }

        .input-button-group {
          display: flex;
          align-items: center;
        }

        .input-button-group textarea {
          flex: 1;
          margin-right: 10px;
        }

        .add-button {
          padding: 8px 12px;
          background-color: #28a745;
          color: #fff;
          border: none;
          border-radius: 3px;
          cursor: pointer;
        }

        .add-button:hover {
          background-color: #218838;
        }

        .keyword-list,
        .group-list {
          list-style: none;
          padding: 0;
          margin-top: 10px;
        }

        .keyword-list li,
        .group-list li {
          background-color: #e9ecef;
          padding: 8px;
          margin-bottom: 5px;
          border-radius: 3px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: black; /* Set the font color to black */
        }

        .remove-button {
          padding: 4px 8px;
          background-color: #dc3545;
          color: #fff;
          border: none;
          border-radius: 3px;
          cursor: pointer;
        }

        .remove-button:hover {
          background-color: #c82333;
        }

        .form-group.buttons {
          display: flex;
          justify-content: flex-end;
          margin-top: 20px;
        }

        .save-button,
        .submit-button {
          padding: 10px 15px;
          margin-left: 10px;
          background-color: #007bff;
          color: #fff;
          border: none;
          border-radius: 3px;
          cursor: pointer;
        }

        .save-button:hover,
        .submit-button:hover {
          background-color: #0069d9;
        }

        .results {
          margin-top: 30px;
          text-align: center;
        }

        .results h2 {
          color: #333;
        }

        .results p {
          color: #555;
        }

        .results ul {
          list-style: none;
          padding: 0;
        }

        .results li {
          margin-bottom: 10px;
        }

        .results a {
          color: #007bff;
          text-decoration: none;
        }

        .results a:hover {
          text-decoration: underline;
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
