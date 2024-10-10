'use client';

import React, { useState } from 'react';
import { BACKEND_IP } from '../config'; // Ensure the path is correct

export default function QueryPage() {
  // State variables for form inputs with default values
  const [country, setCountry] = useState<string>('USA');
  const [startDate, setStartDate] = useState<string>('2010-01-01');
  const [endDate, setEndDate] = useState<string>('2024-03-01');
  const [keywords, setKeywords] = useState<string[]>([]); // Empty initially
  const [groups, setGroups] = useState<string[]>([]); // Empty initially
  const [keywordInput, setKeywordInput] = useState<string>(''); // No default input
  const [groupInput, setGroupInput] = useState<string>(''); // No default input
  const [numComments, setNumComments] = useState<number>(-1); // -1 indicates no specific input
  const [postOrComment, setPostOrComment] = useState<string>('posts'); // Default to "posts"
  const [numDocuments, setNumDocuments] = useState<number>(50);

  // State variables for handling responses and loading state
  const [response, setResponse] = useState<any | null>(null); // Allow `response` to handle any data type
  const [userId, setUserId] = useState<string | null>(null); // Store user ID
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setResponse(null);

    // Ensure keywords and groups have default values if empty
    const finalKeywords = keywords.length > 0 ? keywords : ['all']; // Set 'all' if no user input
    const finalGroups = groups.length > 0 ? groups : ['all']; // Set 'all' if no user input

    // Encode keywords and groups as comma-separated values
    const encodedKeywords = finalKeywords.map(keyword => encodeURIComponent(keyword)).join(',');
    const encodedGroups = finalGroups.map(group => encodeURIComponent(group)).join(',');

    // Convert start and end dates to integer format (YYYYMMDD)
    const startDateInt = parseInt(startDate.replace(/-/g, ''), 10);
    const endDateInt = parseInt(endDate.replace(/-/g, ''), 10);

    // Construct the URL using query parameters
    const url = `${BACKEND_IP}/query?country=${encodeURIComponent(country)}&startDate=${startDateInt}&endDate=${endDateInt}&keywords=${encodedKeywords}&groups=${encodedGroups}&num_comments=${numComments}&post_or_comment=${postOrComment}&num_documents=${numDocuments}`;

    try {
      const res = await fetch(url, { method: 'GET' });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const data = await res.json();
      setResponse(data.response); // Store the response
      setUserId(data.user); // Store the user ID from the response
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Error fetching data. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
    <div>
      <h1>Query Page</h1>

      <form onSubmit={handleSubmit}>
        {/* Country Selection */}
        <div>
          <label htmlFor="country">Select Country:</label>
          <input
            id="country"
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            required
            style={{ color: 'black' }} 
            placeholder='USA'
          />
        </div>

        {/* Start Date */}
        <div>
          <label htmlFor="startDate">Select Start Date:</label>
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
        <div>
          <label htmlFor="keywords">Add N-Grams or leave blank for default:</label>
          <textarea
            id="keywords"
            value={keywordInput}
            onChange={handleKeywordChange}
            placeholder="Enter a keyword"
            rows={2}
            style={{ color: 'black' }} 
          />
          <button type="button" onClick={handleKeywordAdd}>Add N-Gram</button>
        </div>
        <ul>
          {keywords.map((keyword, index) => (
            <li key={index}>{keyword} <button type="button" onClick={() => handleKeywordRemove(index)}>Remove</button></li>
          ))}
        </ul>

        {/* Groups Input */}
        <div>
          <label htmlFor="groups"> Add Groups or leave blank for all:</label>
          <textarea
            id="groups"
            value={groupInput}
            onChange={handleGroupChange}
            placeholder="Enter a group"
            rows={2}
            style={{ color: 'black' }} 
          />
          <button type="button" onClick={handleGroupAdd}>Add Group</button>
        </div>
        <ul>
          {groups.map((group, index) => (
            <li key={index}>{group} <button type="button" onClick={() => handleGroupRemove(index)}>Remove</button></li>
          ))}
        </ul>

        {/* Number of Comments */}
        <div>
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
        <div>
          <label htmlFor="postOrComment">Just Posts or Comments?</label>
          <select
            id="postOrComment"
            value={postOrComment}
            onChange={(e) => setPostOrComment(e.target.value)}
            style={{ color: 'black' }} 
          >
            <option value="posts">posts</option>
            <option value="comments">comments</option>
          </select>
        </div>

        {/* Number of Documents */}
        <div>
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

        {/* Submit Button */}
        <div>
          <input type="submit" value="Submit" />
        </div>
      </form>

      
      {/* After Submit, display hyperlinks to ngram and topic pages */}
      
      {/* After Submit, display hyperlinks to ngram and topic pages */}
      {response && userId && (
        <div>
          <h2>Query Results</h2>
          <p>Choose an Analysis to Conduct</p>
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
    </div>
  );
}
