export default function CollapsibleDetails({
  summary,
  children,
  defaultOpen = false,
  className = ''
}) {
  // クラス名に応じてTailwindクラスを追加
  const getPreClasses = () => {
    const base = 'whitespace-pre-wrap break-words text-sm bg-gray-50 p-2 rounded border border-gray-200 max-h-[300px] overflow-auto';
    if (className === 'metadatas') return `${base} font-mono text-xs`;
    if (className === 'vector') return `${base} font-mono text-xs`;
    if (className === 'documents') return base;
    return base;
  };

  return (
    <details open={defaultOpen} className="my-2 cursor-pointer">
      <summary className="cursor-pointer text-blue-500 list-none select-none">
        {summary}
      </summary>
      <pre className={getPreClasses()}>{children}</pre>
    </details>
  );
}
