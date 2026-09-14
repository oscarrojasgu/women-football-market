```tsx
"use client";

import Link from "next/link";

export default function Header() {
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link href="/" className="brand">
          Women’s Football Market
        </Link>

        <nav className="main-nav">
          <Link href="/">Home</Link>
          <Link href="/players">Players</Link>
          <Link href="/clubs">Clubs</Link>
          <Link href="/contracts">Contracts</Link>
          <Link href="/transfers">Transfers</Link>
          <Link href="/market">Market</Link>
        </nav>
      </div>
    </header>
  );
}
```
