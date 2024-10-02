import Link from 'next/link';

const Footer = () => {
  return (
    <footer style={{ display: 'flex', justifyContent: 'center', backgroundColor: '#f8f9fa', padding: '10px 0', width: '100%', position: 'fixed', bottom : 0 }}>
      <ul style={{ display: 'flex', listStyle: 'none', justifyContent: 'space-around', width: '80%' , color:'black'}}>
        <li>
          <Link href="/">Footer Placeholder</Link>
        </li>

      </ul>
    </footer>
  );
};

export default Footer;
