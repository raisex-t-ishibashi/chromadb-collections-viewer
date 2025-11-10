// viewer/components/Header.js
import Navigation from './Navigation';

export default function Header({ navLinks = [] }) {
  return (
    <header>
      <h1>ChromaDB Collections Viewer</h1>
      {navLinks.length > 0 && <Navigation links={navLinks} />}
    </header>
  );
}
