// viewer/components/CollapsibleDetails.js
export default function CollapsibleDetails({
  summary,
  children,
  defaultOpen = false,
  className = ''
}) {
  return (
    <details open={defaultOpen}>
      <summary>{summary}</summary>
      <pre className={className}>{children}</pre>
    </details>
  );
}
