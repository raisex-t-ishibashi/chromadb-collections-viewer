import Navigation from './Navigation';

export default function Header({ navLinks = [] }) {
  return (
    <header className="bg-blue-500 text-white px-8 py-4 shadow-md">
      <h1 className="text-2xl font-bold mb-2">ChromaDB Collections Viewer</h1>
      {navLinks.length > 0 && <Navigation links={navLinks} />}
    </header>
  );
}
