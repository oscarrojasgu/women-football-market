"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Club={id:string;name:string};
type Profile={id:string;name:string;description:string|null;status:string;club_id:string|null;created_at:string;updated_at:string};

export default function ScoutingProfilesPage(){
 const [userId,setUserId]=useState<string|null>(null);
 const [profiles,setProfiles]=useState<Profile[]>([]);
 const [clubs,setClubs]=useState<Club[]>([]);
 const [name,setName]=useState("");
 const [description,setDescription]=useState("");
 const [clubId,setClubId]=useState("");
 const [loading,setLoading]=useState(true);
 const [saving,setSaving]=useState(false);
 const [message,setMessage]=useState("");

 useEffect(()=>{let mounted=true;(async()=>{
  const {data:auth}=await supabase.auth.getUser();
  if(!mounted)return;
  const uid=auth.user?.id||null;setUserId(uid);
  if(!uid){setLoading(false);return}
  const [pr,cr]=await Promise.all([
   supabase.from("scouting_profiles").select("id,name,description,status,club_id,created_at,updated_at").order("updated_at",{ascending:false}),
   supabase.from("clubs").select("id,name").order("name",{ascending:true})
  ]);
  if(!mounted)return;
  if(pr.error)setMessage(pr.error.message);else setProfiles((pr.data||[]) as Profile[]);
  if(!cr.error)setClubs((cr.data||[]) as Club[]);
  setLoading(false);
 })();return()=>{mounted=false}},[]);

 const createProfile=async()=>{
  const clean=name.trim();if(!clean||!userId)return;
  setSaving(true);setMessage("");
  const {data,error}=await supabase.from("scouting_profiles").insert({user_id:userId,name:clean,description:description.trim()||null,club_id:clubId||null}).select("id,name,description,status,club_id,created_at,updated_at").single();
  if(error)setMessage(error.message);else{setProfiles(p=>[data as Profile,...p]);setName("");setDescription("");setClubId("")}
  setSaving(false);
 };
 const toggleStatus=async(p:Profile)=>{
  const status=p.status==="active"?"archived":"active";
  const {data,error}=await supabase.from("scouting_profiles").update({status,updated_at:new Date().toISOString()}).eq("id",p.id).select("id,name,description,status,club_id,created_at,updated_at").single();
  if(error)setMessage(error.message);else setProfiles(ps=>ps.map(x=>x.id===p.id?data as Profile:x));
 };
 const deleteProfile=async(p:Profile)=>{
  if(!window.confirm("Delete this scouting profile?"))return;
  const {error}=await supabase.from("scouting_profiles").delete().eq("id",p.id);
  if(error)setMessage(error.message);else setProfiles(ps=>ps.filter(x=>x.id!==p.id));
 };
 const clubName=(id:string|null)=>id?clubs.find(c=>c.id===id)?.name||"Linked club":"Independent profile";

 return <main style={{maxWidth:1100,margin:"0 auto",padding:"28px 20px"}}>
  <div style={{display:"flex",justifyContent:"space-between",gap:16,alignItems:"flex-start",flexWrap:"wrap",marginBottom:22}}>
   <div><h1 style={{margin:"0 0 6px",fontSize:28}}>Scouting Profiles</h1><p style={{margin:0,color:"#777"}}>Build reusable recruitment profiles for club-specific or independent scouting work.</p></div>
   <a href="/scouting" style={{fontSize:12}}>← Scouting Workspace</a>
  </div>
  <section className="intelligence-panel" style={{padding:20,marginBottom:18}}>
   <h2 style={{fontSize:16,margin:"0 0 12px"}}>Create Profile</h2>
   <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
    <label style={{fontSize:12}}>Profile name<input value={name} onChange={e=>setName(e.target.value)} placeholder="U23 Central Midfielder" style={{display:"block",width:"100%",marginTop:5,padding:9,border:"1px solid #ddd",borderRadius:6}}/></label>
    <label style={{fontSize:12}}>Club context<select value={clubId} onChange={e=>setClubId(e.target.value)} style={{display:"block",width:"100%",marginTop:5,padding:9,border:"1px solid #ddd",borderRadius:6}}><option value="">Independent / no club</option>{clubs.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
   </div>
   <label style={{display:"block",fontSize:12,marginTop:12}}>Description<textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="What type of player or recruitment need is this profile designed for?" rows={3} style={{display:"block",width:"100%",marginTop:5,padding:9,border:"1px solid #ddd",borderRadius:6,resize:"vertical"}}/></label>
   <button type="button" onClick={createProfile} disabled={!name.trim()||saving} style={{marginTop:12,border:"1px solid #222",borderRadius:6,background:"#222",color:"#fff",padding:"9px 14px",cursor:"pointer"}}>{saving?"Creating…":"Create Profile"}</button>
   {message&&<p style={{color:"#b00",fontSize:12,marginBottom:0}}>{message}</p>}
  </section>
  {loading?<p>Loading scouting profiles…</p>:!profiles.length?<div className="intelligence-empty">No scouting profiles yet. Create one above to start building the global scouting network.</div>:
   <div style={{display:"grid",gap:12}}>{profiles.map(p=><article key={p.id} className="intelligence-panel" style={{padding:18}}>
    <div style={{display:"flex",justifyContent:"space-between",gap:14,alignItems:"flex-start"}}>
     <div><div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}><h2 style={{fontSize:16,margin:0}}>{p.name}</h2><span style={{fontSize:10,textTransform:"uppercase",letterSpacing:".08em"}}>{p.status}</span></div><p style={{margin:"7px 0 0",fontSize:12,color:"#777"}}>{clubName(p.club_id)}</p>{p.description&&<p style={{margin:"9px 0 0"}}>{p.description}</p>}</div>
     <div style={{display:"flex",gap:7,flexWrap:"wrap"}}><button type="button" onClick={()=>toggleStatus(p)} style={{border:"1px solid #ddd",background:"#fff",borderRadius:6,padding:"7px 9px",fontSize:11}}>{p.status==="active"?"Archive":"Activate"}</button><button type="button" onClick={()=>deleteProfile(p)} style={{border:"1px solid #ddd",background:"#fff",borderRadius:6,padding:"7px 9px",fontSize:11}}>Delete</button></div>
    </div>
    <div style={{marginTop:14,paddingTop:12,borderTop:"1px solid #eee",fontSize:11,color:"#888"}}>Criteria builder and global recruitment targeting will connect to this profile in the next M6 layer.</div>
   </article>)}</div>}
 </main>;
}
