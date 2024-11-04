'use client';

import React, { useEffect, useState } from 'react';
import { BACKEND_IP } from '../config';
import * as d3 from 'd3';

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

  // New state variables for controlling the display of results
  const [showResults, setShowResults] = useState(false);

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
  }, [userId]);

  const fetchNgramData = async () => {
    setIsLoading(true);
    setError(null);
    setResponse(null);
    setShowResults(false); // Reset showResults when fetching new data

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

  // New handlers for showing/hiding results and saving data
  const handleShowResults = () => {
    setShowResults(true);
  };

  const handleHideResults = () => {
    setShowResults(false);
  };

  const handleSaveData = () => {
    if (!response || Object.keys(response).length === 0) {
      alert('No data to save.');
      return;
    }

    // Save the response data as a JSON file
    const jsonString = JSON.stringify(response, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'ngram_results.json');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const ngramViz = (responseData: any) => {
    // Extract data
    const data = responseData;
    const full_corpus = data['full_corpus'];
    const full_ranks = full_corpus['1-gram']['ranks'];
  
    console.log(full_ranks);
  
    // Convert full_ranks object into an array of objects suitable for D3
    interface NgramData {
      key: string;
      value: number;
      x?: number;
      y?: number;
      fx?: number | null;
      fy?: number | null;
    }
  
    const dataArray: NgramData[] = Object.keys(full_ranks)
      .map((key) => ({
        key: key,
        value: full_ranks[key],
      }))
      .filter((d) => d.value <= 200); // Exclude values higher than 200
  
    // Set the base dimensions for the visualization
    const width = 800;
    const height = 800;
  
    // Remove any existing SVG to prevent duplicates
    d3.select('#ngram-viz').select('svg').remove();
  
    // Create SVG container and make it responsive
    const svg = d3
      .select('#ngram-viz')
      .append('svg')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .style('width', '100%')
      .style('height', '100%');
  
    // Define size scale based on data (higher-ranked words are larger)
    const size = d3
      .scalePow()
      .exponent(0.25)
      .domain(d3.extent(dataArray, (d) => d.value) as [number, number])
      .range([60, 10]); // Larger size for lower rank values (higher-ranked words)
  
    // Define color scale
    const color = d3
      .scaleSequential(d3.interpolateBlues)
      .domain(d3.extent(dataArray, (d) => d.value) as [number, number]);
  
    // Create a tooltip appended to the body
    const Tooltip = d3
      .select('body')
      .append('div')
      .style('opacity', 0)
      .attr('class', 'tooltip')
      .style('background-color', 'white') // Ensure background is white
      .style('border', 'solid 2px')
      .style('border-radius', '5px')
      .style('padding', '5px')
      .style('position', 'absolute')
      .style('z-index', '10')
      .style('color', 'black'); // Set text color to black
  
    // Tooltip mouse event functions
    const mouseover = function (this: any, event: any, d: NgramData) {
      Tooltip.style('opacity', 1);
      d3.select(this).attr('stroke-width', 2);
    };
  
    const mousemove = function (event: any, d: NgramData) {
      Tooltip.html(`<u>${d.key}</u><br>Rank: ${d.value}`)
        .style('left', event.pageX + 20 + 'px')
        .style('top', event.pageY - 30 + 'px');
    };
  
    const mouseleave = function (this: any, event: any, d: NgramData) {
      Tooltip.style('opacity', 0);
      d3.select(this).attr('stroke-width', 1);
    };
  
    
  
    // Initialize the circles with opacity set to 0
    const node = svg
      .append('g')
      .selectAll('circle')
      .data(dataArray)
      .join('circle')
      .attr('class', 'node')
      .attr('r', (d) => size(d.value))
      .attr('cx', width / 2)
      .attr('cy', height / 2)
      .style('fill', (d) => color(d.value))
      .style('fill-opacity', 0.8)
      .attr('stroke', 'black')
      .style('stroke-width', 1)
      .style('opacity', 0) // Set initial opacity to 0
      .on('mouseover', mouseover)
      .on('mousemove', mousemove)
      .on('mouseleave', mouseleave)
      .on('click', (event, d) => {
        // On click, show a line chart of the counts over time for that ngram
        // Implement your line chart logic here
        console.log(`Clicked on ngram: ${d.key}`);
      })
      
  
    // Define a radial scale to position nodes based on their value
    const minValue = d3.min(dataArray, (d) => d.value);
    const maxValue = d3.max(dataArray, (d) => d.value);
  
    const radialScale = d3
      .scaleLinear()
      .domain([minValue!, maxValue!]) // [lowest rank, highest rank]
      .range([0, width / 2 - 60]); // Center to outer edge minus max radius
  
    // Force simulation with adjusted parameters
    interface SimulationNodeDatum extends NgramData {
      value: number;
    }
  
    const simulation = d3
      .forceSimulation<SimulationNodeDatum>()
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('charge', d3.forceManyBody().strength(0.5))
      .force(
        'radial',
        d3
          .forceRadial(
            (d) => radialScale(d.value),
            width / 2,
            height / 2
          )
          .strength(1)
      )
      .force(
        'collide',
        d3
          .forceCollide()
          .strength(1)
          .radius((d) => size(d.value) + 1)
          .iterations(1)
      );
  
    simulation
      .nodes(dataArray)
      .on('tick', () => {
        node
          .attr('cx', (d) => (d.x = Math.max(size(d.value), Math.min(width - size(d.value), d.x!))))
          .attr('cy', (d) => (d.y = Math.max(size(d.value), Math.min(height - size(d.value), d.y!))));
      })
      .on('end', () => {
        // Transition nodes to full opacity when simulation ends
        node.transition().duration(500).style('opacity', 1);
      });
  
    
  };
  
  

  return (
    <div className="ngram-page" style={{ color: 'black' }}>
      <form className="ngram-form" onSubmit={(e) => e.preventDefault()}>
        <h2>N-Gram Visualization</h2>

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
            {isLoading ? 'Loading...' : 'Submit N-gram Query'}
          </button>
        </div>

        {error && <p className="error">{error}</p>}
      </form>

      {response && (
        <div className="response-buttons">
          {!showResults ? (
            <button onClick={handleShowResults} className="show-results-button">
              Show Results
            </button>
          ) : (
            <button onClick={handleHideResults} className="hide-results-button">
              Hide Results
            </button>
          )}
          <button onClick={handleSaveData} className="save-data-button">
            Save Data
          </button>
        </div>
      )}

      {showResults && response && (
        <div className="response">
          <h3>N-Gram Data:</h3>
          <pre>{JSON.stringify(response, null, 2)}</pre>
        </div>
      )}

      <div
        id="ngram-viz"
        style={{ width: '100%', height: '600px', position: 'relative' }}
      >
        {response && ngramViz(response)}
      </div>
      

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

        .form-group.buttons {
          display: flex;
          justify-content: center;
          margin-top: 20px;
        }

        .submit-button,
        .show-results-button,
        .hide-results-button,
        .save-data-button {
          padding: 10px 15px;
          background-color: #007bff;
          color: #fff;
          border: none;
          border-radius: 3px;
          cursor: pointer;
          margin-right: 10px;
        }

        .submit-button:hover,
        .show-results-button:hover,
        .hide-results-button:hover,
        .save-data-button:hover {
          background-color: #0069d9;
        }

        .response-buttons {
          margin-top: 20px;
          display: flex;
          gap: 10px;
          justify-content: center;
        }

        .response {
          margin-top: 20px;
          padding: 15px;
          background-color: #f1f1f1;
          border-radius: 8px;
        }

        .error {
          color: #dc3545;
          text-align: center;
        }
      `}</style>
    </div>
  );
}
