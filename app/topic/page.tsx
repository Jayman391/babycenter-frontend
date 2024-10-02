'use client';

import React, { useState } from 'react';
import { BACKEND_IP } from '../config';

// Define the shape of the response from the backend
interface TopicResponse {
  status: string;
  message: string;
  content: {
    embedding: string;
    dimred: string;
    clustering: string;
    vectorizer: string;
    finetune: string;
  };
}

export default function TopicPage() {
  // Initialize state variables with default values
  const [embedding, setEmbedding] = useState<string>('word2vec');
  const [dimred, setDimred] = useState<string>('pca');
  const [clustering, setClustering] = useState<string>('kmeans');
  const [vectorizer, setVectorizer] = useState<string>('tfidf');
  const [finetune, setFinetune] = useState<string>('');

  // State variables for handling responses and loading state
  const [response, setResponse] = useState<TopicResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setResponse(null);

    // Construct the URL with path parameters
    const url = `${BACKEND_IP}/topic/${encodeURIComponent(embedding)}/${encodeURIComponent(dimred)}/${encodeURIComponent(clustering)}/${encodeURIComponent(vectorizer)}/`;

    try {
      const res = await fetch(url, { method: 'GET' });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const data: TopicResponse = await res.json();
      setResponse(data);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Error fetching data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1>Topic Modeling Page</h1>

      <form onSubmit={handleSubmit}>
        {/* Embedding Input */}
        <div>
          <label htmlFor="embedding">Embedding:</label>
          <select
            id="embedding"
            name="embedding"
            value={embedding}
            onChange={(e) => setEmbedding(e.target.value)}
            required
            style={{ color: 'black' }}
          >
            <option value="word2vec">Word2Vec</option>
            <option value="fasttext">FastText</option>
            <option value="glove">GloVe</option>
          </select>
        </div>

        {/* Dimensionality Reduction Input */}
        <div>
          <label htmlFor="dimred">Dimensionality Reduction:</label>
          <select
            id="dimred"
            name="dimred"
            value={dimred}
            onChange={(e) => setDimred(e.target.value)}
            required
            style={{ color: 'black' }}
          >
            <option value="pca">PCA</option>
            <option value="tsne">t-SNE</option>
          </select>
        </div>

        {/* Clustering Input */}
        <div>
          <label htmlFor="clustering">Clustering:</label>
          <select
            id="clustering"
            name="clustering"
            value={clustering}
            onChange={(e) => setClustering(e.target.value)}
            required
            style={{ color: 'black' }}
          >
            <option value="kmeans">KMeans</option>
            <option value="dbscan">DBSCAN</option>
          </select>
        </div>

        {/* Vectorizer Input */}
        <div>
          <label htmlFor="vectorizer">Vectorizer:</label>
          <select
            id="vectorizer"
            name="vectorizer"
            value={vectorizer}
            onChange={(e) => setVectorizer(e.target.value)}
            required
            style={{ color: 'black' }}
          >
            <option value="tfidf">TF-IDF</option>
            <option value="count">CountVectorizer</option>
          </select>
        </div>

        {/* Submit Button */}
        <div>
          <input type="submit" value="Submit" />
        </div>
      </form>

      {/* Loading Indicator */}
      {isLoading && <p>Loading...</p>}

      {/* Error Message */}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Display Response */}
      {response && (
        <div>
          <h2>Response from Server:</h2>
          <pre>{JSON.stringify(response, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
