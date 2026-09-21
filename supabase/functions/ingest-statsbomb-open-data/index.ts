import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "npm:@supabase/server@^1";

type Match = { match_id:number; match_date:string; competition?:{competition_name?:string}; season?:{season_name?:string}; home_team?:{home_team_id?:number;home_team_name?:string;country?:{name?:string}}; away_team?:{away_team_id?:number;away_team_name?:string;country?:{name?:string}} };
type PositionSegment = { position?:string; from?:string; to?:string|null; start_reason?:string };
type LineupPlayer = { player_id:number; player_name:string; country?:{name?:string}; cards?:Array<{card_type?:string}>; positions?:PositionSegment[] };
type TeamLineup = { team_id:number; team_name:string; lineup:LineupPlayer[] };
type Event = { id?:number; type?:{name?:string}; player?:{id?:number;name?:string}; pass?:{goal_assist?:boolean;shot_assist?:boolean;progressive?:boolean;cross?:boolean}; shot?:{statsbomb_xg?:number;outcome?:{name?:string}}; carry?:{progressive?:boolean}; goalkeeper?:{type?:{name?:string}} };

function minute(v:string|null|undefined){if(!v)return 90;const [m,s]=v.split(":").map(Number);return(m||0)+(s||0)/60;}
function playedMinutes(ps:PositionSegment[]){const a=ps.filter(p=>p.from).map(p=>[minute(p.from),minute(p.to)] as [number,number]).sort((x,y)=>x[0]-y[0]);if(!a.length)return 0;let total=0,start=a[0][0],end=a[0][1];for(const [x,y] of a.slice(1)){if(x<=end+.01)end=Math.max(end,y);else{total+=end-start;start=x;end=y;}}return Math.round(total+end-start);}
async function getJson(path:string){const r=await fetch("https://raw.githubusercontent.com/hudl/open-data/master/"+path);const t=await r.text();if(!r.ok)throw new Error("StatsBomb "+r.status+": "+t.slice(0,300));return JSON.parse(t);}
function emptyStats(){return{appearances:0,starts:0,minutes:0,goals:0,assists:0,cards:0,shots:0,shots_on_target:0,key_passes:0,chances_created:0,crosses:0,tackles:0,tackles_won:0,interceptions:0,clearances:0,blocks:0,recoveries:0,dispossessions:0,dribbles_attempted:0,dribbles_completed:0,fouls_committed:0,fouls_drawn:0,offsides:0,passes_attempted:0,passes_completed:0,progressive_passes:0,progressive_carries:0,duels_won:0,duels_lost:0,aerials_won:0,aerials_lost:0,xg:0,xa:0,sca:0,gca:0,saves:0,shots_on_target_faced:0,goals_against:0,clean_sheets:0,penalty_kicks_saved:0,penalty_kicks_faced:0,own_goals:0};}

export default { fetch: withSupabase({auth:"secret"}, async (req,ctx)=>{
  if(req.method!=="POST")return Response.json({error:"POST required"},{status:405});
  let body:{competition_id?:number;season_id?:number;match_ids?:Array<number|string>;max_matches?:number};
  try{body=await req.json();}catch{return Response.json({error:"Invalid JSON body"},{status:400});}
  const competitionId=Number(body.competition_id??37),seasonId=Number(body.season_id??90);
  const requested=new Set((Array.isArray(body.match_ids)?body.match_ids:[]).map(String));
  const maxMatches=Math.min(Math.max(Number(body.max_matches??1),1),10);
  const {data:run,error:runError}=await ctx.supabaseAdmin.from("data_update_runs").insert({provider:"statsbomb-open-data",run_type:requested.size?"manual":"backfill",status:"running",metadata:{competition_id:competitionId,season_id:seasonId,match_ids:[...requested],max_matches:maxMatches}}).select("id").single();
  if(runError||!run)return Response.json({error:runError?.message||"Could not create update run"},{status:500});
  let inserted=0,updated=0,rejected=0,received=0;const errors:string[]=[];
  try{
    const matches=await getJson("data/matches/"+competitionId+"/"+seasonId+".json") as Match[];
    const selected=(requested.size?matches.filter(m=>requested.has(String(m.match_id))):matches.slice(0,maxMatches)).slice(0,maxMatches);
    for(const match of selected)try{
      const [lineups,events]=await Promise.all([getJson("data/lineups/"+match.match_id+".json") as Promise<TeamLineup[]>,getJson("data/events/"+match.match_id+".json") as Promise<Event[]>]);
      const clubIds=new Map<number,string>();
      for(const team of lineups){
        const country=team.team_id===match.home_team?.home_team_id?match.home_team?.country?.name:match.away_team?.country?.name;
        const {data:ec}=await ctx.supabaseAdmin.from("clubs").select("id").ilike("name",team.team_name).maybeSingle();
        let clubId=ec?.id||null;
        if(!clubId){const {data:nc,error}=await ctx.supabaseAdmin.from("clubs").insert({name:team.team_name,country:country||"England",organization_type:"club"}).select("id").single();if(error||!nc)throw new Error("club "+team.team_name+": "+(error?.message||"insert failed"));clubId=nc.id;}
        clubIds.set(team.team_id,clubId);
      }
      const stats=new Map<number,any>(),names=new Map<number,{name:string;nationality:string;position:string|null;clubId:string|null}>();
      for(const team of lineups)for(const p of team.lineup||[]){
        const mins=playedMinutes(p.positions||[]),pos=p.positions?.[0]?.position||null;
        names.set(p.player_id,{name:p.player_name,nationality:p.country?.name||"",position:pos,clubId:clubIds.get(team.team_id)||null});
        if(mins>0){const s=emptyStats();s.appearances=1;s.starts=(p.positions||[]).some(x=>(x.start_reason||"").toLowerCase().includes("starting xi"))?1:0;s.minutes=mins;s.cards=(p.cards||[]).filter(c=>(c.card_type||"").toLowerCase().includes("yellow")||(c.card_type||"").toLowerCase().includes("red")).length;stats.set(p.player_id,s);}
      }
      for(const e of events){
        const pid=e.player?.id;if(pid==null)continue;if(!stats.has(pid))stats.set(pid,emptyStats());const s=stats.get(pid),type=(e.type?.name||"").toLowerCase();
        if(type==="shot"&&e.shot){s.shots++;const o=(e.shot.outcome?.name||"").toLowerCase();if(o==="goal"){s.goals++;s.shots_on_target++;}else if(o==="saved")s.shots_on_target++;s.xg+=Number(e.shot.statsbomb_xg||0);}
        else if(type==="pass"&&e.pass){s.passes_attempted++;s.passes_completed++;if(e.pass.goal_assist){s.assists++;s.gca++;s.key_passes++;s.chances_created++;}else if(e.pass.shot_assist){s.key_passes++;s.chances_created++;s.sca++;}if(e.pass.progressive)s.progressive_passes++;if(e.pass.cross)s.crosses++;}
        else if(type==="carry"){if(e.carry?.progressive)s.progressive_carries++;}else if(type==="interception")s.interceptions++;else if(type==="clearance")s.clearances++;else if(type==="block")s.blocks++;else if(type==="ball recovery")s.recoveries++;else if(type==="dispossessed")s.dispossessions++;else if(type==="dribble")s.dribbles_attempted++;else if(type==="foul committed")s.fouls_committed++;else if(type==="foul won")s.fouls_drawn++;else if(type==="offside")s.offsides++;else if(type==="tackle"){s.tackles++;s.tackles_won++;}else if(type==="goal keeper"&&(e.goalkeeper?.type?.name||"").toLowerCase().includes("save"))s.saves++;
      }
      for(const [externalId,s] of stats){
        const info=names.get(externalId);if(!info)continue;received++;
        const {data:ep}=await ctx.supabaseAdmin.from("players").select("id").ilike("full_name",info.name).limit(2);
        let playerId=ep?.length===1?ep[0].id:null;
        if(!playerId){const {data:np,error}=await ctx.supabaseAdmin.from("players").insert({full_name:info.name,nationality:info.nationality||null,position:info.position}).select("id").single();if(error||!np){rejected++;errors.push(match.match_id+":"+externalId+" player: "+(error?.message||"insert failed"));continue;}playerId=np.id;}
        await ctx.supabaseAdmin.from("provider_player_mappings").upsert({provider:"statsbomb-open-data",external_player_id:String(externalId),player_id:playerId,external_name:info.name,confidence:"verified",notes:"Matched/imported from StatsBomb Open Data."},{onConflict:"provider,external_player_id"});
        const row={provider:"statsbomb-open-data",external_match_id:String(match.match_id),external_player_id:String(externalId),player_id:playerId,club_id:info.clubId,season:match.season?.season_name||String(seasonId),competition:match.competition?.competition_name||("StatsBomb competition "+competitionId),...s,match_id:String(match.match_id),source_event_id:"statsbomb:"+match.match_id+":"+externalId,confidence:"verified",notes:"Imported from Hudl StatsBomb Open Data lineups/events."};
        const {data:existing}=await ctx.supabaseAdmin.from("player_match_stats").select("id").eq("provider","statsbomb-open-data").eq("external_match_id",String(match.match_id)).eq("external_player_id",String(externalId)).maybeSingle();
        const {error}=await ctx.supabaseAdmin.from("player_match_stats").upsert({...row,updated_at:new Date().toISOString()},{onConflict:"provider,external_match_id,external_player_id"});
        if(error){rejected++;errors.push(match.match_id+":"+externalId+": "+error.message);}else if(existing)updated++;else inserted++;
      }
    }catch(error){rejected++;errors.push(match.match_id+": "+(error instanceof Error?error.message:String(error)));}
  }catch(error){rejected++;errors.push(error instanceof Error?error.message:String(error));}
  const status=rejected===0?"completed":(inserted+updated>0?"partial":"failed");
  await ctx.supabaseAdmin.from("data_update_runs").update({status,finished_at:new Date().toISOString(),records_received:received,records_inserted:inserted,records_updated:updated,records_rejected:rejected,error_message:errors.length?errors.slice(0,100).join(" | "):null}).eq("id",run.id);
  return Response.json({ok:status!=="failed",run_id:run.id,provider:"statsbomb-open-data",competition_id:competitionId,season_id:seasonId,status,matches_requested:requested.size||Math.min(maxMatches,1),records_received:received,records_inserted:inserted,records_updated:updated,records_rejected:rejected,errors},{status:status==="failed"?422:200});
})};
