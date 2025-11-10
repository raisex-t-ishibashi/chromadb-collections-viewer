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
        {children}
      </body>
    </html>
  );
}
