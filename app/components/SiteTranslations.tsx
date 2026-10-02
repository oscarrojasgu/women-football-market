'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { getLocaleFromPathname, translate } from '../lib/i18n'
const originals=new WeakMap<Text,string>()
const attrs=['placeholder','aria-label','title'] as const
export default function SiteTranslations(){
 const pathname=usePathname(),locale=getLocaleFromPathname(pathname)
 useEffect(()=>{const root=document.body;const apply=()=>{const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node:Node|null;while((node=walker.nextNode())){const t=node as Text;if(!t.parentElement||['SCRIPT','STYLE','NOSCRIPT'].includes(t.parentElement.tagName))continue;const original=originals.get(t)??t.nodeValue??'';originals.set(t,original);const key=original.trim();if(key===original)t.nodeValue=translate(locale,key)}root.querySelectorAll<HTMLElement>('[placeholder],[aria-label],[title]').forEach(el=>attrs.forEach(a=>{const value=el.getAttribute(a);if(!value)return;const key='__wfm_'+a;const original=el.dataset[key]??value;el.dataset[key]=original;el.setAttribute(a,translate(locale,original))}))};apply();const observer=new MutationObserver(apply);observer.observe(root,{childList:true,subtree:true});return()=>observer.disconnect()},[locale]);return null}
