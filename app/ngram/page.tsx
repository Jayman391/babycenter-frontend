import React from 'react';
import Query from '../query';
import { BACKEND_IP } from '../config';

export default function NgramPage() {
  return (
    <div>
      <h1>N Gram Visualization Page</h1>

      <Query />

      <form>
        <input type="submit" value="Submit" />
      </form>
    </div>
  );
};

