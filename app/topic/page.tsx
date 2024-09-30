import React from 'react';
import Query from '../query';
import { BACKEND_IP } from '../config';

export default function TopicPage(){

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
