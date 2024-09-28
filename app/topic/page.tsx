import React from 'react';
import Query from '../query';

const TopicPage = () => {
  return (
    <div>
      <h1>Topic Modeling Page </h1>

      <Query />
      
      <form>
        <input type="submit" value="Submit" />
      </form>
    </div>
  );
};

export default TopicPage;