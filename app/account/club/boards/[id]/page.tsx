'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { FormEvent, useEffect, useMemo, useState } from 'react'
import { supabase } from '../../../../lib/supabase'

type Board = { id: string; club_id: string; name: string; description: string | null; status: string; club: { id: string; name: string } | null }
type Player = { id: string; full_name: string; nationality: string | null; position: string | null; photo_url: string | null }
type BoardPlayer = { id: string; player_id: string; stage: string; priority: string; notes: string | null; target_date: string | null; player: Player | null }

const stages = ['shortlist','watching','evaluating','contact','negotiating','signed','passed']

export default function ClubRecruitmentBoardPage() {
  const params = useParams()
  const boardId = params.id as string
  const [board, setBoard] = useState<Board | null>(null)
  const [rows, setRows] = useState<BoardPlayer[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState('')
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true); setError('')
    const { data: boardData, error: boardError } = await supabase
      .from('club_recruitment_boards')
      .select('id,club_id,name,description,status,club:clubs(id,name)')
      .eq('id', boardId)
      .single()
    if (boardError || !boardData) { setError('Recruitment board not found or you do not have access.'); setLoading(false); return }
    const normalizedBoard = { ...boardData, club: Array.isArray(boardData.club) ? boardData.club[0] ?? null : boardData.club ?? null }\n    setBoard(normalizedBoard as Board)

    const { data: rowData, error: rowError } = await supabase
      .from('club_recruitment_board_players')
      .select('id,player_id,stage,priority,notes,target_date,player:players(id,full_name,nationality,position,photo_url)')
      .eq('board_id', boardId)
      .order('created_at', { ascending: false })
    if (rowError) setError(rowError.message)
    setRows((rowData ?? []).map((row: any) => ({ ...row, player: Array.isArray(row.player) ? row.player[0] ?? null : row.player ?? null })) as BoardPlayer[])
    setLoading(false)
  }

  useEffect(() => { void load() }, [boardId])

  const existing = useMemo(() => new Set(rows.map(row => row.player_id)), [rows])
  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return []
    return players.filter(player =>
      player.full_name.toLowerCase().includes(q) ||
      (player.nationality ?? '').toLowerCase().includes(q) ||
      (player.position ?? '').toLowerCase().includes(q)
    ).filter(player => !existing.has(player.id)).slice(0, 8)
  }, [players, search, existing])

  const searchPlayers = async (value: string) => {
    setSearch(value)
    const q = value.trim()
    if (!q) { setPlayers([]); return }
    const { data } = await supabase.from('players').select('id,full_name,nationality,position,photo_url').ilike('full_name', '%' + q + '%').order('full_name').limit(12)
    setPlayers((data ?? []) as Player[])
  }

  const addPlayer = async (player: Player) => {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) return
    const { error: addError } = await supabase.from('club_recruitment_board_players').insert({
      board_id: boardId, player_id: player.id, added_by: user.user.id,
    })
    if (addError) setError(addError.message)
    else { setSearch(''); setPlayers([]); await load() }
  }

  const updateRow = async (id: string, patch: Record<string, string | null>) => {
    setSavingId(id); setError('')
    const { error: updateError } = await supabase.from('club_recruitment_board_players').update(patch).eq('id', id)
    if (updateError) setError(updateError.message)
    else setRows(current => current.map(row => row.id === id ? { ...row, ...patch } : row))
    setSavingId('')
  }

  const removeRow = async (id: string) => {
    setSavingId(id)
    const { error: deleteError } = await supabase.from('club_recruitment_board_players').delete().eq('id', id)
    if (deleteError) setError(deleteError.message)
    else setRows(current => current.filter(row => row.id !== id))
    setSavingId('')
  }

  if (loading) return <main className="account-page"><div className="account-card">Loading recruitment board…</div></main>
  if (!board) return <main className="account-page"><div className="account-card"><div className="account-message account-error">{error}</div><Link href="/account/club" className="outline">Back to club workspace</Link></div></main>

  return (
    <main className="account-page">
      <section className="account-card club-board-page">
        <div className="account-card-top">
          <div>
            <div className="eyebrow">PRIVATE RECRUITMENT BOARD · {board.club?.name ?? 'CLUB'}</div>
            <h1>{board.name}</h1>
            <p>{board.description || 'Private candidate board.'}</p>
          </div>
          <Link href="/account/club" className="outline">← Club workspace</Link>
        </div>

        {error && <div className="account-message account-error">{error}</div>}

        <div className="club-add-player">
          <div className="settings-section-heading"><span>ADD CANDIDATE</span><h2>Find a WFM player</h2></div>
          <input value={search} onChange={e => void searchPlayers(e.target.value)} placeholder="Search player name…" />
          {searchResults.length > 0 && <div className="club-search-results">{searchResults.map(player => (
            <button key={player.id} type="button" onClick={() => void addPlayer(player)}>
              <strong>{player.full_name}</strong><span>{[player.position, player.nationality].filter(Boolean).join(' · ')}</span>
            </button>
          ))}</div>}
        </div>

        <div className="club-board-table">
          <div className="club-board-table-head"><span>PLAYER</span><span>STAGE</span><span>PRIORITY</span><span>TARGET</span><span>NOTES</span><span></span></div>
          {rows.length ? rows.map(row => (
            <div className="club-board-row" key={row.id}>
              <div className="club-player-cell">
                {row.player?.photo_url ? <img src={row.player.photo_url} alt="" /> : <div className="club-player-placeholder" />}
                <div><Link href={'/players/' + row.player_id}>{row.player?.full_name ?? 'Player'}</Link><small>{[row.player?.position, row.player?.nationality].filter(Boolean).join(' · ')}</small></div>
              </div>
              <select value={row.stage} disabled={savingId === row.id} onChange={e => void updateRow(row.id, { stage: e.target.value })}>{stages.map(stage => <option key={stage} value={stage}>{stage.replace('_',' ')}</option>)}</select>
              <select value={row.priority} disabled={savingId === row.id} onChange={e => void updateRow(row.id, { priority: e.target.value })}><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option></select>
              <input type="date" value={row.target_date ?? ''} onChange={e => void updateRow(row.id, { target_date: e.target.value || null })} />
              <textarea value={row.notes ?? ''} onChange={e => setRows(current => current.map(item => item.id === row.id ? { ...item, notes: e.target.value } : item))} onBlur={e => void updateRow(row.id, { notes: e.target.value || null })} placeholder="Private club notes…" rows={2} />
              <button type="button" className="club-remove-button" onClick={() => void removeRow(row.id)}>Remove</button>
            </div>
          )) : <div className="club-board-empty">No players on this board yet. Search above to add candidates.</div>}
        </div>
      </section>
    </main>
  )
}
