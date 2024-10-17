'use client';

import React, { useEffect, useState } from 'react';
import { BACKEND_IP } from '../config'; // Adjust the import path if necessary
import { CustomSelect } from '../CustomSelect'; // Adjust the import path accordingly

export default function NgramPage() {
  // State variables for form inputs
  const [startDate, setStartDate] = useState<string>('2010-01-01');
  const [endDate, setEndDate] = useState<string>('2024-03-01');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState<string>('');
  const [ngramName, setNgramName] = useState<string>(''); // New state variable for n-gram name

  // State variable for user ID
  const [userId, setUserId] = useState<string | null>(null);

  // State variables for handling responses and loading state
  const [response, setResponse] = useState<any | null>(null); // Flexible response handling
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // State variables for loading saved n-gram queries
  const [savedNgrams, setSavedNgrams] = useState<any[]>([]);
  const [selectedNgramName, setSelectedNgramName] = useState<string>('');
  const [isLoadingNgrams, setIsLoadingNgrams] = useState<boolean>(false);

  // State variables for loading saved queries
  const [savedQueries, setSavedQueries] = useState<any[]>([]);
  const [selectedQueryName, setSelectedQueryName] = useState<string>('');
  const [isLoadingQueries, setIsLoadingQueries] = useState<boolean>(false);

  // Fetch saved n-gram queries and saved queries when the component mounts
  useEffect(() => {
    fetchSavedNgrams();
    fetchSavedQueries();
  }, []);

  // Fetch saved n-gram queries function
  const fetchSavedNgrams = async () => {
    setIsLoadingNgrams(true);
    setError(null);
    try {
      const url = `${BACKEND_IP}/load?computed_type=ngram&name=all`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }
      const data = await res.json();
      setSavedNgrams(data.content || []);
    } catch (err: any) {
      console.error('Error fetching saved n-grams:', err);
      setError(err.message || 'Error fetching saved n-grams. Please try again.');
    } finally {
      setIsLoadingNgrams(false);
    }
  };

  // Fetch saved queries function
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

  // Handle selecting a saved n-gram query
  const handleSelectSavedNgram = async (value: string) => {
    const ngramName = value;
    setSelectedNgramName(ngramName);

    // Load the saved n-gram query using the /load endpoint
    try {
      const url = `${BACKEND_IP}/load?computed_type=ngram&name=${encodeURIComponent(ngramName)}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }
      const data = await res.json();
      console.log('Data received from /load:', data);

      // Ensure data.content is an array and has at least one item
      if (data.content && Array.isArray(data.content) && data.content.length > 0) {
        // Find the saved n-gram with the matching _id
        const savedNgram = data.content.find((item: { _id: string; }) => item._id === ngramName);

        if (savedNgram) {
          const content = savedNgram.content;

          if (!content) {
            throw new Error('Content is undefined.');
          }

          setStartDate(content.start_date || '2010-01-01');
          setEndDate(content.end_date || '2024-03-01');
          setKeywords(content.keywords || []);
        } else {
          throw new Error('Saved n-gram query not found in response.');
        }
      } else {
        throw new Error('No content in response from /load endpoint.');
      }
    } catch (err: any) {
      console.error('Error loading n-gram query:', err);
      setError(err.message || 'Error loading n-gram query. Please try again.');
    }
  };

  // Handle selecting a saved query
  const handleSelectSavedQuery = async (value: string) => {
    const queryName = value;
    setSelectedQueryName(queryName);

    // Load the saved query using the /load endpoint
    try {
      const url = `${BACKEND_IP}/load?computed_type=query&name=${encodeURIComponent(queryName)}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }
      const data = await res.json();
      console.log('Data received from /load:', data);

      // Ensure data.content is an array and has at least one item
      if (data.content && Array.isArray(data.content) && data.content.length > 0) {
        // Find the saved query with the matching _id
        const savedQuery = data.content.find((item: { _id: string; }) => item._id === queryName);

        if (savedQuery) {
          const content = savedQuery.content;

          if (!content) {
            throw new Error('Content is undefined.');
          }

          // Use the content to build a request to the /query endpoint
          const queryResponse = await fetchQueryData(content);

          // Update the state with the data from the /query endpoint
          if (queryResponse.user) {
            setUserId(queryResponse.user);
          }

          // Do not use keywords from query content for N-gram
          // N-gram keywords should be from the N-gram form state
          // Build n-gram content using the N-gram form's keywords
          const ngramContent = {
            start_date: startDate,
            end_date: endDate,
            keywords: keywords,
          };

          // Fetch n-gram data using the content and user ID
          await fetchNgramData(ngramContent, queryResponse.user);
        } else {
          throw new Error('Saved query not found in response.');
        }
      } else {
        throw new Error('No content in response from /load endpoint.');
      }
    } catch (err: any) {
      console.error('Error loading query:', err);
      setError(err.message || 'Error loading query. Please try again.');
    }
  };

  // Prepare options for the custom selects
  const savedNgramOptions = savedNgrams.map((ngram) => ({
    value: ngram._id,
    label: ngram.name || ngram._id,
  }));

  const savedQueryOptions = savedQueries.map((query) => ({
    value: query._id,
    label: query.name || query._id,
  }));

  // Function to fetch data from the /query endpoint
  const fetchQueryData = async (content: any) => {
    setIsLoading(true);
    setError(null);

    try {
      const finalKeywords = content.keywords && content.keywords.length > 0 ? content.keywords : ['all'];
      const finalGroups = content.groups && content.groups.length > 0 ? content.groups : ['all'];

      const encodedKeywords = finalKeywords.map((keyword: string) => encodeURIComponent(keyword)).join(',');
      const encodedGroups = finalGroups.map((group: string) => encodeURIComponent(group)).join(',');

      const startDateInt = parseInt(content.start_date.replace(/-/g, ''), 10);
      const endDateInt = parseInt(content.end_date.replace(/-/g, ''), 10);

      const url = `${BACKEND_IP}/query?country=${encodeURIComponent(
        content.country || 'USA'
      )}&startDate=${startDateInt}&endDate=${endDateInt}&keywords=${encodedKeywords}&groups=${encodedGroups}&num_comments=${content.num_comments || -1}&post_or_comment=${content.post_or_comment || 'posts'}&num_documents=${content.num_documents || 50}`;

      const res = await fetch(url, { method: 'GET' });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const data = await res.json();
      return data; // Contains 'user' and 'response'
    } catch (err: any) {
      console.error('Error fetching data from /query:', err);
      setError(err.message || 'Error fetching data from /query. Please try again.');
      return {};
    } finally {
      setIsLoading(false);
    }
  };

  // Function to fetch data from the /ngram endpoint
  const fetchNgramData = async (content: any, userIdParam: string) => {
    setIsLoading(true);
    setError(null);
    setResponse(null);

    const finalKeywords = content.keywords && content.keywords.length > 0 ? content.keywords : ['all'];

    const encodedKeywords = finalKeywords.map((keyword: string) => encodeURIComponent(keyword)).join(',');

    // Convert start and end dates to integer format (YYYYMMDD)
    const startDateInt = parseInt(content.start_date.replace(/-/g, ''), 10);
    const endDateInt = parseInt(content.end_date.replace(/-/g, ''), 10);

    // Construct the URL using query parameters, including user_id
    const url = `${BACKEND_IP}/ngram?user_id=${encodeURIComponent(
      userIdParam || '0'
    )}&startDate=${startDateInt}&endDate=${endDateInt}&keywords=${encodedKeywords}`;

    try {
      const res = await fetch(url, { method: 'GET' });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const data = await res.json();
      setResponse(data.content);
    } catch (err: any) {
      console.error('Error fetching data from /ngram:', err);
      setError(err.message || 'Error fetching data from /ngram. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    // Build content object from current state
    const content = {
      start_date: startDate,
      end_date: endDate,
      keywords: keywords,
    };

    // If userId is null, make a /query request to get a userId
    if (!userId) {
      // Build default query content
      const defaultQueryContent = {
        country: 'USA',
        start_date: startDate,
        end_date: endDate,
        keywords: [], // Empty keywords for default query
        groups: [],
        num_comments: -1,
        post_or_comment: 'posts',
        num_documents: 50,
      };

      const queryResponse = await fetchQueryData(defaultQueryContent);

      if (queryResponse.user) {
        setUserId(queryResponse.user);
        await fetchNgramData(content, queryResponse.user);
      } else {
        setError('Failed to get user ID from /query response.');
      }
    } else {
      await fetchNgramData(content, userId);
    }
  };

  // Save N-gram Query Function
  const handleSave = async () => {
    setIsLoading(true);
    setError(null);

    if (!ngramName.trim()) {
      alert('Please enter a name for your N-gram query before saving.');
      setIsLoading(false);
      return;
    }

    const saveUrl = `${BACKEND_IP}/save`;

    const saveParams = {
      type: 'ngram',
      name: ngramName, // Use the user-provided name
      content: {
        start_date: startDate,
        end_date: endDate,
        keywords: keywords,
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

      const data = await res.json();
      alert('N-gram query saved successfully');

      // Refresh the saved n-grams list by fetching from backend
      await fetchSavedNgrams();
      setNgramName(''); // Clear the n-gram name after saving
    } catch (err: any) {
      console.error('Error saving n-gram query:', err);
      setError(err.message || 'Error saving n-gram query. Please try again.');
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
      setKeywords((prevKeywords) => [...prevKeywords, trimmedKeyword]);
      setKeywordInput('');
    }
  };

  // Handle removing a keyword from the list
  const handleKeywordRemove = (index: number) => {
    setKeywords((prevKeywords) => prevKeywords.filter((_, i) => i !== index));
  };

  return (
    <div className="ngram-page">


      {/* Load Saved Queries Section */}
      <div className="load-query-section">
        {isLoadingQueries ? (
          <p>Loading saved queries...</p>
        ) : (
          <CustomSelect
            options={savedQueryOptions}
            selectedValue={selectedQueryName}
            onChange={handleSelectSavedQuery}
            placeholder="-- Select a Saved BabyCenterDB Query --"
          />
        )}
      </div>

      {/* Load Saved N-Gram Queries Section */}
      <div className="load-ngram-section">
        {isLoadingNgrams ? (
          <p>Loading saved n-gram queries...</p>
        ) : (
          <CustomSelect
            options={savedNgramOptions}
            selectedValue={selectedNgramName}
            onChange={handleSelectSavedNgram}
            placeholder="-- Select a Saved N-Gram Query --"
          />
        )}
      </div>

      <form onSubmit={handleSubmit} className="ngram-form">
        {/* N-Gram Query Name Input */}
        <div className="form-group">
          <label htmlFor="ngramName">N-Gram Query Name:</label>
          <input
            type="text"
            id="ngramName"
            value={ngramName}
            onChange={(e) => setNgramName(e.target.value)}
            placeholder="Enter a name for your N-Gram query"
            required
            style={{ color: 'black' }}
          />
        </div>

        {/* Start Date */}
        <div className="form-group">
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
        <div className="form-group">
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
        <div className="form-group">
          <label htmlFor="keywords">Add Keywords or leave blank for default:</label>
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
              Add Keyword
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

        {/* Save and Submit Buttons */}
        <div className="form-group buttons">
          <button type="button" onClick={handleSave} className="save-button">
            Save N-Gram Query
          </button>
          <input type="submit" value="Submit" className="submit-button" />
        </div>
      </form>

      {/* Loading Indicator */}
      {isLoading && <p>Loading...</p>}

      {/* Error Message */}
      {error && <div className="error">{error}</div>}

      {/* Display Response */}
      {response && (
        <div className="results">
          <pre style={{ color: 'black' }}>{JSON.stringify(response, null, 2)}</pre>
        </div>
      )}

      <style jsx>{`
        .ngram-page {
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

        .load-query-section,
        .load-ngram-section {
          margin-bottom: 20px;
          color: black;
        }

        .load-query-section label,
        .load-ngram-section label {
          font-weight: bold;
          margin-right: 10px;
          color: #555;
        }

        .ngram-form {
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

        .keyword-list {
          list-style: none;
          padding: 0;
          margin-top: 10px;
        }

        .keyword-list li {
          background-color: #e9ecef;
          padding: 8px;
          margin-bottom: 5px;
          border-radius: 3px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: black;
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
          color: black;
        }

        .results h2 {
          color: #333;
        }

        .results pre {
          text-align: left;
          background-color: #f8f9fa;
          padding: 15px;
          border-radius: 5px;
          overflow-x: auto;
          color: black;
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
