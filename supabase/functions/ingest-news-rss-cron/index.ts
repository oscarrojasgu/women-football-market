import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "npm:@supabase/server@^1";
import { createClient } from "npm:@supabase/supabase-js@2";

type Source = { id:string; publisher:string; feed_url:string };

function textOf(value:string) {
  return value.replace(/<!\[CDATA\[/g,"").replace(/\]\]>/g,"").replace(/<[^>]+>/g," ").replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/\s+/g," ").trim();
}
function tag(xml:string, name:string) {
  const m=xml.match(new RegExp("<"+name+"[^>]*>([\\s\\S]*?)</"+name+">","i"));
  return m ? textOf(m[1]) : "";
}
function items(xml:string) {
  const blocks=[...xml.matchAll(/<(item|entry)\\b[\\s\\S]*?<\\/(item|entry)>/gi)].map(m=>m[0]);
  return blocks.slice(0,20).map(block=>{
    const title=tag(block,"title");
    const linkTag=block.match(/<link\\b[^>]*href=["']([^"']+)["'][^>]*>/i);
    const url=linkTag?.[1] || tag(block,"link") || tag(block,"guid");
    const published=tag(block,"pubDate") || tag(block,"published") || tag(block,"updated") || tag(block,"dc:date");
    const description=tag(block,"description") || tag(block,"summary") || tag(block,"content");
    return {title,url,published,description};
  }).filter(x=>x.title && x.url);
}

export default {
  fetch: withSupabase({auth:"publishable"}, async (req)=>{
    if(req.method!=="POST") return Response.json({error:"POST required"},{status:405});

    const token=req.headers.get("x-wfm-internal-token") || "";
    const secretKeys=JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}");
    const secretKey=secretKeys.default;
    if(!secretKey) return Response.json({error:"Server secret unavailable"},{status:500});

    const supabaseAdmin=createClient(
      Deno.env.get("SUPABASE_URL")!,
      secretKey,
      {auth:{autoRefreshToken:false,persistSession:false}}
    );

    const {data:secret}=await supabaseAdmin
      .schema("private")
      .from("wfm_internal_cron_secrets")
      .select("token")
      .eq("name","news_ingestion")
      .maybeSingle();

    if(!secret?.token || token !== secret.token){
      return Response.json({error:"Unauthorized"},{status:401});
    }

    const {data:sources,error:sourceError}=await supabaseAdmin
      .from("wfm_news_sources")
      .select("id,publisher,feed_url")
      .eq("active",true);

    if(sourceError) return Response.json({error:sourceError.message},{status:500});

    const results={sources:0,feeds_ok:0,items_seen:0,inserted:0,updated:0,errors:[] as string[]};

    for(const source of (sources||[]) as Source[]){
      results.sources++;
      try{
        const controller=new AbortController();
        const timer=setTimeout(()=>controller.abort(),8000);
        const response=await fetch(source.feed_url,{
          headers:{"User-Agent":"WFM-NewsBot/1.0"},
          signal:controller.signal
        });
        clearTimeout(timer);
        if(!response.ok) throw new Error("HTTP "+response.status);
        const xml=await response.text();
        const feedItems=items(xml);
        results.feeds_ok++;

        for(const item of feedItems){
          results.items_seen++;
          let publishedAt=new Date(item.published);
          if(Number.isNaN(publishedAt.getTime())) publishedAt=new Date();

          const row={
            title:item.title.slice(0,500),
            url:item.url.slice(0,2000),
            publisher:source.publisher,
            published_at:publishedAt.toISOString(),
            summary:item.description.slice(0,1000)||null,
            source_confidence:"reported",
            active:true,
            updated_at:new Date().toISOString()
          };

          const {data:existing}=await supabaseAdmin
            .from("wfm_news_items")
            .select("id")
            .eq("url",row.url)
            .maybeSingle();

          const {error}=existing
            ? await supabaseAdmin.from("wfm_news_items").update(row).eq("id",existing.id)
            : await supabaseAdmin.from("wfm_news_items").insert(row);

          if(error) results.errors.push(source.publisher+": "+error.message);
          else existing ? results.updated++ : results.inserted++;
        }

        await supabaseAdmin
          .from("wfm_news_sources")
          .update({
            last_checked_at:new Date().toISOString(),
            last_success_at:new Date().toISOString(),
            last_error:null,
            updated_at:new Date().toISOString()
          })
          .eq("id",source.id);
      }catch(error){
        const message=error instanceof Error?error.message:String(error);
        results.errors.push(source.publisher+": "+message);
        await supabaseAdmin
          .from("wfm_news_sources")
          .update({
            last_checked_at:new Date().toISOString(),
            last_error:message,
            updated_at:new Date().toISOString()
          })
          .eq("id",source.id);
      }
    }

    return Response.json({ok:results.errors.length===0,...results});
  })
};
