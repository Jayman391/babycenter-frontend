import React from 'react';
import Query from '../query';

const NgramPage = () => {
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

export default NgramPage;