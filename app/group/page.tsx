'use client';

import { useState, useEffect, Key } from 'react';
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

interface Topic {
  id: string;
  groups: string[];
}


export default function GroupNgramPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedParent, setSelectedParent] = useState('');
  const [subgroups, setSubgroups] = useState<string[]>([]);
  const [filteredSubgroups, setFilteredSubgroups] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [alpha, setAlpha] = useState(0.5); // Default value for the slider
  const [searchTerm, setSearchTerm] = useState('');
  const [topNgrams, setTopNgrams] = useState<any[]>([]); // Stores an array of top n-grams
  const [loading, setLoading] = useState(false); // Loading state for better UX
  const [groupNgramData, setGroupNgramData] = useState<{ [key: string]: NgramResponseData }>({});
  const [selectedNgrams, setSelectedNgrams] = useState<string[]>([]);
  const [isForceGraphRendered, setIsForceGraphRendered] = useState<boolean>(false);

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
      // make sure parentTopic.groups is not never 

      const groups = parentTopic?.groups || [];
      setSubgroups(groups);
      setFilteredSubgroups(groups.slice(0, 25));
    } else {
      setSubgroups([]);
      setFilteredSubgroups([]);
    }
  }, [selectedParent, topics]);

  useEffect(() => {
    const filtered = subgroups.filter((group) =>
      group.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredSubgroups(filtered.slice(0, 25));
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
    console.log('submitted allotax request');
    event.preventDefault();
    setLoading(true); // Start loading
    const sessionID = sessionStorage.getItem('sessionID') || Math.random().toString();
    const groupsString = selectedGroups.join(',');
    const url = `${BACKEND_IP}/allotax?sessionID=${sessionID}&alpha=${alpha}&groups=${encodeURIComponent(
      groupsString
    )}`;

    try {
      const res = await fetch(url);
      const data = await res.json();
      console.log('Divergence Matrix:', data['content']['divergence_matrix']);
      console.log('N-gram Index:', data['content']['ngram_index']);
      console.log('Group N-gram Data:', data['content']['group_ngram_data']);

      // Process data to get top 25 n-grams overall
      const topNgramsData = processTopNgrams(
        data['content']['divergence_matrix'],
        data['content']['ngram_index'],
        25
      );
      setTopNgrams(topNgramsData);

      // Save group n-gram data
      setGroupNgramData(data['content']['group_ngram_data']);

      // Render visualization
      beeswarmAllotaxViz(
        data['content']['divergence_matrix'],
        data['content']['ngram_index'],
        selectedGroups
      );
    } catch (error) {
      console.error('Error fetching allotax data:', error);
    } finally {
      setLoading(false); // End loading
    }
  };

  function processTopNgrams(divergence_matrix: any, ngram_index: any, topN: number) {
    const corpusCount = divergence_matrix[0].length;
    const tokens = Object.keys(ngram_index);

    // Flatten all divergences into a single array
    let data = tokens.map((token) => {
      const rowIndex = ngram_index[token];
      const divergences = divergence_matrix[rowIndex];
      const averageDivergence =
        divergences.flat().reduce((a: number, b: number) => a + b, 0) /
        ((corpusCount - 1) * corpusCount);
      return { token, averageDivergence };
    });

    // Sort and get top N tokens
    const topNgramsData = data
      .sort((a, b) => b.averageDivergence - a.averageDivergence)
      .slice(0, topN);

    return topNgramsData;
  }

  const beeswarmAllotaxViz = (divergence_matrix: any, ngram_index: any, groupNames: string[]) => {
    console.log('Starting beeswarm visualization...');

    // Clear existing SVG
    d3.select('#allotax-viz').select('svg').remove();
    d3.select('#allotax-viz').select('div').remove(); // Remove existing tooltip if any

    const margin = { top: 50, right: 100, bottom: 50, left: 100 };

    // Prepare data
    const corpusCount = divergence_matrix[0].length;
    const tokens = Object.keys(ngram_index);

    // Map corpus indices to selected group names
    const corpusNameMap = groupNames.reduce((acc, name, index) => {
      acc[index] = name.replace(/_/g, ' '); // Replace underscores with spaces for display
      return acc;
    }, {} as { [key: number]: string });

    let data = tokens.flatMap((token) => {
      const rowIndex = ngram_index[token];
      return divergence_matrix[rowIndex].map((divergences: number[], corpusIndex: number) => ({
        token,
        corpus: corpusNameMap[corpusIndex],
        averageDivergence: divergences.reduce((a, b) => a + b, 0) / (corpusCount - 1),
        rowIndex,
        tokenLength: token.length,
      }));
    });

    console.log('Data before filtering:', data);

    // Filter top N n-grams by divergence for each corpus
    const topN = 250;
    data = d3
      .groups(data, (d) => d.corpus)
      .flatMap(([corpus, entries]) =>
        entries.sort((a, b) => b.averageDivergence - a.averageDivergence).slice(0, topN)
      );

    console.log(`Filtered data (top ${topN} per corpus):`, data);

    // Set maximum radius limit
    const maxRadius = 50; // Adjust as needed

    // Compute required radius for each node based on token length
    data.forEach((d) => {
      const fontSize = 10; // Font size in pixels
      const averageCharWidth = fontSize * 0.6; // Approximate average character width
      const textWidth = d.token.length * averageCharWidth;
      d.requiredRadius = textWidth / 2 + 4; // Add padding

      // Check if the node exceeds the maximum radius
      if (d.requiredRadius > maxRadius) {
        d.tooLarge = true;
      } else {
        d.tooLarge = false;
      }
    });

    // Remove nodes that are too large
    data = data.filter((d) => !d.tooLarge);

    // Get unique corpus names and count
    const corpusNames = [...new Set(data.map((d) => d.corpus))];
    const numCorpora = corpusNames.length;

    // Calculate dynamic SVG width
    const corporaSpacing = 600; // Adjust spacing as needed
    const width = numCorpora * corporaSpacing + margin.left + margin.right;

    // Increase the height threefold
    const height = 1800; // Increased height

    // Create container
    const container = d3.select('#allotax-viz');

    // Append Save SVG button
    container
      .append('button')
      .text('Save SVG')
      .on('click', function () {
        const svgElement = container.select('svg').node() as Element;
        const serializer = new XMLSerializer();
        let source = serializer.serializeToString(svgElement);
        // Add name spaces.
        if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
          source = source.replace(
            /^<svg/,
            '<svg xmlns="http://www.w3.org/2000/svg"'
          );
        }
        if (!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)) {
          source = source.replace(
            /^<svg/,
            '<svg xmlns:xlink="http://www.w3.org/1999/xlink"'
          );
        }
        // Add xml declaration
        source = '<?xml version="1.0" standalone="no"?>\r\n' + source;

        // Convert svg source to URI data scheme.
        const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(source);

        // Set up the link
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = `beeswarm_plot.svg`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      });

    // Create SVG container
    const svg = container
      .append('svg')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .style('width', '100%')
      .style('height', 'auto')
      .style('background-color', 'black')
      .style('color', 'white');

    // Scales
    const xScale = d3
      .scalePoint()
      .domain(corpusNames)
      .range([margin.left, width - margin.right])
      .padding(0.5);

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    // Axes
    const xAxis = d3.axisBottom(xScale);

    svg
      .append('g')
      .attr('transform', `translate(0, ${height - margin.bottom})`)
      .call(xAxis)
      .selectAll('text')
      .attr('font-size', 12)
      .attr('fill', 'white'); // Set axis text color to white

    // Set axis lines and ticks to white
    svg.selectAll('.domain').attr('stroke', 'white');
    svg.selectAll('.tick line').attr('stroke', 'white');

    // Force simulation
    const simulation = d3
      .forceSimulation(data as any)
      .force(
        'x',
        d3.forceX((d: any) => xScale(d.corpus) || 0).strength(1) // Ensure xScale always returns a number
      )
      .force(
        'y',
        d3.forceY(height / 2).strength(0.1) // Weakly push nodes towards center vertically
      )
      .force(
        'collide',
        d3.forceCollide((d: any) => d.requiredRadius + 5).iterations(10)
      )
      .stop();

    // Run simulation
    for (let i = 0; i < 500; i++) simulation.tick();

    // Clamp positions to prevent overlapping axes
    data.forEach((d: any) => {
      d.x = Math.max(
        margin.left + d.requiredRadius,
        Math.min(width - margin.right - d.requiredRadius, d.x)
      );
      d.y = Math.max(
        margin.top + d.requiredRadius,
        Math.min(height - margin.bottom - d.requiredRadius, d.y)
      );
    });

    // Create a tooltip div
    const tooltip = d3
      .select('body') // Append to body instead of SVG
      .append('div')
      .style('position', 'absolute')
      .style('text-align', 'center')
      .style('padding', '6px')
      .style('font-size', '12px')
      .style('background', 'black')
      .style('border', 'solid 1px white')
      .style('border-radius', '8px')
      .style('pointer-events', 'none')
      .style('opacity', 0)
      .style('color', 'white'); // Set text color to white

    // Render nodes with labels
    const nodes = svg
      .append('g')
      .selectAll('g')
      .data(data)
      .enter()
      .append('g')
      .attr('transform', (d: any) => `translate(${d.x},${d.y})`)
      .on('mouseover', function (event, d) {
        tooltip.transition().duration(200).style('opacity', 1);
        tooltip
          .html(`Token: ${d.token}<br/>Divergence: ${d.averageDivergence.toFixed(4)}`)
          .style('left', event.pageX + 'px')
          .style('top', event.pageY - 28 + 'px')
          .style('color', 'white');
      })
      .on('mouseout', function () {
        tooltip.transition().duration(500).style('opacity', 0);
      })
      .on('click', function (event, d) {
        handleNgramClick(d.token);
      });

    nodes
      .append('circle')
      .attr('r', (d: any) => d.requiredRadius)
      .attr('fill', (d: any) => colorScale(d.corpus))
      .attr('stroke', 'white')
      .attr('stroke-width', 0.5);

    nodes
      .append('text')
      .text((d: any) => d.token)
      .attr('dy', '0.35em') // Center text vertically
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('fill', 'white'); // Adjust as needed

    setIsForceGraphRendered(true);

    console.log('Beeswarm visualization completed.');
  };

  const handleNgramClick = (ngram: string) => {
    setSelectedNgrams((prevSelected) => {
      if (prevSelected.includes(ngram)) {
        return prevSelected.filter((n) => n !== ngram);
      } else {
        return [...prevSelected, ngram];
      }
    });
  };

  // Function to render time series visualization
  useEffect(() => {
    if (selectedNgrams.length > 0 && Object.keys(groupNgramData).length > 0) {
      ngramTsViz(selectedNgrams, groupNgramData, selectedGroups);
    } else {
      // Clear the visualization if no n-grams are selected
      d3.select('#ngram-group-ts-viz').selectAll('*').remove();
    }
  }, [selectedNgrams, groupNgramData]);

  const ngramTsViz = (
    ngrams: string[],
    groupNgramData: { [groupName: string]: NgramResponseData },
    groupNames: string[]
  ) => {
    // Clear existing visualizations
    d3.select('#ngram-group-ts-viz').selectAll('*').remove();

    // Define color scale
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    // For each n-gram, create a separate plot
    ngrams.forEach((ngram) => {
      // Prepare data for this n-gram
      const ngramValues: any[] = [];

      groupNames.forEach((groupName) => {
        const groupData = groupNgramData[groupName];
        if (!groupData) {
          console.warn(`No data for group: ${groupName}`);
          return; // Skip if no data
        }

        const dateStrings = Object.keys(groupData.dates);
        dateStrings.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

        const dataPoints = dateStrings
          .map((dateStr) => {
            const date = new Date(dateStr);
            const rank = groupData.dates[dateStr]['1-gram']['ranks'][ngram];
            return rank !== undefined ? { date, rank, group: groupName } : null;
          })
          .filter((d) => d !== null);

        // **Apply 5-point moving average to the rank data and round up**
        const ranks = dataPoints.map((d) => d.rank);
        const smoothedRanks = ranks.map((_, i, arr) => {
          const window = arr.slice(Math.max(0, i - 2), Math.min(arr.length, i + 3));
          const avg = window.reduce((sum, val) => sum + val, 0) / window.length;
          return Math.ceil(avg); // Round up the average
        });

        dataPoints.forEach((d, i) => {
          d.rank = smoothedRanks[i];
        });

        ngramValues.push(...(dataPoints as any[]));
      });

      if (ngramValues.length === 0) {
        console.error(`No data available for n-gram: ${ngram}`);
        return;
      }
      // Create a container div for this n-gram
      const container = d3
        .select('#ngram-group-ts-viz')
        .append('div')
        .attr('class', 'ngram-group-container');

      // Add a title for the n-gram
      container
        .append('h3')
        .text(`Time Series for N-gram: ${ngram}`)
        .style('text-align', 'center')
        .style('color', 'white'); // Set title color to white

      // Add a save button
      container
        .append('button')
        .text('Save SVG')
        .on('click', function () {
          // Code to save the SVG
          const svgElement = container.select('svg').node() as Element;
          const serializer = new XMLSerializer();
          let source = serializer.serializeToString(svgElement);
          // Add name spaces.
          if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
            source = source.replace(
              /^<svg/,
              '<svg xmlns="http://www.w3.org/2000/svg"'
            );
          }
          if (!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)) {
            source = source.replace(
              /^<svg/,
              '<svg xmlns:xlink="http://www.w3.org/1999/xlink"'
            );
          }
          // Add xml declaration
          source = '<?xml version="1.0" standalone="no"?>\r\n' + source;

          // Convert svg source to URI data scheme.
          const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(source);

          // Set up the link
          const downloadLink = document.createElement('a');
          downloadLink.href = url;
          downloadLink.download = `ngram_${ngram}.svg`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
        });

      // Set up the SVG canvas dimensions
      const margin = { top: 20, right: 80, bottom: 30, left: 50 };
      const width = 1400 - margin.left - margin.right;
      const height = 1400 - margin.top - margin.bottom;
      const svg = container
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .style('background-color', 'black') // Set background color to black
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      // Set up scales
      const x = d3
        .scaleTime()
        .domain(d3.extent(ngramValues, (d) => d.date) as [Date, Date])
        .range([0, width]);

      const y = d3
        .scaleLinear()
        .domain([
          d3.min(ngramValues, (d) => d.rank)!, // Inverted domain for rank
          d3.max(ngramValues, (d) => d.rank)!,
        ])
        .nice()
        .range([0, height]); // Higher ranks at the top

      // Add X axis
      svg
        .append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll('text')
        .attr('fill', 'white');

      // Add Y axis
      svg
        .append('g')
        .attr('class', 'y-axis')
        .call(d3.axisLeft(y))
        .selectAll('text')
        .attr('fill', 'white');

      // Set axis lines and ticks to white
      svg.selectAll('.domain').attr('stroke', 'white');
      svg.selectAll('.tick line').attr('stroke', 'white');

      // Group data by group name
      const dataByGroup = d3.group(ngramValues, (d) => d.group);

      // Define line generator
      const line = d3
        .line<{ date: Date; rank: number }>()
        .x((d) => x(d.date))
        .y((d) => y(d.rank));

      // Add lines and points for each group
      dataByGroup.forEach((values, groupName) => {
        svg
          .append('path')
          .datum(values)
          .attr('fill', 'none')
          .attr('stroke', color(groupName))
          .attr('stroke-width', 1.5)
          .attr('d', line);

        // Add circles at data points
        svg
          .selectAll(`.dot-${groupName}`)
          .data(values)
          .enter()
          .append('circle')
          .attr('class', `dot-${groupName}`)
          .attr('cx', (d) => x(d.date))
          .attr('cy', (d) => y(d.rank))
          .attr('r', 3)
          .attr('fill', color(groupName))
          .on('mouseover', function (event, d) {
            Tooltip.style('opacity', 1);
          })
          .on('mousemove', function (event, d) {
            Tooltip.html(
              `<u>${ngram}</u><br>Group: ${d.group}<br>Date: ${
                d.date.toISOString().split('T')[0]
              }<br>Rank: ${d.rank}`
            )
              .style('left', event.pageX + 20 + 'px')
              .style('top', event.pageY - 30 + 'px');
          })
          .on('mouseleave', function () {
            Tooltip.style('opacity', 0);
          });
      });

      // Add tooltip
      const Tooltip = d3
        .select('body') // Append to body
        .append('div')
        .style('opacity', 0)
        .attr('class', 'tooltip')
        .style('background-color', 'black')
        .style('border', 'solid 1px white')
        .style('border-radius', '5px')
        .style('padding', '5px')
        .style('position', 'absolute')
        .style('z-index', '10')
        .style('color', 'white');

      // Add legend
      const legendData = Array.from(dataByGroup.keys()).map((groupName) => ({
        label: groupName.replace(/_/g, ' '),
        color: color(groupName),
      }));

      const legend = svg
        .selectAll(`.legend-${ngram}`)
        .data(legendData)
        .enter()
        .append('g')
        .attr('class', `legend-${ngram}`)
        .attr('transform', (_, i) => `translate(0,${i * 20})`)
        .style('color', 'white');

      legend
        .append('rect')
        .attr('x', width - 18)
        .attr('y', 0)
        .attr('width', 18)
        .attr('height', 18)
        .style('fill', (d) => d.color);

      legend
        .append('text')
        .attr('x', width - 24)
        .attr('y', 9)
        .attr('dy', '.35em')
        .style('text-anchor', 'end')
        .attr('fill', 'white') // Set text color to white
        .text((d) => d.label);
    });
  };

  return (
    <div className="dropdown-page">
      <h2>Group Level Comparison</h2>

      {/* Form and selected groups */}
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
          <label htmlFor="alpha">Alpha Value: {alpha.toFixed(2)}</label>
          <input
            type="range"
            id="alpha"
            min="0.01"
            max="1"
            step="0.01"
            value={alpha}
            onChange={(e) => setAlpha(parseFloat(e.target.value))}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="parent-dropdown">Topic:</label>
          <select
            id="parent-dropdown"
            value={selectedParent}
            onChange={(e) => setSelectedParent(e.target.value)}
          >
            <option value="">Select a Topic</option>
            {topics.map((topic: { id: Key }) => (
              <option key={topic.id} value={topic.id}>
                {String(topic.id).replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Search Groups:</label>
          <input
            type="text"
            placeholder="Search subgroups..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="form-group">
          <label>Groups (showing first 25 results):</label>
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

        <button type="submit" className="submit-button" disabled={loading}>
          {loading ? 'Processing...' : 'Submit'}
        </button>
      </form>

      {/* Display Top N-grams Table */}
      {topNgrams && topNgrams.length > 0 && (
        <div className="top-ngrams">
          <h3>Top N-grams</h3>
          <table>
            <thead>
              <tr>
                <th>N-gram</th>
                <th>Average Divergence</th>
              </tr>
            </thead>
            <tbody>
              {topNgrams.map((d, index) => (
                <tr
                  key={index}
                  onClick={() => handleNgramClick(d.token)}
                  style={{
                    backgroundColor: selectedNgrams.includes(d.token) ? '#007bff' : 'transparent',
                    color: selectedNgrams.includes(d.token) ? 'white' : 'black',
                    cursor: 'pointer',
                  }}
                >
                  <td>{d.token}</td>
                  <td>{d.averageDivergence.toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Visualization Section */}
      <div className="visualization-section">
        <div
          id="allotax-viz"
          style={{
            width: '100%',
            height: 'auto',
            position: 'relative',
            marginTop: '20px',
          }}
        ></div>

        {/* Time Series Visualization */}
        <div
          id="ngram-group-ts-viz"
          style={{
            width: '100%',
            height: '1400px',
            marginTop: '20px',
          }}
        ></div>
      </div>

      <style jsx>{`
        .dropdown-page {
          width: 100%;
          max-width: 2000px;
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
        /* Styles for the top n-grams table */
        .top-ngrams {
          margin-top: 20px;
          margin-bottom: 20px;
        }
        .top-ngrams h3 {
          margin-bottom: 10px;
          font-size: 1.2rem;
          color: #333;
        }
        .top-ngrams table {
          width: 100%;
          border-collapse: collapse;
        }
        .top-ngrams th,
        .top-ngrams td {
          border: 1px solid #ccc;
          padding: 8px;
          text-align: left;
          font-size: 1rem;
        }
        .top-ngrams th {
          background-color: #f2f2f2;
        }
        .top-ngrams tr:hover {
          background-color: #f1f1f1;
        }
        .visualization-section {
          margin-top: 20px;
        }
        /* Tooltip styles */
        #allotax-viz div,
        #ngram-group-ts-viz div {
          position: absolute;
          text-align: center;
          width: auto;
          height: auto;
          padding: 5px;
          font: 12px sans-serif;
          background: black;
          border: solid 1px white;
          border-radius: 8px;
          pointer-events: none;
          color: white;
        }
      `}</style>
    </div>
  );
}
