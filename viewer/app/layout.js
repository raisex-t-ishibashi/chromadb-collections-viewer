// viewer/app/layout.js
import './globals.css';

export const metadata = {
  title: 'ChromaDB Collections Viewer',
  description: 'Browse ChromaDB collections and records',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body>
        <header>
          <h1>ChromaDB Collections Viewer</h1>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
