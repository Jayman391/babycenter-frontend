'use client';

import React, { useEffect, useState } from 'react';
import { BACKEND_IP } from '../config';
import * as d3 from 'd3';

interface NgramResponseData {
  full_corpus: {
    '1-gram': {
      ranks: { [key: string]: number };
      counts: { [key: string]: number };
    };
  };
  dates: {
    [dateStr: string]: {
      '1-gram': {
        ranks: { [key: string]: number };
        counts: { [key: string]: number };
      };
    };
  };
}

interface DataArrayElement {
  key: string;
  rank: number;
  freq: number;
  x?: number;
  y?: number;
}

export default function NgramPage() {
  const [startDate, setStartDate] = useState<string>('2010-01-01');
  const [endDate, setEndDate] = useState<string>('2024-03-01');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState<string>('');
  const [response, setResponse] = useState<NgramResponseData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNgrams, setSelectedNgrams] = useState<string[]>([]);
  const [showResults, setShowResults] = useState<boolean>(false);
  const [rankPercentile, setRankPercentile] = useState<number>(0); // Slider value from 0 to 1
  const [tableNgrams, setTableNgrams] = useState<DataArrayElement[]>([]); // N-grams to display in the table
  const [isForceGraphRendered, setIsForceGraphRendered] = useState<boolean>(false);
  const [numNodes, setNumNodes] = useState<number>(250); // Number of nodes for force graph
  const [allResponses, setAllResponses] = useState<NgramResponseData[]>([]);

  const fetchNgramData = async () => {
    setIsLoading(true);
    setError(null);
    setResponse(null);
    setShowResults(false); // Reset showResults when fetching new data

    const encodedKeywords: string =
      keywords.map((k) => encodeURIComponent(k)).join(',') || 'all';
    const startDateInt: number = parseInt(startDate.replace(/-/g, ''), 10);
    const endDateInt: number = parseInt(endDate.replace(/-/g, ''), 10);

    const url = `${BACKEND_IP}/ngram?sessionID=${sessionStorage.getItem('sessionID')}&startDate=${startDateInt}&endDate=${endDateInt}&keywords=${encodedKeywords}`;

    try {
      const res: Response = await fetch(url);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data: { content: NgramResponseData } = await res.json();
      setResponse(data.content);
      setAllResponses((prevAllResponses) => [...prevAllResponses, data.content]);
      setSelectedNgrams([]); // Reset selectedNgrams when new data is fetched
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'An error occurred. Please try again.');
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeywordAdd = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedKeyword: string = keywordInput.trim();
    if (trimmedKeyword) {
      setKeywords([...keywords, trimmedKeyword]);
      setKeywordInput('');
    }
  };

  const handleKeywordDelete = (keywordToRemove: string) => {
    setKeywords(keywords.filter((keyword) => keyword !== keywordToRemove));
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
    const jsonString: string = JSON.stringify(response, null, 2);
    const blob: Blob = new Blob([jsonString], {
      type: 'application/json;charset=utf-8;',
    });
    const link: HTMLAnchorElement = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'ngram_results.json');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handler for the slider change
  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(event.target.value);
    setRankPercentile(value);
  };

  // Update table n-grams when rankPercentile or response changes
  useEffect(() => {
    if (response) {
      const fullRanks = response.full_corpus['1-gram']['ranks'];
      const fullFreqs = response.full_corpus['1-gram']['counts'];
      const ngramArray: DataArrayElement[] = Object.keys(fullRanks).map((key) => ({
        key: key,
        rank: fullRanks[key],
        freq: fullFreqs[key],
      }));

      // Sort n-grams by rank (ascending order)
      ngramArray.sort((a, b) => a.rank - b.rank);

      const totalNgrams = ngramArray.length;
      const index = Math.floor(rankPercentile * (totalNgrams - 1));
      const startIndex = Math.max(0, index - 2);
      const endIndex = Math.min(totalNgrams, startIndex + 15);

      const selectedNgrams = ngramArray.slice(startIndex, endIndex);
      setTableNgrams(selectedNgrams);
    }
  }, [rankPercentile, response]);

  const ngramViz = (responseData: NgramResponseData) => {
    // Extract data
    const data: NgramResponseData = responseData;
    const full_corpus = data['full_corpus'];
    const full_ranks = full_corpus['1-gram']['ranks'];
    const full_freqs = full_corpus['1-gram']['counts'];

    setIsForceGraphRendered(false);

    // Convert full_ranks object into an array of objects suitable for D3
    const dataArray: DataArrayElement[] = Object.keys(full_ranks)
      .map((key) => ({
        key: key,
        rank: full_ranks[key],
        freq: full_freqs[key],
      }))
      .sort((a, b) => a.rank - b.rank)
      .slice(0, numNodes); // Limit to selected number of nodes

    // Remove any existing SVG to prevent duplicates
    d3.select('#ngram-viz').select('svg').remove();

    // Set initial dimensions
    const width: number = 800;
    const height: number = 800;

    // Create SVG container
    const svg = d3
      .select('#ngram-viz')
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .style('background-color', 'white'); // Set background to white

    // Define size scale based on data (higher-ranked words are larger)
    const size = d3
      .scalePow()
      .exponent(0.25)
      .domain(d3.extent(dataArray, (d) => d.rank) as [number, number])
      .range([60, 20]); // Adjust the range as needed

    // Define color scale from white to yellow to orange to red
    const color = d3
      .scaleSequential(d3.interpolateYlOrRd)
      .domain(d3.extent(dataArray, (d) => d.rank) as [number, number]);

    // Create a tooltip
    const Tooltip = d3
      .select('body')
      .append('div')
      .style('opacity', 0)
      .attr('class', 'tooltip')
      .style('background-color', 'white')
      .style('border', 'solid 2px')
      .style('border-radius', '5px')
      .style('padding', '5px')
      .style('position', 'absolute')
      .style('z-index', '10')
      .style('color', 'black');

    // Tooltip mouse event functions
    const mouseover = function (
      this: SVGGElement,
      event: MouseEvent,
      d: DataArrayElement
    ) {
      Tooltip.style('opacity', 1);
      d3.select(this).select('circle').attr('stroke-width', 2);
    };

    const mousemove = function (event: MouseEvent, d: DataArrayElement) {
      Tooltip.html(`<u>${d.key}</u><br>Rank: ${d.rank}<br>Frequency: ${d.freq}`)
        .style('left', event.pageX + 20 + 'px')
        .style('top', event.pageY - 30 + 'px');
    };

    const mouseleave = function (
      this: SVGGElement,
      event: MouseEvent,
      d: DataArrayElement
    ) {
      Tooltip.style('opacity', 0);
      d3.select(this).select('circle').attr('stroke-width', 1);
    };

    // Initialize the nodes (groups containing circles and text)
    const node = svg
      .append('g')
      .selectAll<SVGGElement, DataArrayElement>('g')
      .data(dataArray)
      .join('g')
      .attr('class', 'node')
      .on('mouseover', mouseover)
      .on('mousemove', mousemove)
      .on('mouseleave', mouseleave)
      .on('click', function (
        this: SVGGElement,
        event: MouseEvent,
        d: DataArrayElement
      ) {
        // On click, toggle selection and update the time series visualization
        setSelectedNgrams((prevSelected) => {
          const index = prevSelected.indexOf(d.key);
          if (index > -1) {
            // If already selected, remove it
            return prevSelected.filter((key) => key !== d.key);
          } else {
            // Add to selection
            return [...prevSelected, d.key];
          }
        });

        // Reset hover effect
        Tooltip.style('opacity', 0);
        d3.select(this).select('circle').attr('stroke-width', 1);
      });

    // Append circles to the nodes
    node
      .append('circle')
      .attr('r', (d) => size(d.rank))
      .style('fill', (d) => color(d.rank))
      .style('fill-opacity', 0.8)
      .attr('stroke', 'black')
      .style('stroke-width', 1)
      .style('opacity', 0); // Set initial opacity to 0

    // Append text labels to the nodes
    node
      .append('text')
      .text((d) => d.key)
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .style('font-size', (d) => `${size(d.rank) / 2}px`)
      .style('pointer-events', 'none'); // Prevent text from capturing mouse events

    // Define a radial scale to position nodes based on their value
    const minValue: number = d3.min(dataArray, (d) => d.rank)!;
    const maxValue: number = d3.max(dataArray, (d) => d.rank)!;

    const radialScale = d3
      .scaleLinear()
      .domain([minValue, maxValue])
      .range([0, width / 2 - 60]);

    // Force simulation
    const simulation = d3
      .forceSimulation<DataArrayElement>()
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('charge', d3.forceManyBody().strength(0.5))
      .force(
        'radial',
        d3
          .forceRadial<DataArrayElement>(
            (d) => radialScale(d.rank),
            width / 2,
            height / 2
          )
          .strength(1)
      )
      .force(
        'collide',
        d3
          .forceCollide<DataArrayElement>()
          .strength(1)
          .radius((d) => size(d.rank) + 1)
          .iterations(1)
      );

    simulation
      .nodes(dataArray)
      .on('tick', () => {
        node.attr('transform', (d) => `translate(${d.x},${d.y})`);
      })
      .on('end', () => {
        // Calculate the bounding box of all nodes
        const xExtent = d3.extent(dataArray, (d) => d.x!);
        const yExtent = d3.extent(dataArray, (d) => d.y!);

        const padding = 50; // Add some padding

        const xMin = xExtent[0]! - padding;
        const xMax = xExtent[1]! + padding;
        const yMin = yExtent[0]! - padding;
        const yMax = yExtent[1]! + padding;

        const newWidth = xMax - xMin;
        const newHeight = yMax - yMin;

        // Update the SVG viewBox to include all nodes
        svg.attr('viewBox', `${xMin} ${yMin} ${newWidth} ${newHeight}`);

        // Transition circles to full opacity when the simulation ends
        node
          .select('circle')
          .transition()
          .duration(500)
          .style('opacity', 1);

        // If you have text labels, you can also fade them in
        node
          .select('text')
          .transition()
          .duration(500)
          .style('opacity', 1);

        // Update any state or perform other actions
        setIsForceGraphRendered(true);
      });
  };

  // Time series visualization function remains unchanged
  const ngramTsViz = (
    ngrams: string[],
    responseData: NgramResponseData,
    setSelectedNgrams: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (ngrams.length === 0) {
      // If no ngrams are selected, clear the visualization
      d3.select('#ngram-ts-viz').select('svg').remove();
      return;
    }

    const data = responseData['dates'];
    const dateStrings: string[] = Object.keys(data);

    // Sort date strings in ascending order
    dateStrings.sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime()
    );

    // Convert date strings to Date objects for plotting
    const dateObjects: Date[] = dateStrings.map(
      (dateStr) => new Date(dateStr)
    );

    // Helper function to calculate the moving average
    const calculateMovingAverage = (
      values: { date: Date; rank: number }[],
      windowSize = 25
    ) => {
      return values.map((d, i, arr) => {
        const start = Math.max(0, i - windowSize + 1);
        const subset = arr.slice(start, i + 1);
        const average = d3.mean(subset, (s) => s.rank)! - 1;
        return { date: d.date, rank: average.toFixed(0) };
      });
    };

    // Prepare data for each ngram with smoothing
    const ngramData = ngrams.map((ngram) => {
      const ngramValues = dateStrings
        .map((dateStr, index) => {
          const rank = data[dateStr]['1-gram']['ranks'][ngram];
          if (rank !== undefined) {
            return { date: dateObjects[index], rank: rank };
          } else {
            return null;
          }
        })
        .filter(
          (d): d is { date: Date; rank: number } => d !== null
        ); // Filter out null values

      const smoothedValues = calculateMovingAverage(ngramValues);
      return { ngram: ngram, values: smoothedValues };
    });

    // Set up the SVG canvas dimensions
    d3.select('#ngram-ts-viz').select('svg').remove();
    const margin = { top: 20, right: 80, bottom: 30, left: 50 };
    const width: number = 800 - margin.left - margin.right;
    const height: number = 800 - margin.top - margin.bottom;
    const svg = d3
      .select('#ngram-ts-viz')
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('color', 'white')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Set up scales
    const x = d3
      .scaleTime()
      .domain(d3.extent(dateObjects) as [Date, Date])
      .range([0, width]);

    const y = d3
      .scaleLinear()
      .domain([
        d3.max(ngramData, (ngram) =>
          d3.max(ngram.values, (d) => Number(d.rank))
        )!,
        0,
      ])
      .nice()
      .range([height, 0]);

    // Define color scale
    const color = d3
      .scaleOrdinal<string>()
      .domain(ngrams)
      .range(d3.schemeCategory10);

    // Add X axis
    svg
      .append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .style('font-size', '12px');

    // Add Y axis
    svg
      .append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(y))
      .style('font-size', '12px');

    // Add tooltip
    const Tooltip = d3
      .select('body')
      .append('div')
      .style('opacity', 0)
      .attr('class', 'tooltip')
      .style('background-color', 'white')
      .style('border', 'solid 1px #ccc')
      .style('border-radius', '5px')
      .style('padding', '5px')
      .style('position', 'absolute')
      .style('z-index', '10')
      .style('color', 'black');

    // Define line generator
    const line = d3
      .line<{ date: Date; rank: number }>()
      .x((d) => x(d.date))
      .y((d) => y(d.rank));

    // Add lines and points for each ngram
    ngramData.forEach((ngram) => {
      svg
        .append('path')
        .datum(ngram.values.map((d) => ({ ...d, rank: Number(d.rank) })))
        .attr('fill', 'none')
        .attr('stroke', color(ngram.ngram))
        .attr('stroke-width', 1.5)
        .attr('d', line);

      // Add circles at data points
      svg
        .selectAll(`.dot-${ngram.ngram}`)
        .data(ngram.values)
        .enter()
        .append('circle')
        .attr('class', `dot-${ngram.ngram}`)
        .attr('cx', (d) => x(d.date))
        .attr('cy', (d) => y(Number(d.rank))) // Convert the string value to a number
        .attr('r', 3)
        .attr('fill', color(ngram.ngram))
        .on('mouseover', function (event, d) {
          Tooltip.style('opacity', 1);
        })
        .on('mousemove', function (event, d) {
          Tooltip.html(
            `<u>${ngram.ngram}</u><br>Date: ${
              d.date.toISOString().split('T')[0]
            }<br>Rank: ${d.rank}`
          )
            .style('left', event.pageX + 20 + 'px')
            .style('top', event.pageY - 30 + 'px');
        })
        .on('mouseleave', function (event, d) {
          Tooltip.style('opacity', 0);
        });
    });

    // Add legend
    svg
      .selectAll('.legend')
      .data(ngrams)
      .enter()
      .append('text')
      .style('font-size', '12px')
      .attr('x', width - margin.right)
      .attr('y', (_, i) => 20 + i * 20)
      .attr('fill', (d) => color(d))
      .text((d) => d)
      .attr('text-anchor', 'end')
      .style('cursor', 'pointer')
      .on('click', function (event, d) {
        setSelectedNgrams((prevSelected) =>
          prevSelected.filter((ngram) => ngram !== d)
        );
      });
  };

  useEffect(() => {
    if (response) {
      ngramViz(response);
    }
  }, [response, numNodes]);

  useEffect(() => {
    if (response) {
      ngramTsViz(selectedNgrams, response, setSelectedNgrams);
    } else {
      // Clear the visualization
      d3.select('#ngram-ts-viz').select('svg').remove();
    }
  }, [selectedNgrams, response]);

  // Functions to save the plots remain unchanged
  const saveNgramViz = () => {
    const svgElement = d3.select('#ngram-viz').select('svg').node() as Element;
    if (svgElement) {
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svgElement);
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'ngram_visualization.svg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const saveTimeSeriesViz = () => {
    const svgElement = d3.select('#ngram-ts-viz').select('svg').node() as Element;
    if (svgElement) {
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svgElement);
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'ngram_time_series.svg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
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
                <button onClick={() => handleKeywordDelete(keyword)}>
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="form-group">
          <label htmlFor="numNodes">Number of Nodes in Force Graph:</label>
          <input
            type="number"
            id="numNodes"
            value={numNodes}
            onChange={(e) => setNumNodes(parseInt(e.target.value))}
            min="1"
          />
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

      {/* Main content layout */}
      <div className="ngram-page-content" style={{ display: 'flex', marginTop: '20px'}}>
        {/* Left column: Time Series Visualization */}
        <div className="left-column" style={{ flex: 1 }}>
          <div
            id="ngram-ts-viz"
            style={{
              width: '650px',
              height: '800px',
              position: 'relative',
              marginRight : '100px',
              visibility: selectedNgrams.length > 0 ? 'visible' : 'hidden',
            }}
          ></div>
          {selectedNgrams.length > 0 && (
            <button onClick={saveTimeSeriesViz} className="save-plot-button" style={{width : "90%"}}>
              Save Time Series Plot
            </button>
          )}
        </div>

        {/* Right column: Force graph and Table stacked vertically */}
        <div className="right-column" style={{ flex: 1, marginLeft: '0px', display: 'flex', flexDirection: 'column' }}>
          {response && (
            <div className="ngram-table-section" style={{ color: 'white', marginTop: '20px' }}>
              <h3>N-gram Table</h3>
              <div className="slider-container">
                <label htmlFor="rankSlider">
                  Rank Percentile (More Common to Rare): {rankPercentile.toFixed(2)}
                </label>
                <input
                  type="range"
                  id="rankSlider"
                  min="0"
                  max="1"
                  step="0.0001"
                  value={rankPercentile}
                  onChange={handleSliderChange}
                />
              </div>
              <table className="ngram-table" style={{ color: 'white' }}>
                <thead>
                  <tr>
                    <th>N-gram</th>
                    <th>Rank</th>
                    <th>Frequency</th>
                  </tr>
                </thead>
                <tbody>
                  {tableNgrams.map((ngram) => (
                    <tr
                      key={ngram.key}
                      onClick={() => {
                        setSelectedNgrams((prevSelected) => {
                          if (prevSelected.includes(ngram.key)) {
                            return prevSelected.filter(
                              (key) => key !== ngram.key
                            );
                          } else {
                            return [...prevSelected, ngram.key];
                          }
                        });
                      }}
                      style={{
                        backgroundColor: selectedNgrams.includes(ngram.key)
                          ? '#007bff'
                          : 'transparent',
                        cursor: 'pointer',
                      }}
                    >
                      <td>{ngram.key}</td>
                      <td>{ngram.rank}</td>
                      <td>{ngram.freq}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div
            id="ngram-viz"
            style={{
              width: '700px',
              height: '700px',
              position: 'relative',
              visibility: isForceGraphRendered ? 'visible' : 'hidden',
            }}
          ></div>
          {isForceGraphRendered && (
            <button onClick={saveNgramViz} className="save-plot-button">
              Save N-Gram Visualization
            </button>
          )}
        </div>
      </div>

      {/* Rest of your component, including styles */}
      <style jsx>{`
        .ngram-page {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0px;
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
        .save-data-button,
        .save-plot-button {
          padding: 10px 15px;
          background-color: #007bff;
          color: #fff;
          border: none;
          border-radius: 3px;
          cursor: pointer;
          margin-right: 10px;
          margin-top: 10px;
        }

        .submit-button:hover,
        .show-results-button:hover,
        .hide-results-button:hover,
        .save-data-button:hover,
        .save-plot-button:hover {
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

        .ngram-table-section {
          margin-top: 20px;
        }

        .slider-container {
          margin-bottom: 10px;
        }

        .ngram-table {
          width: 100%;
          border-collapse: collapse;
        }

        .ngram-table th,
        .ngram-table td {
          border: 1px solid #ccc;
          padding: 8px;
          text-align: center;
        }

        .ngram-table tr:hover {
          background-color: #f1f1f1;
        }

        .ngram-table tr.selected {
          background-color: #007bff;
          color: #fff;
        }

        .visualization-container {
          margin-top: 20px;
        }

        .left-column,
        .right-column {
          position: relative;
        }

        .save-plot-button {
          display: block;
          margin-top: 10px;
        }
      `}</style>
    </div>
  );
}
