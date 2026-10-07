"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { useWfmT } from '../../lib/use-wfm-t'

type Plan={id:string;code:string;name:string;description:string|null;monthly_price_usd:number|null;annual_price_usd:number|null;active:boolean;features:Record<string,boolean>};
type Entitlement={id:string;user_id:string|null;club_id:string|null;plan_code:string;status:string;starts_at:string;ends_at:string|null;source:string;external_reference:string|null};

export default function CommercialAdminPage(){
 const t=useWfmT()
 const [authorized,setAuthorized]=useState(false);const [loading,setLoading]=useState(true);const [plans,setPlans]=useState<Plan[]>([]);const [entitlements,setEntitlements]=useState<Entitlement[]>([]);
 const [email,setEmail]=useState("");const [plan,setPlan]=useState("club");const [clubId,setClubId]=useState("");const [userId,setUserId]=useState("");const [busy,setBusy]=useState(false);const [message,setMessage]=useState("");const [error,setError]=useState("");
 const load=async()=>{const {data:u}=await supabase.auth.getUser();if(!u.user){setLoading(false);return}const {data:a}=await supabase.from("wfm_admins").select("user_id").eq("user_id",u.user.id).maybeSingle();setAuthorized(!!a);if(!a){setLoading(false);return}
 const [{data:p},{data:e}]=await Promise.all([supabase.from("wfm_access_plans").select("*").order("created_at"),supabase.from("wfm_account_entitlements").select("*").order("created_at",{ascending:false})]);setPlans((p??[]) as Plan[]);setEntitlements((e??[]) as Entitlement[]);setLoading(false)};
 useEffect(()=>{void load()},[]);
 const grant=async(ev:FormEvent)=>{ev.preventDefault();setBusy(true);setError("");setMessage("");if(!userId&&!clubId){setError("Enter a user ID or club ID.");setBusy(false);return}
 const {error:e}=await supabase.from("wfm_account_entitlements").insert({user_id:userId||null,club_id:clubId||null,plan_code:plan,source:"admin"});if(e)setError(e.message);else{setUserId("");setClubId("");setMessage("Entitlement assigned.");await load()}setBusy(false)};
 const toggle=async(p:Plan)=>{const {error:e}=await supabase.from("wfm_access_plans").update({active:!p.active,updated_at:new Date().toISOString()}).eq("id",p.id);if(e)setError(e.message);else await load()};
 if(loading)return <main className="account-page"><div className="account-card">{t("Loading commercial dashboard…")}</div></main>;
 if(!authorized)return <main className="account-page"><div className="account-card"><div className="eyebrow">{t("ADMIN")}</div><h1>{t("Access restricted")}</h1><p className="account-muted">{t("This workspace is limited to WFM administrators.")}</p></div></main>;
 return <main className="account-page"><section className="account-card"><div className="account-card-top"><div><div className="eyebrow">{t("WFM ADMIN · COMMERCIAL")}</div><h1>{t("Commercial dashboard")}</h1><p>{t("Manage access plans and manually provision commercial entitlements. Billing-provider integration can be connected later without changing this access model.")}</p></div><Link href="/admin/club-access" className="outline">{t("Club access")}</Link></div>
 {error&&<div className="account-message account-error">{error}</div>}{message&&<div className="account-message account-success">{message}</div>}
 <div className="club-workspace-grid"><section className="settings-section"><div className="settings-section-heading"><span>{t("PLANS")}</span><h2>{t("Access catalog")}</h2></div>{plans.map(p=><div key={p.id} className="account-membership-row"><div><strong>{p.name}</strong><small>{p.code} · {p.description||t("No description")}</small></div><button type="button" className="outline" onClick={()=>void toggle(p)}>{p.active?t("Active"):t("Inactive")}</button></div>)}</section>
 <section className="settings-section"><div className="settings-section-heading"><span>{t("PROVISION")}</span><h2>{t("Assign entitlement")}</h2></div><form onSubmit={grant}><label>{t("Plan")}<select value={plan} onChange={e=>setPlan(e.target.value)}>{plans.filter(p=>p.active).map(p=><option key={p.code} value={p.code}>{p.name}</option>)}</select></label><label>{t("User ID")}<input value={userId} onChange={e=>setUserId(e.target.value)} placeholder={t("Optional auth user UUID")} /></label><label>{t("Club ID")}<input value={clubId} onChange={e=>setClubId(e.target.value)} placeholder={t("Optional club UUID")} /></label><button className="settings-primary" disabled={busy} type="submit">{busy?t("Saving…"):t("Assign entitlement")}</button></form><p className="account-muted">{t("Only WFM admins can create or change entitlements. Keep payment processing outside this page until a billing provider is connected.")}</p></section></div>
 <section className="settings-section" style={{marginTop:24}}><div className="settings-section-heading"><span>{t("ENTITLEMENTS")}</span><h2>{entitlements.length} {t("records")}</h2></div>{entitlements.length?entitlements.map(e=><div key={e.id} className="account-membership-row"><div><strong>{e.plan_code}</strong><small>{e.club_id?t("Club:")+" "+e.club_id:t("User:")+" "+e.user_id} · {e.status}</small></div><span className="account-status-pill">{e.source}</span></div>):<p className="account-muted">{t("No commercial entitlements have been assigned.")}</p>}</section>
 </section></main>
}
