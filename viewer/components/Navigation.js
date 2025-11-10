import Link from 'next/link';

export default function Navigation({ links }) {
  return (
    <nav className="flex gap-4">
      {links.map((link, index) => (
        <Link
          key={index}
          href={link.href}
          className="text-white no-underline hover:underline"
        >
          {link.text}
        </Link>
      ))}
    </nav>
  );
}
