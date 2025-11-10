// viewer/components/Pagination.js
import Link from 'next/link';

export default function Pagination({ collectionName, currentPage, totalPages, limit }) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="pagination">
      {currentPage > 1 && (
        <Link href={`/collection/${collectionName}?page=${currentPage - 1}&limit=${limit}`}>
          &laquo; 前へ
        </Link>
      )}

      {pages.map(page => (
        page === currentPage ? (
          <span key={page} className="current-page">{page}</span>
        ) : (
          <Link key={page} href={`/collection/${collectionName}?page=${page}&limit=${limit}`}>
            {page}
          </Link>
        )
      ))}

      {currentPage < totalPages && (
        <Link href={`/collection/${collectionName}?page=${currentPage + 1}&limit=${limit}`}>
          次へ &raquo;
        </Link>
      )}
    </div>
  );
}
