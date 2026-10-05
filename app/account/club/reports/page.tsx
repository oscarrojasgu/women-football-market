'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useWfmT } from '../../../lib/use-wfm-t'
import { supabase } from '../../../lib/supabase'

type Report={id:string;club_id:string;created_by:string;name:string;description:string|null;player_ids:string[];report_type:string;created_at:string;updated_at:string}

export default function ClubReportsPage(){
  const t=useWfmT()
  const [reports,setReports]=useState<Report[]>([]); const [loading,setLoading]=useState(true); const [error,setError]=useState('')
  const load=async()=>{setLoading(true);setError('');const {data:user}=await supabase.auth.getUser();if(!user.user){setError(t('Please sign in to view club reports.'));setLoading(false);return}const {data,error:e}=await supabase.from('club_saved_reports').select('*').order('updated_at',{ascending:false});if(e)setError(e.message);setReports((data??[]) as Report[]);setLoading(false)}
  useEffect(()=>{void load()},[])
  if(loading)return <main className="account-page"><div className="account-card">{t('Loading saved reports…')}</div></main>
  return <main className="account-page"><section className="account-card">
    <div className="account-card-top"><div><div className="eyebrow">{t('CLUB WORKSPACE · INTELLIGENCE')}</div><h1>{t('Saved scouting reports')}</h1><p>{t('Private comparison reports shared across active members of your club.')}</p></div><Link href="/account/club" className="outline">{t('← Club workspace')}</Link></div>
    {error&&<div className="account-message account-error">{error}</div>}
    {reports.length?<div className="club-board-list">{reports.map(r=><Link key={r.id} href={'/account/club/reports/'+r.id} className="club-board-card"><div><strong>{r.name}</strong><small>{r.description||t('Scouting comparison report')} · {r.player_ids?.length??0} {t('players')}</small></div><span>{t('Open →')}</span></Link>)}</div>:<div className="club-board-empty">{t('No saved reports yet. Compare candidates in scouting and save a report to build your club intelligence library.')}</div>}
    <div className="club-workspace-note" style={{marginTop:16}}><strong>{t('Internal sharing')}</strong><span>{t('Reports are not public. Active members of the same club workspace can access the library through database access controls.')}</span><Link href="/scouting">{t('Open global scouting →')}</Link></div>
  </section></main>
}
