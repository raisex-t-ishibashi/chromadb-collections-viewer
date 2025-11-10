// viewer/components/Navigation.js
import Link from 'next/link';

export default function Navigation({ links }) {
  return (
    <nav>
      {links.map((link, index) => (
        <Link key={index} href={link.href}>
          {link.text}
        </Link>
      ))}
    </nav>
  );
}
