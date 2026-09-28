'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

type Club = { id: string; name: string; country: string | null }
type Membership = { club_id: string; role: string; status: string; club: Club | null }
type Board = { id: string; club_id: string; name: string; description: string | null; status: string; updated_at: string; player_count: number }

export default function ClubWorkspacePage() {
  const [loading, setLoading] = useState(true)
  const [membership, setMembership] = useState<Membership | null>(null)
  const [boards, setBoards] = useState<Board[]>([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [creating, setCreating] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) { setError('Please sign in to use the club workspace.'); setLoading(false); return }

    const { data: membershipRows } = await supabase
      .from('club_account_members')
      .select('club_id,role,status,club:clubs(id,name,country)')
      .eq('user_id', user.user.id)
      .eq('status', 'active')
      .limit(1)

    const rawMember = (membershipRows ?? [])[0] ?? null\n    const member = rawMember ? { ...rawMember, club: Array.isArray(rawMember.club) ? rawMember.club[0] ?? null : rawMember.club ?? null } as Membership : null
    setMembership(member)
    if (!member) { setLoading(false); return }

    const { data: boardRows, error: boardError } = await supabase
      .from('club_recruitment_boards')
      .select('id,club_id,name,description,status,updated_at')
      .eq('club_id', member.club_id)
      .order('updated_at', { ascending: false })

    if (boardError) { setError(boardError.message); setLoading(false); return }

    const ids = (boardRows ?? []).map(row => row.id)
    let counts: Record<string, number> = {}
    if (ids.length) {
      const { data: playerRows } = await supabase.from('club_recruitment_board_players').select('board_id').in('board_id', ids)
      counts = (playerRows ?? []).reduce<Record<string, number>>((acc, row) => {
        acc[row.board_id] = (acc[row.board_id] ?? 0) + 1
        return acc
      }, {})
    }
    setBoards((boardRows ?? []).map(row => ({ ...row, player_count: counts[row.id] ?? 0 })) as Board[])
    setLoading(false)
  }

  useEffect(() => { void load() }, [])

  const createBoard = async (event: FormEvent) => {
    event.preventDefault()
    if (!membership) return
    const boardName = name.trim()
    if (!boardName) { setError('Board name is required.'); return }
    setCreating(true); setError(''); setMessage('')
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) { setError('Your session has expired.'); setCreating(false); return }
    const { error: createError } = await supabase.from('club_recruitment_boards').insert({
      club_id: membership.club_id,
      created_by: user.user.id,
      name: boardName,
      description: description.trim() || null,
    })
    if (createError) setError(createError.message)
    else { setName(''); setDescription(''); setMessage('Recruitment board created.'); await load() }
    setCreating(false)
  }

  if (loading) return <main className="account-page"><div className="account-card">Loading club workspace…</div></main>

  if (!membership) {
    return (
      <main className="account-page">
        <section className="account-card">
          <div className="eyebrow">CLUB WORKSPACE</div>
          <h1>No club access yet</h1>
          <p className="account-muted">Your WFM account is ready, but it is not connected to a club workspace.</p>
          <Link href="/account/settings" className="settings-primary inline-button">Request club access →</Link>
        </section>
      </main>
    )
  }

  return (
    <main className="account-page">
      <section className="account-card club-workspace-card">
        <div className="account-card-top">
          <div>
            <div className="eyebrow">CLUB WORKSPACE · {membership.role.toUpperCase()}</div>
            <h1>{membership.club?.name ?? 'Club'}</h1>
            <p>Private recruitment workspace for {membership.club?.country ?? 'your club'}. Board data is visible only to active members of this club.</p>
          </div>
          <Link href="/account/settings" className="outline">Account settings</Link>
        </div>

        {error && <div className="account-message account-error">{error}</div>}
        {message && <div className="account-message account-success">{message}</div>}

        <div className="club-workspace-grid">
          <section className="settings-section">
            <div className="settings-section-heading"><span>RECRUITMENT</span><h2>New board</h2></div>
            <form onSubmit={createBoard}>
              <label>Board name<input value={name} onChange={e => setName(e.target.value)} placeholder="Summer 2027 recruitment" maxLength={100} /></label>
              <label>Description<textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Purpose, position group or recruitment window." rows={5} maxLength={500} /></label>
              <button type="submit" className="settings-primary" disabled={creating}>{creating ? 'Creating…' : 'Create recruitment board'}</button>
            </form>
          </section>

          <section className="settings-section">
            <div className="settings-section-heading"><span>WORKSPACE</span><h2>Boards</h2></div>
            {boards.length ? <div className="club-board-list">{boards.map(board => (
              <Link key={board.id} href={'/account/club/boards/' + board.id} className="club-board-card">
                <div><strong>{board.name}</strong><small>{board.description || 'No description'}</small></div>
                <span>{board.player_count} players →</span>
              </Link>
            ))}</div> : <p className="account-muted">No recruitment boards yet. Create the first one.</p>}
          </section>
        </div>

        <div className="club-workspace-note">
          <strong>Connected WFM data</strong>
          <span>Use the public player profiles, scouting discovery and comparison tools to research candidates, then place players into a private club recruitment board.</span>
          <Link href="/scouting">Open global scouting →</Link>
        </div>
      </section>
    </main>
  )
}
