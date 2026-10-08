'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useWfmT } from '../lib/use-wfm-t'

type Plan = { code:string; name:string; description:string|null; monthly_price_usd:number|null; annual_price_usd:number|null; active:boolean; features:Record<string,boolean> }
const featureLabels: Record<string,string> = { public_profiles:'Public profiles', public_search:'Public search', scouting_discovery:'Scouting discovery', saved_reports:'Saved reports', club_workspace:'Club workspace', data_exports:'Data exports', licensed_data:'Licensed data' }

export default function PricingPage() {
  const t = useWfmT()
  const [plans,setPlans] = useState<Plan[]>([])
  useEffect(()=>{ void supabase.from('wfm_access_plans').select('code,name,description,monthly_price_usd,annual_price_usd,active,features').eq('active',true).order('created_at').then(({data})=>setPlans((data||[]) as Plan[])) },[])
  const order = ['free','professional','club','data_license']
  const sorted = [...plans].sort((a,b)=>order.indexOf(a.code)-order.indexOf(b.code))
  const bestFor: Record<string,string> = { free:'Public research, player discovery and database browsing.', professional:'Independent scouts, analysts and recruitment professionals.', club:'Clubs and recruitment departments needing a private workspace.', data_license:'Organizations needing licensed exports, commercial use or data feeds.' }
  return <main className="account-page"><section className="account-card">
    <div className="account-card-top"><div><div className="eyebrow">WFM</div><h1>{t('Pricing')}</h1><p>{t('Choose the WFM access level that fits your workflow.')}</p></div><Link href="/contact" className="outline">{t('Contact WFM')}</Link></div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))',gap:14}}>
      {sorted.map(plan=><article key={plan.code} style={{border:'1px solid #ddd',borderRadius:16,padding:20,display:'flex',flexDirection:'column',gap:12}}>
        <div><div className="eyebrow">{t(plan.code==='data_license'?'Commercial data licensing':plan.code==='club'?'Private club workspace':plan.code==='professional'?'Professional scouting workspace':'Public research access')}</div><h2>{t(plan.name)}</h2><p className="account-muted">{t(bestFor[plan.code])}</p></div>
        <div><strong style={{fontSize:30}}>{plan.monthly_price_usd==null?'Custom':plan.monthly_price_usd===0?'$0':'$'+plan.monthly_price_usd.toLocaleString()}</strong>{plan.monthly_price_usd!=null&&<span className="account-muted"> {t('per month')}</span>}{plan.annual_price_usd!=null&&plan.annual_price_usd>0&&<small style={{display:'block'}}>{'$'+plan.annual_price_usd.toLocaleString()} {t('per year')}</small>}</div>
        <div>{Object.entries(plan.features).filter(([,v])=>v).map(([key])=><div key={key} style={{padding:'5px 0'}}>✓ {t(featureLabels[key]||key)}</div>)}</div>
        <div style={{marginTop:'auto'}}><Link href={plan.code==='free'?'/login?mode=signup':plan.code==='data_license'?'/contact':'/account/licensing'} className="settings-primary" style={{display:'inline-block',textDecoration:'none'}}>{t(plan.code==='data_license'?'Contact WFM':'Get started')}</Link></div>
      </article>)}
    </div>
    <p className="account-muted" style={{marginTop:18}}>{t('Annual billing saves two months.')}</p>
    <p className="account-muted">{t('Commercial data and API pricing is scoped to the permitted use, volume, territory and agreement term.')}</p>
    <p className="account-muted">{t('Pricing is an initial WFM launch schedule and may change as products and commercial terms mature.')}</p>
  </section></main>
}
