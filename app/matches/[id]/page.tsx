'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { useWfmT } from '../../lib/use-wfm-t'

type Match = {
  id: string
  competition_name: string
  home_team_name: string
  away_team_name: string
  home_score: number | null
  away_score: number | null
  status: string
  kickoff_at: string | null
  venue_name: string | null
  confidence: string | null
  source_updated_at: string | null
}

const MATCH_TEXT = {
  en:{match:'match',live:'LIVE',halftime:'HALFTIME',finished:'FULL TIME',scheduled:'SCHEDULED',confidence:'Confidence',lastUpdate:'Last source update'},
  es:{match:'partido',live:'EN VIVO',halftime:'DESCANSO',finished:'FINALIZADO',scheduled:'PROGRAMADO',confidence:'Confianza',lastUpdate:'Última actualización de la fuente'},
  pt:{match:'partida',live:'AO VIVO',halftime:'INTERVALO',finished:'FINALIZADO',scheduled:'AGENDADO',confidence:'Confiança',lastUpdate:'Última atualização da fonte'},
  fr:{match:'match',live:'EN DIRECT',halftime:'MI-TEMPS',finished:'TERMINÉ',scheduled:'PROGRAMMÉ',confidence:'Confiance',lastUpdate:'Dernière mise à jour de la source'},
  de:{match:'Spiel',live:'LIVE',halftime:'HALBZEIT',finished:'ENDSTAND',scheduled:'ANGESSETZT',confidence:'Vertrauen',lastUpdate:'Letzte Quellenaktualisierung'}
} as const

export default function MatchPage() {
  const t = useWfmT()
  const params = useParams<{ id: string }>()
  const [match, setMatch] = useState<Match | null>(null)
  const [loading, setLoading] = useState(true)
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/'
  const locale = (pathname.split('/')[1] as keyof typeof MATCH_TEXT) in MATCH_TEXT ? pathname.split('/')[1] as keyof typeof MATCH_TEXT : 'en'
  const mt = MATCH_TEXT[locale]

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('wfm_match_fixtures')
        .select('id,competition_name,home_team_name,away_team_name,home_score,away_score,status,kickoff_at,venue_name,confidence,source_updated_at')
        .eq('id', params.id)
        .maybeSingle()
      if (!error) setMatch(data)
      setLoading(false)
    }
    if (params.id) load()
  }, [params.id])

  const status = match?.status === 'live' ? mt.live : match?.status === 'halftime' ? mt.halftime : match?.status === 'finished' ? mt.finished : match?.status?.toUpperCase() || mt.scheduled

  return (
    <main style={{ minHeight:'100vh', background:'#f5f4ef', color:'#111' }}>
      <section style={{ background:'#111', color:'#fff', padding:'52px 20px 46px' }}>
        <div style={{ maxWidth:1000, margin:'0 auto' }}>
          <Link href="/" style={{ color:'#aaa', textDecoration:'none', fontSize:12 }}>← {t('Home').toUpperCase()}</Link>
          <div style={{ marginTop:28, color:'#aaa', fontSize:11, fontWeight:800, letterSpacing:1, textTransform:'uppercase' }}>{match?.competition_name || t('MATCH CENTER')}</div>
          {loading ? (
            <h1 style={{ margin:'14px 0 0', fontSize:'clamp(36px,7vw,64px)' }}>{t('Loading')} {mt.match}…</h1>
          ) : !match ? (
            <h1 style={{ margin:'14px 0 0', fontSize:'clamp(36px,7vw,64px)' }}>{t('Unknown')} {mt.match}</h1>
          ) : (
            <>
              <div style={{ marginTop:18, display:'grid', gridTemplateColumns:'1fr auto 1fr', gap:20, alignItems:'center' }}>
                <strong style={{ fontSize:'clamp(20px,4vw,34px)', textAlign:'right' }}>{match.home_team_name}</strong>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:'clamp(34px,7vw,58px)', fontWeight:900, letterSpacing:-2 }}>{match.home_score ?? '—'} : {match.away_score ?? '—'}</div>
                  <div style={{ color:'#c9ff3d', fontSize:11, fontWeight:900, letterSpacing:1 }}>{status}</div>
                </div>
                <strong style={{ fontSize:'clamp(20px,4vw,34px)' }}>{match.away_team_name}</strong>
              </div>
              <div style={{ marginTop:24, color:'#aaa', fontSize:13 }}>
                {match.kickoff_at ? new Date(match.kickoff_at).toLocaleString() : t('Unknown')}
                {match.venue_name ? ' · ' + match.venue_name : ''}
              </div>
            </>
          )}
        </div>
      </section>
      {match && (
        <section style={{ maxWidth:1000, margin:'0 auto', padding:'30px 20px 60px' }}>
          <div style={{ background:'#fff', border:'1px solid #e3e3e3', borderRadius:14, padding:22 }}>
            <div style={{ fontSize:11, color:'#777', fontWeight:800, letterSpacing:.8, textTransform:'uppercase' }}>{t('Sources')}</div>
            <p style={{ margin:'10px 0 0', color:'#555', lineHeight:1.5 }}>
              {t('Sources')}: {t('Performance')}. {mt.confidence}: {match.confidence || t('Unknown')}.
              {match.source_updated_at ? ' ' + mt.lastUpdate + ': ' + new Date(match.source_updated_at).toLocaleString() + '.' : ''}
            </p>
          </div>
        </section>
      )}
    </main>
  )
}
