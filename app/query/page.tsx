'use client';

import React, { useEffect, useState, CSSProperties } from 'react';
import { BACKEND_IP } from '../config';

type QueryPageProps = {
  userId: string;
};

interface QueryResponseItem {
  _id: string;
  author: string;
  country: string;
  date: string;
  group: string;
  num_comments?: number;
  text: string;
  time_delta: number;
  title?: string;
  url: string;
}

export default function QueryPage({ userId }: QueryPageProps) {
  const [country, setCountry] = useState('USA');
  const [startDate, setStartDate] = useState('2010-01-01');
  const [endDate, setEndDate] = useState('2024-03-01');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [groups, setGroups] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [groupInput, setGroupInput] = useState('');
  const [numComments, setNumComments] = useState<number>(-1);
  const [postOrComment, setPostOrComment] = useState<string[]>(['posts']); // Updated to handle multiple selections
  const [numDocuments, setNumDocuments] = useState(50);
  const [queryName, setQueryName] = useState('');
  const [savedQueries, setSavedQueries] = useState<any[]>([]);
  const [selectedQuery, setSelectedQuery] = useState<string>('');
  const [response, setResponse] = useState<QueryResponseItem[] | null>(null);
  const [displayedData, setDisplayedData] = useState<QueryResponseItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTable, setShowTable] = useState(false);
  const [itemsToShow, setItemsToShow] = useState(10);

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
  }, [userId]);

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setResponse(null);
    setDisplayedData([]);
    setShowTable(false);
    setItemsToShow(10);

    const encodedKeywords =
      keywords.length > 0
        ? keywords.map((keyword) => encodeURIComponent(keyword)).join(',')
        : 'all';
    const encodedGroups =
      groups.length > 0
        ? groups.map((group) => encodeURIComponent(group)).join(',')
        : 'all';

    const startDateInt = parseInt(startDate.replace(/-/g, ''), 10);
    const endDateInt = parseInt(endDate.replace(/-/g, ''), 10);

    try {
      let combinedResponse: QueryResponseItem[] = [];

      // Calculate documents per type
      const numTypesSelected = postOrComment.length;
      const numDocsPerType = Math.floor(numDocuments / numTypesSelected);

      // Perform queries for each selected type
      for (const type of postOrComment) {
        const url = `${BACKEND_IP}/query?user_id=${encodeURIComponent(
          userId
        )}&country=${encodeURIComponent(
          country
        )}&startDate=${startDateInt}&endDate=${endDateInt}&keywords=${encodedKeywords}&groups=${encodedGroups}&num_comments=${numComments}&post_or_comment=${type}&num_documents=${numDocsPerType}`;

        const res = await fetch(url);
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        const data = await res.json();

        // Set default values for missing fields
        const processedResponse = data.response.map((item: QueryResponseItem) => ({
          ...item,
          title: item.title || '.',
          num_comments: item.num_comments !== undefined ? item.num_comments : 0,
        }));

        combinedResponse = combinedResponse.concat(processedResponse);
      }

      setResponse(combinedResponse);
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
      name: queryName,
      _id: `${userId}-${queryName}`,
      content: {
        userId,
        country,
        startDate,
        endDate,
        keywords,
        groups,
        numComments,
        postOrComment,
        numDocuments,
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

      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      alert('Query saved successfully.');
      setQueryName('');
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
      const {
        country,
        startDate,
        endDate,
        keywords,
        groups,
        numComments,
        postOrComment,
        numDocuments,
      } = selectedQuery.content;

      setCountry(country || 'USA');
      setStartDate(startDate || '2010-01-01');
      setEndDate(endDate || '2024-03-01');
      setKeywords(keywords || []);
      setGroups(groups || []);
      setNumComments(numComments !== undefined ? numComments : -1);
      setPostOrComment(postOrComment || ['posts']);
      setNumDocuments(numDocuments || 50);
    }
  };

  const handleKeywordAdd = () => {
    if (keywordInput.trim() !== '') {
      setKeywords((prev) => [...prev, keywordInput.trim()]);
      setKeywordInput('');
    }
  };

  const handleGroupAdd = () => {
    if (groupInput.trim() !== '') {
      setGroups((prev) => [...prev, groupInput.trim()]);
      setGroupInput('');
    }
  };

  const handleShowTable = () => {
    if (response) {
      setDisplayedData(response.slice(0, itemsToShow));
      setShowTable(true);
    }
  };

  const handleHideTable = () => {
    setShowTable(false);
    setDisplayedData([]);
    setItemsToShow(10);
  };

  const handleLoadMore = () => {
    if (response) {
      const newItemsToShow = itemsToShow + 10;
      setItemsToShow(newItemsToShow);
      setDisplayedData(response.slice(0, newItemsToShow));
    }
  };

  const handleSaveTable = () => {
    if (!response || response.length === 0) {
      alert('No data to save.');
      return;
    }

    const csvContent = [
      ['ID', 'Author', 'Country', 'Date', 'Group', 'Comments', 'Title', 'Text', 'URL'],
      ...response.map((item) => [
        item._id,
        item.author,
        item.country,
        new Date(item.date).toLocaleDateString(),
        item.group,
        item.num_comments,
        `"${(item.title ?? '').replace(/"/g, '""')}"`,
        `"${item.text.replace(/"/g, '""')}"`,
        item.url,
      ]),
    ]
      .map((e) => e.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'query_results.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePostOrCommentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setPostOrComment((prev) => {
      if (prev.includes(value)) {
        return prev.filter((item) => item !== value);
      } else {
        return [...prev, value];
      }
    });
  };

  const tableStyle: CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '20px',
    border: '1px solid #ccc',
  };

  const thTdStyle: CSSProperties = {
    border: '1px solid #ccc',
    padding: '8px',
    textAlign: 'left',
  };

  return (
    <div className="query-page" style={{ color: 'black' }}>
      <form onSubmit={handleSubmit} className="query-form">
        <h2>Custom Query</h2>

        {/* Country Selection */}
        <div className="form-group">
          <label htmlFor="country">Country:</label>
          <select
            id="country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            required
          >
            <option value="" disabled>
              Select a country
            </option>
            <option value="USA">USA</option>
            <option value="Brazil">Brazil</option>
          </select>
        </div>

        {/* Start Date */}
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

        {/* End Date */}
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

        {/* Keywords Input */}
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
              <li key={index}>
                {keyword}
                <button
                  type="button"
                  onClick={() => setKeywords(keywords.filter((_, i) => i !== index))}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Groups Input */}
        <div className="form-group">
          <label htmlFor="groups">Groups:</label>
          <div className="input-group">
            <input
              type="text"
              id="groups"
              value={groupInput}
              onChange={(e) => setGroupInput(e.target.value)}
              placeholder="Enter a group"
            />
            <button type="button" onClick={handleGroupAdd}>
              Add
            </button>
          </div>
          <ul className="group-list">
            {groups.map((group, index) => (
              <li key={index}>
                {group}
                <button
                  type="button"
                  onClick={() => setGroups(groups.filter((_, i) => i !== index))}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Number of Comments */}
        <div className="form-group">
          <label htmlFor="numComments">Number of Comments:</label>
          <input
            type="number"
            id="numComments"
            value={numComments}
            onChange={(e) => setNumComments(parseInt(e.target.value))}
          />
        </div>

        {/* Post or Comment */}
        <div className="form-group">
          <label>Posts or Comments:</label>
          <div className="checkbox-group">
            <label>
              <input
                type="checkbox"
                value="posts"
                checked={postOrComment.includes('posts')}
                onChange={handlePostOrCommentChange}
              />
              Posts
            </label>
            <label>
              <input
                type="checkbox"
                value="comments"
                checked={postOrComment.includes('comments')}
                onChange={handlePostOrCommentChange}
              />
              Comments
            </label>
          </div>
        </div>

        {/* Number of Documents */}
        <div className="form-group">
          <label htmlFor="numDocuments">Number of Documents:</label>
          <input
            type="number"
            id="numDocuments"
            value={numDocuments}
            onChange={(e) => setNumDocuments(parseInt(e.target.value))}
          />
        </div>

        {/* Query Name */}
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

        {/* Load Saved Query */}
        <div className="form-group">
          <label htmlFor="loadQuery">Load Saved Query:</label>
          <select id="loadQuery" value={selectedQuery} onChange={handleLoadQuery}>
            <option value="">Select a Query</option>
            {savedQueries.map((query) => (
              <option key={query._id} value={query._id}>
                {query.name}
              </option>
            ))}
          </select>
        </div>

        {/* Submit Button */}
        <div className="form-group buttons">
          <button type="submit" className="submit-button">
            {isLoading ? 'Submitting...' : 'Submit BabyCenter Query'}
          </button>
        </div>

        {error && <p className="error">{error}</p>}
      </form>

      {response && (
        <div className="response-buttons">
          {!showTable ? (
            <button onClick={handleShowTable} className="show-table-button">
              Show Results
            </button>
          ) : (
            <button onClick={handleHideTable} className="hide-table-button">
              Hide Table
            </button>
          )}
          <button onClick={handleSaveTable} className="save-table-button">
            Save Table
          </button>
        </div>
      )}

      {showTable && (
        <div className="response">
          <h3>Query Results:</h3>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thTdStyle}>ID</th>
                <th style={thTdStyle}>Author</th>
                <th style={thTdStyle}>Country</th>
                <th style={thTdStyle}>Date</th>
                <th style={thTdStyle}>Group</th>
                <th style={thTdStyle}>Comments</th>
                <th style={thTdStyle}>Title</th>
                <th style={thTdStyle}>Text</th>
                <th style={thTdStyle}>Link</th>
              </tr>
            </thead>
            <tbody style={{color : 'white'}}>
              {displayedData.map((item) => (
                <tr key={item._id}>
                  <td style={thTdStyle}>{item._id}</td>
                  <td style={thTdStyle}>{item.author}</td>
                  <td style={thTdStyle}>{item.country}</td>
                  <td style={thTdStyle}>{new Date(item.date).toLocaleDateString()}</td>
                  <td style={thTdStyle}>{item.group}</td>
                  <td style={thTdStyle}>{item.num_comments}</td>
                  <td style={thTdStyle}>{item.title}</td>
                  <td style={thTdStyle}>{item.text}</td>
                  <td style={thTdStyle}>
                    <a href={item.url} target="_blank" rel="noopener noreferrer">
                      View Post
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {itemsToShow < (response?.length || 0) && (
            <button onClick={handleLoadMore} className="load-more-button">
              Load More
            </button>
          )}
        </div>
      )}

      <style jsx>{`
        .query-page {
          width: 100%;
          margin: 0;
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

        .checkbox-group {
          display: flex;
          gap: 20px;
          margin-top: 10px;
        }

        .checkbox-group label {
          display: flex;
          align-items: center;
          font-weight: normal;
        }

        .keyword-list,
        .group-list {
          list-style-type: none;
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
        }

        .keyword-list li button,
        .group-list li button {
          background-color: #dc3545;
          color: #fff;
          border: none;
          padding: 5px 10px;
          border-radius: 3px;
          cursor: pointer;
        }

        .form-group.buttons {
          display: flex;
          justify-content: center;
          margin-top: 20px;
        }

        .submit-button,
        .show-table-button,
        .hide-table-button,
        .save-table-button,
        .load-more-button {
          padding: 10px 15px;
          background-color: #007bff;
          color: #fff;
          border: none;
          border-radius: 3px;
          cursor: pointer;
          margin-right: 10px;
        }

        .submit-button:hover,
        .show-table-button:hover,
        .hide-table-button:hover,
        .save-table-button:hover,
        .load-more-button:hover {
          background-color: #0069d9;
        }

        .error {
          margin-top: 20px;
          color: #dc3545;
          text-align: center;
        }

        .response-buttons {
          margin-top: 20px;
          display: flex;
          gap: 10px;
        }

        .response {
          margin-top: 30px;
          padding: 15px;
          border-radius: 5px;
        }

        .response h3 {
          margin-bottom: 10px;
        }

        table {
          border-collapse: collapse;
          width: 100%;
          margin-top: 20px;
        }

        th,
        td {
          border: 1px solid #ccc;
          padding: 8px;
          text-align: left;
        }

        th {
          background-color: #f2f2f2;
        }
      `}</style>
    </div>
  );
}
