import Link from 'next/link'

export default function Header() {
  return (
    <nav>
      <Link href="/" className="logo">
        WFM<span>•</span>
      </Link>

      <div className="navlinks">
        <Link href="/players">Players</Link>
        <Link href="/contracts">Contracts</Link>
        <Link href="/transfers">Transfers</Link>
        <Link href="/salaries">Salaries</Link>
        <Link href="/clubs">Clubs</Link>
      </div>

      <button className="login">Sign in</button>
    </nav>
  )
}
