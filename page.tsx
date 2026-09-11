'use client'

import { useMemo, useState } from 'react'

const players = [
  {name:'Sophia Wilson', club:'Kansas City Current', league:'NWSL', position:'Forward', age:25, contract:'2026-12-31', salary:'$842,400', status:'Verified'},
  {name:'Temwa Chawinga', club:'Kansas City Current', league:'NWSL', position:'Forward', age:27, contract:'2027-12-31', salary:'Unknown', status:'Reported'},
  {name:'Barbra Banda', club:'Orlando Pride', league:'NWSL', position:'Forward', age:26, contract:'2027-12-31', salary:'Unknown', status:'Reported'},
  {name:'Trinity Rodman', club:'Washington Spirit', league:'NWSL', position:'Forward', age:24, contract:'2026-12-31', salary:'Unknown', status:'Reported'},
  {name:'Lucy Bronze', club:'Chelsea FC Women', league:'WSL', position:'Defender', age:34, contract:'2027-06-30', salary:'Unknown', status:'Estimated'},
  {name:'Aitana Bonmatí', club:'FC Barcelona Femení', league:'Liga F', position:'Midfielder', age:28, contract:'2028-06-30', salary:'Unknown', status:'Reported'}
]

export default function Home(){
  const [q,setQ]=useState('')
  const filtered=useMemo(()=>players.filter(p=>[p.name,p.club,p.league,p.position].join(' ').toLowerCase().includes(q.toLowerCase())),[q])
  return <main>
    <nav><div className="logo">WFM<span>•</span></div><div className="navlinks"><a>Players</a><a>Contracts</a><a>Transfers</a><a>Salaries</a><a>Clubs</a></div><button className="login">Sign in</button></nav>
    <section className="hero"><div className="eyebrow">THE WOMEN’S FOOTBALL DATABASE</div><h1>Know the market.<br/><em>Know the player.</em></h1><p>Track women’s football salaries, contracts, transfers and player movement — in one place.</p><div className="search"><span>⌕</span><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search player, club or league…"/></div></section>
    <section className="stats"><div><b>Players</b><strong>8,700+</strong></div><div><b>Leagues</b><strong>23</strong></div><div><b>Clubs</b><strong>1,900+</strong></div><div><b>Contract data</b><strong>Growing daily</strong></div></section>
    <section className="content"><div className="sectionhead"><div><span className="eyebrow">PLAYER DATABASE</span><h2>Market leaders</h2></div><button className="outline">View all players →</button></div>
      <div className="table"><div className="thead"><span>PLAYER</span><span>CLUB</span><span>LEAGUE</span><span>CONTRACT</span><span>SALARY</span><span>CONFIDENCE</span></div>
      {filtered.map(p=><div className="row" key={p.name}><span><b>{p.name}</b><small>{p.position} · {p.age}</small></span><span>{p.club}</span><span>{p.league}</span><span>{p.contract}</span><span>{p.salary}</span><span><i className={'badge '+p.status.toLowerCase()}>{p.status}</i></span></div>)}
      {filtered.length===0&&<div className="empty">No players found. Try another search.</div>}</div>
    </section>
    <section className="cards"><article><span>01</span><h3>Contracts</h3><p>Expiration dates, options, extensions and free-agent status.</p></article><article><span>02</span><h3>Transfers</h3><p>Permanent moves, loans, trades, releases and fees.</p></article><article><span>03</span><h3>Salaries</h3><p>Reported and estimated compensation with source confidence.</p></article><article><span>04</span><h3>Scouting</h3><p>Find players by position, age, league and contract status.</p></article></section>
    <footer><div className="logo">WFM<span>•</span></div><p>Built for women’s football.</p><small>Data confidence is shown on every record. Estimates are never presented as confirmed facts.</small></footer>
  </main>
}
