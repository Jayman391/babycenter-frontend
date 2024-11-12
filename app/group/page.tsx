'use client';

import { useState, useEffect, Key } from 'react';
import { BACKEND_IP } from '../config';

export default function GroupNgramPage() {
  const [topics, setTopics] = useState([]);
  const [selectedParent, setSelectedParent] = useState('');
  const [subgroups, setSubgroups] = useState<string[]>([]);
  const [filteredSubgroups, setFilteredSubgroups] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [alpha, setAlpha] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function fetchTopics() {
      try {
        const res = await fetch('/topics.json');
        const data = await res.json();
        setTopics(data);
      } catch (error) {
        console.error('Error fetching topics:', error);
      }
    }
    fetchTopics();
  }, []);

  useEffect(() => {
    if (selectedParent) {
      const parentTopic = topics.find((topic: { id: string }) => topic.id === selectedParent);
      const groups = parentTopic?.groups || [];
      setSubgroups(groups);
      setFilteredSubgroups(groups.slice(0, 25)); // Display first 25 by default
    } else {
      setSubgroups([]);
      setFilteredSubgroups([]);
    }
  }, [selectedParent, topics]);

  useEffect(() => {
    const filtered = subgroups.filter(group =>
      group.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredSubgroups(filtered.slice(0, 25)); // Limit display to first 25 matching results
  }, [searchTerm, subgroups]);

  const handleGroupCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (event.target.checked) {
      setSelectedGroups((prevSelected) => [...prevSelected, value]);
    } else {
      setSelectedGroups((prevSelected) => prevSelected.filter((group) => group !== value));
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const sessionID = sessionStorage.getItem('sessionID') || Math.random().toString();
    const groupsString = selectedGroups.join(',');
    const url = `${BACKEND_IP}/allotax?sessionID=${sessionID}&alpha=${alpha}&groups=${encodeURIComponent(groupsString)}`;

    try {
      const res = await fetch(url);
      const data = await res.json();
      console.log(data); // Process the response as needed
    } catch (error) {
      console.error('Error fetching allotax data:', error);
    }
  };

  return (
    <div className="dropdown-page">
      <h2>Allotax Computation Form</h2>

      {/* Display selected groups */}
      <div className="selected-groups">
        <h3>Selected Groups:</h3>
        {selectedGroups.length > 0 ? (
          <ul>
            {selectedGroups.map((group) => (
              <li key={group}>{group.replace(/_/g, ' ')}</li>
            ))}
          </ul>
        ) : (
          <p>No groups selected.</p>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="alpha">Alpha Value:</label>
          <input
            type="text"
            id="alpha"
            value={alpha}
            onChange={(e) => setAlpha(e.target.value)}
            placeholder="Enter alpha value"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="parent-dropdown">Parent Group:</label>
          <select
            id="parent-dropdown"
            value={selectedParent}
            onChange={(e) => setSelectedParent(e.target.value)}
          >
            <option value="">Select a parent group</option>
            {topics.map((topic: { id: Key }) => (
              <option key={topic.id} value={topic.id}>
                {String(topic.id).replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>

        {/* Search and Checkbox for subgroups */}
        <div className="form-group">
          <label>Search Subgroups:</label>
          <input
            type="text"
            placeholder="Search subgroups..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="form-group">
          <label>Subgroups (showing first 25 results):</label>
          <div className="checkbox-group">
            {filteredSubgroups.map((group) => (
              <label key={group} className="checkbox-label">
                <input
                  type="checkbox"
                  value={group}
                  checked={selectedGroups.includes(group)}
                  onChange={handleGroupCheckboxChange}
                />
                {group.replace(/_/g, ' ')}
              </label>
            ))}
          </div>
        </div>

        <button type="submit" className="submit-button">
          Submit
        </button>
      </form>

      <style jsx>{`
        .dropdown-page {
          width: 100%;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          font-family: Arial, sans-serif;
          background-color: #f9f9f9;
          border-radius: 5px;
        }

        h2 {
          text-align: center;
          margin-bottom: 20px;
          font-size: 1.5rem;
          color: #333;
        }

        .selected-groups {
          margin-bottom: 15px;
          padding: 10px;
          background-color: #e9e9e9;
          border-radius: 5px;
        }

        .selected-groups h3 {
          margin: 0 0 10px;
          font-size: 1.2rem;
          color: #333;
        }

        .selected-groups ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .selected-groups ul li {
          font-size: 1rem;
          color: #555;
        }

        .form-group {
          margin-bottom: 15px;
          color: black;
        }

        .form-group label {
          display: block;
          font-weight: bold;
          margin-bottom: 5px;
        }

        .search-input {
          width: 100%;
          padding: 8px;
          border: 1px solid #ccc;
          border-radius: 5px;
          font-size: 1rem;
          color: #333;
        }

        .checkbox-group {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          font-size: 1rem;
          color: #333;
        }

        .submit-button {
          padding: 10px 15px;
          background-color: #007bff;
          color: #fff;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          width: 100%;
          font-size: 1rem;
        }

        .submit-button:hover {
          background-color: #0069d9;
        }
      `}</style>
    </div>
  );
}
