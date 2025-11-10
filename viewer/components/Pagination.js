import Link from 'next/link';

export default function Pagination({ collectionName, currentPage, totalPages, limit }) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex justify-center mt-6 gap-2">
      {currentPage > 1 && (
        <Link
          href={`/collection/${collectionName}?page=${currentPage - 1}&limit=${limit}`}
          className="inline-block px-3 py-2 border border-gray-200 rounded no-underline text-gray-800 hover:bg-gray-100"
        >
          &laquo; 前へ
        </Link>
      )}

      {pages.map(page => (
        page === currentPage ? (
          <span key={page} className="inline-block px-3 py-2 bg-blue-500 text-white border border-blue-500 rounded">
            {page}
          </span>
        ) : (
          <Link
            key={page}
            href={`/collection/${collectionName}?page=${page}&limit=${limit}`}
            className="inline-block px-3 py-2 border border-gray-200 rounded no-underline text-gray-800 hover:bg-gray-100"
          >
            {page}
          </Link>
        )
      ))}

      {currentPage < totalPages && (
        <Link
          href={`/collection/${collectionName}?page=${currentPage + 1}&limit=${limit}`}
          className="inline-block px-3 py-2 border border-gray-200 rounded no-underline text-gray-800 hover:bg-gray-100"
        >
          次へ &raquo;
        </Link>
      )}
    </div>
  );
}
