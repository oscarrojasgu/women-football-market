"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Player = { id: string; full_name: string };
type Club = { id: string; name: string };
type Request = {
  id: string; player_id: string | null; club_id: string | null; agency_name: string | null;
  relationship_type: string; status: string; verification_method: string | null;
  evidence_url: string | null; notes: string | null; created_at: string;
};
type OfficialVerification = {
  id: string; player_id: string | null; club_id: string | null; agency_name: string | null;
  verification_type: string; status: string; verification_method: string | null;
  evidence_url: string | null; notes: string | null; created_at: string;
};

const fields = [
  ["full_name","Full name"],["nationality","Nationality"],["date_of_birth","Date of birth"],
  ["preferred_foot","Preferred foot"],["height_cm","Height (cm)"],["birthplace","Birthplace"],
  ["position","Primary position"],["secondary_position","Secondary position"],["agency","Agency"],
  ["current_club_since","Current club since"],["photo_url","Photo URL"],
];

export default function ContributorPortal() {
  const [user,setUser]=useState<any>(null), [loading,setLoading]=useState(true), [message,setMessage]=useState("");
  const [profileType,setProfileType]=useState("individual"), [name,setName]=useState(""), [org,setOrg]=useState("");
  const [requests,setRequests]=useState<Request[]>([]), [officialVerifications,setOfficialVerifications]=useState<OfficialVerification[]>([]), [query,setQuery]=useState(""), [clubQuery,setClubQuery]=useState(""), [clubs,setClubs]=useState<Club[]>([]), [clubId,setClubId]=useState(""), [players,setPlayers]=useState<Player[]>([]);
  const [playerId,setPlayerId]=useState(""), [field,setField]=useState("full_name"), [value,setValue]=useState("");
  const [evidence,setEvidence]=useState(""), [notes,setNotes]=useState(""), [busy,setBusy]=useState(false);

  useEffect(()=>{ load(); },[]);

  async function load(){
    const {data:{user}}=await supabase.auth.getUser(); setUser(user);
    if(user){
      const {data}=await supabase.from("representation_requests").select("*").order("created_at",{ascending:false});
      setRequests(data||[]);
      const {data:official}=await supabase.from("official_verifications").select("*").order("created_at",{ascending:false});
      setOfficialVerifications(official||[]);
      const {data:p}=await supabase.from("contributor_profiles").select("*").eq("user_id",user.id).maybeSingle();
      if(p){setName(p.display_name||"");setOrg(p.organization_name||"");setProfileType(p.contributor_type||"individual");}
    }
    setLoading(false);
  }

  async function saveProfile(){
    if(!user)return; setBusy(true); setMessage("");
    const {error}=await supabase.from("contributor_profiles").upsert({
      user_id:user.id,display_name:name||null,contributor_type:profileType,
      organization_name:org||null,updated_at:new Date().toISOString()
    });
    setBusy(false); setMessage(error?.message||"Contributor profile saved.");
  }

  async function searchPlayers(v:string){
    setQuery(v);
    if(v.trim().length<2){setPlayers([]);return;}
    const {data}=await supabase.from("players").select("id,full_name").ilike("full_name",`%${v.trim()}%`).order("full_name").limit(8);
    setPlayers(data||[]);
  }

  async function requestRepresentation(){
    if(!playerId){setMessage("Select a player first.");return;}
    setBusy(true);setMessage("");
    const {error}=await supabase.rpc("submit_representation_request",{
      p_player_id:playerId,p_relationship_type:profileType==="agent"?"agent":"player",
      p_verification_method:"contributor_portal",p_evidence_url:evidence||null,p_notes:notes||null
    });
    setBusy(false);
    setMessage(error?.message||"Representation request submitted for review.");
    if(!error){setEvidence("");setNotes("");await load();}
  }

  async function searchClubs(v:string){
    setClubQuery(v);
    if(v.trim().length<2){setClubs([]);return;}
    const {data}=await supabase.from("clubs").select("id,name").ilike("name",`%${v.trim()}%`).order("name").limit(8);
    setClubs(data||[]);
  }

  async function submitOfficialVerification(){
    const verificationType=profileType==="agent"?"agent":profileType==="agency"?"agency":profileType==="club"?"club":"player";
    if(verificationType==="player" || verificationType==="agent"){
      if(!playerId){setMessage("Select a player first.");return;}
    }
    if(verificationType==="club" && !clubId){setMessage("Select a club first.");return;}
    if(verificationType==="agency" && !org.trim()){setMessage("Enter the agency name first.");return;}
    setBusy(true);setMessage("");
    const {error}=await supabase.rpc("submit_official_verification_request",{
      p_player_id:(verificationType==="player" || verificationType==="agent")?playerId:null,
      p_club_id:verificationType==="club"?clubId:null,
      p_agency_name:verificationType==="agency"?org.trim():null,
      p_verification_type:verificationType,
      p_verification_method:"contributor_portal",
      p_evidence_url:evidence||null,
      p_notes:notes||null
    });
    setBusy(false);
    setMessage(error?.message||"Official verification request submitted for WFM review.");
    if(!error){setEvidence("");setNotes("");await load();}
  }

  async function submitUpdate(){
    if(!playerId||!value){setMessage("Select a player and enter the submitted value.");return;}
    setBusy(true);setMessage("");
    const {error}=await supabase.rpc("submit_verified_player_update",{
      p_player_id:playerId,p_field_name:field,p_new_value:value,
      p_evidence_url:evidence||null,p_notes:notes||null
    });
    setBusy(false);
    setMessage(error?.message||"Verified contributor update submitted for review.");
    if(!error){setValue("");setEvidence("");setNotes("");}
  }

  if(loading)return <main style={s.page}><p>Loading contributor portal...</p></main>;
  if(!user)return <main style={s.page}><div style={s.card}><h1 style={s.title}>Contributor Portal</h1><p style={s.muted}>Sign in to WFM first, then return here to manage your contributor identity.</p></div></main>;

  return <main style={s.page}>
    <div style={s.wrap}>
      <div style={s.eyebrow}>WOMEN’S FOOTBALL MARKET</div>
      <h1 style={s.title}>Contributor Portal</h1>
      <p style={s.muted}>Build your contributor identity, request representation, and submit sourced updates when your representation is approved.</p>
      {message&&<div style={s.message}>{message}</div>}

      <section style={s.card}>
        <h2 style={s.h2}>Contributor identity</h2>
        <div style={s.grid}>
          <label style={s.label}>Display name<input style={s.input} value={name} onChange={e=>setName(e.target.value)} /></label>
          <label style={s.label}>Contributor type<select style={s.input} value={profileType} onChange={e=>setProfileType(e.target.value)}><option value="individual">Individual</option><option value="player">Player</option><option value="agent">Agent</option><option value="club">Club</option><option value="agency">Agency</option><option value="journalist">Journalist</option><option value="scout">Scout</option></select></label>
        </div>
        <label style={s.label}>Organization<input style={s.input} value={org} onChange={e=>setOrg(e.target.value)} placeholder="Optional" /></label>
        <button style={s.button} disabled={busy} onClick={saveProfile}>Save contributor profile</button>
      </section>

      <section style={s.card}>
        <h2 style={s.h2}>Request representation</h2>
        <p style={s.muted}>An approved relationship is required before verified contributor updates can be submitted.</p>
        <label style={s.label}>Find player<input style={s.input} value={query} onChange={e=>searchPlayers(e.target.value)} placeholder="Search by player name" /></label>
        {players.length>0&&<div style={s.results}>{players.map(p=><button key={p.id} style={s.result} onClick={()=>{setPlayerId(p.id);setQuery(p.full_name);setPlayers([])}}>{p.full_name}</button>)}</div>}
        <label style={s.label}>Evidence URL<input style={s.input} value={evidence} onChange={e=>setEvidence(e.target.value)} placeholder="Official or supporting source" /></label>
        <label style={s.label}>Notes<textarea style={s.input as any} rows={3} value={notes} onChange={e=>setNotes(e.target.value)} /></label>
        <button style={s.button} disabled={busy||!playerId} onClick={requestRepresentation}>Request representation</button>
      </section>

      <section style={s.card}>
        <h2 style={s.h2}>Submit verified player update</h2>
        <label style={s.label}>Player<input style={s.input} value={query} onChange={e=>searchPlayers(e.target.value)} placeholder="Search by player name" /></label>
        {players.length>0&&<div style={s.results}>{players.map(p=><button key={p.id} style={s.result} onClick={()=>{setPlayerId(p.id);setQuery(p.full_name);setPlayers([])}}>{p.full_name}</button>)}</div>}
        <label style={s.label}>Field<select style={s.input} value={field} onChange={e=>setField(e.target.value)}>{fields.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>
        <label style={s.label}>Submitted value<input style={s.input} value={value} onChange={e=>setValue(e.target.value)} /></label>
        <button style={s.button} disabled={busy||!playerId||!value} onClick={submitUpdate}>Submit update for review</button>
      </section>

      <section style={s.card}>
        <h2 style={s.h2}>Request official verification</h2>
        <p style={s.muted}>Official verification is a separate status from approved representation. WFM reviews the evidence before publishing an official badge.</p>
        {(profileType==="player" || profileType==="agent" || profileType==="individual") && <>
          <label style={s.label}>Player<input style={s.input} value={query} onChange={e=>searchPlayers(e.target.value)} placeholder="Search by player name" /></label>
          {players.length>0&&<div style={s.results}>{players.map(p=><button key={p.id} style={s.result} onClick={()=>{setPlayerId(p.id);setQuery(p.full_name);setPlayers([])}}>{p.full_name}</button>)}</div>}
        </>}
        {profileType==="club" && <>
          <label style={s.label}>Club<input style={s.input} value={clubQuery} onChange={e=>searchClubs(e.target.value)} placeholder="Search by club name" /></label>
          {clubs.length>0&&<div style={s.results}>{clubs.map(p=><button key={p.id} style={s.result} onClick={()=>{setClubId(p.id);setClubQuery(p.name);setClubs([])}}>{p.name}</button>)}</div>}
        </>}
        {profileType==="agency" && <label style={s.label}>Agency name<input style={s.input} value={org} onChange={e=>setOrg(e.target.value)} /></label>}
        <button style={s.button} disabled={busy} onClick={submitOfficialVerification}>Request official verification</button>
      </section>

      <section style={s.card}>
        <h2 style={s.h2}>My representation requests</h2>
        {requests.length===0?<p style={s.muted}>No requests yet.</p>:requests.map(r=><div key={r.id} style={s.row}><strong>{r.player_id?"Player representation":r.agency_name?"Agency representation":"Club representation"}</strong><span style={s.badge}>{r.status.toUpperCase()}</span><small>{new Date(r.created_at).toLocaleDateString()}</small></div>)}
      </section>

      <section style={s.card}>
        <h2 style={s.h2}>My official verification status</h2>
        {officialVerifications.length===0?<p style={s.muted}>No official verification requests yet.</p>:officialVerifications.map(v=><div key={v.id} style={s.row}><strong>{v.verification_type.toUpperCase()}</strong><span style={s.badge}>{v.status.toUpperCase()}</span><small>{new Date(v.created_at).toLocaleDateString()}</small></div>)}
      </section>
    </div>
  </main>;
}

const s:any={
 page:{minHeight:"100vh",background:"#f5f5f2",padding:"40px 20px 80px",fontFamily:"Arial,Helvetica,sans-serif",color:"#111"},
 wrap:{maxWidth:900,margin:"0 auto"}, eyebrow:{fontSize:11,fontWeight:800,letterSpacing:".12em",color:"#777",marginBottom:8},
 title:{margin:0,fontSize:32},h2:{margin:"0 0 8px",fontSize:20},muted:{color:"#6b6b68",fontSize:14,lineHeight:1.55},
 card:{background:"#fff",border:"1px solid #e2e2de",borderRadius:14,padding:20,marginBottom:14},
 grid:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12},label:{display:"block",fontSize:11,fontWeight:800,textTransform:"uppercase",margin:"14px 0 6px",color:"#777"},
 input:{width:"100%",boxSizing:"border-box",padding:11,border:"1px solid #ccc",borderRadius:8,fontSize:14,background:"#fff"},
 button:{marginTop:12,padding:"10px 14px",border:0,borderRadius:8,background:"#111",color:"#fff",fontWeight:800,cursor:"pointer"},
 message:{padding:12,background:"#fff",border:"1px solid #ddd",borderRadius:9,marginBottom:14,fontSize:13},
 results:{border:"1px solid #ddd",borderRadius:8,overflow:"hidden"},result:{display:"block",width:"100%",padding:10,textAlign:"left",border:0,borderBottom:"1px solid #eee",background:"#fff",cursor:"pointer"},
 row:{display:"grid",gridTemplateColumns:"1fr auto auto",gap:12,alignItems:"center",padding:"12px 0",borderBottom:"1px solid #eee"},badge:{fontSize:10,fontWeight:800,padding:"5px 7px",borderRadius:6,background:"#f1f1ed"}
};
