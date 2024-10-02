import Link from 'next/link';

const Nav = () => {
  return (
    <nav style={{ display: 'flex', justifyContent: 'center', backgroundColor: '#f8f9fa', padding: '10px 0', width: '100%' }}>
      <ul style={{ display: 'flex', listStyle: 'none', justifyContent: 'space-around', width: '80%' , color:'black'}}>
        <li>
          <Link href="/">Home</Link>
        </li>
        <li>
          <Link href="/query">Custom Query</Link>  
        </li> 
        <li>
          <Link href="/ngram">N-gram Visualization</Link>
        </li>
        <li>
          <Link href="/topic">Topic Modeling</Link>
        </li>
       
        <li>
          <Link href="/about"> About </Link>
        </li>
      </ul>
    </nav>
  );
};

export default Nav;
