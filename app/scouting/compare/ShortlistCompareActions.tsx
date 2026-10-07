"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useWfmT } from "../../lib/use-wfm-t";

type List={id:string;name:string;status:string};

export default function ShortlistCompareActions({playerIds,returnTo}:{playerIds:string[];returnTo:string}){
  const t=useWfmT();
  const [userId,setUserId]=useState<string|null>(null);
  const [lists,setLists]=useState<List[]>([]);
  const [listId,setListId]=useState("");
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");

  useEffect(()=>{(async()=>{
    const auth=await supabase.auth.getUser();
    const uid=auth.data.user?.id||null;
    setUserId(uid);
    if(!uid)return;
    const {data}=await supabase.from("scouting_lists").select("id,name,status").eq("status","active").order("updated_at",{ascending:false});
    const next=(data||[]) as List[];
    setLists(next);
    if(next.length)setListId(next[0].id);
  })()},[]);

  const createList=async()=>{
    if(!userId){setMessage(t("Sign in to save players."));return}
    const name=window.prompt(t("Name this scouting list"))?.trim();
    if(!name)return;
    setBusy(true);
    const {data,error}=await supabase.from("scouting_lists").insert({user_id:userId,name}).select("id,name,status").single();
    setBusy(false);
    if(error){setMessage(error.message);return}
    setLists(current=>[data as List,...current]);
    setListId(data.id);
    window.wfmTrackInteraction?.({action:'scouting_list_created',entity_type:'scouting_list',entity_id:data.id});
    setMessage(t("Scouting list created. Select Add Selected to save these players."));
  };

  const addSelected=async()=>{
    if(!userId){setMessage(t("Sign in to save players."));return}
    if(!listId){setMessage(t("Create or select a scouting list first."));return}
    setBusy(true);
    const {data:existingRows,error:existingError}=await supabase.from("scouting_list_players").select("player_id").eq("list_id",listId).in("player_id",playerIds);
    if(existingError){setBusy(false);setMessage(existingError.message);return}
    const existing=new Set((existingRows||[]).map((r:any)=>r.player_id));
    const ids=playerIds.filter(id=>!existing.has(id));
    if(!ids.length){setBusy(false);setMessage(t("All compared players are already on this list."));return}
    const {error}=await supabase.from("scouting_list_players").insert(ids.map(player_id=>({list_id:listId,player_id,added_by:userId})));
    setBusy(false);
    if(error){setMessage(error.message);return}
    ids.forEach((playerId) => window.wfmTrackInteraction?.({action:'player_added_to_scouting',entity_type:'player',entity_id:playerId,metadata:{scouting_list_id:listId}}));
    window.wfmTrackInteraction?.({action:'scouting_players_added',entity_type:'scouting_list',entity_id:listId,metadata:{player_count:ids.length}});
    setMessage(ids.length+" "+t(ids.length===1?"player":"players")+" "+t("added to the scouting list."));
  };

  return <div className="scout-shortlist-bar" style={{marginBottom:14}}>
    <div><strong>{playerIds.length}</strong> {t("compared")} · {t("save these candidates to a scouting list")}</div>
    <div className="scout-shortlist-actions">
      <select value={listId} onChange={e=>setListId(e.target.value)} disabled={!userId||busy}>
        <option value="">{userId?t("Select scouting list"):t("Sign in to save")}</option>
        {lists.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}
      </select>
      <button type="button" onClick={createList} disabled={busy||!userId}>{t("New List")}</button>
      <button type="button" onClick={addSelected} disabled={busy||!userId||!listId}>{t("Add Compared Players")}</button>
      {message&&<span className="scout-note" style={{margin:0}}>{message}</span>}
    </div>
  </div>;
}
