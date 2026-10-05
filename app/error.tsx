'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { getLocaleFromPathname, localizedPath } from './lib/i18n'

const ERROR_TEXT = {
  en:{title:"We couldn’t load this page",body:"An unexpected error occurred while loading this WFM page. Try again or return to the home page.",retry:"Try again",home:"Go home"},
  es:{title:"No pudimos cargar esta página",body:"Ocurrió un error inesperado al cargar esta página de WFM. Inténtalo de nuevo o vuelve al inicio.",retry:"Intentar de nuevo",home:"Ir al inicio"},
  pt:{title:"Não foi possível carregar esta página",body:"Ocorreu um erro inesperado ao carregar esta página do WFM. Tente novamente ou volte ao início.",retry:"Tentar novamente",home:"Ir para o início"},
  fr:{title:"Nous n’avons pas pu charger cette page",body:"Une erreur inattendue s’est produite lors du chargement de cette page WFM. Réessayez ou retournez à l’accueil.",retry:"Réessayer",home:"Accueil"},
  de:{title:"Diese Seite konnte nicht geladen werden",body:"Beim Laden dieser WFM-Seite ist ein unerwarteter Fehler aufgetreten. Versuchen Sie es erneut oder kehren Sie zur Startseite zurück.",retry:"Erneut versuchen",home:"Startseite"}
} as const

export default function Error({error,reset}:{error:Error & {digest?:string};reset:()=>void}) {
  const pathname=usePathname()
  const locale=getLocaleFromPathname(pathname)
  const text=ERROR_TEXT[locale]
  useEffect(()=>{console.error('WFM route error:',error)},[error])
  return (
    <main style={{minHeight:'calc(100vh - 76px)',display:'grid',placeItems:'center',padding:'40px 20px',background:'#f5f4ef'}}>
      <section style={{width:'100%',maxWidth:620,background:'#fff',border:'1px solid #dedcd5',borderRadius:16,padding:32}}>
        <div style={{fontSize:11,fontWeight:800,letterSpacing:2,color:'#777',textTransform:'uppercase'}}>Women’s Football Market</div>
        <h1 style={{margin:'14px 0 10px',fontSize:34,lineHeight:1.05}}>{text.title}</h1>
        <p style={{margin:0,color:'#666',lineHeight:1.55}}>{text.body}</p>
        <div style={{display:'flex',gap:10,flexWrap:'wrap',marginTop:24}}>
          <button onClick={()=>reset()} style={{border:'1px solid #111',background:'#111',color:'#fff',borderRadius:8,padding:'10px 16px',cursor:'pointer'}}>{text.retry}</button>
          <a href={localizedPath(locale,'/')} style={{border:'1px solid #aaa',color:'#111',textDecoration:'none',borderRadius:8,padding:'10px 16px'}}>{text.home}</a>
        </div>
      </section>
    </main>
  )
}
