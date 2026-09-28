'use client'

import Link from "next/link"
import { FormEvent, Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "../lib/supabase"

function LoginForm(){
 const router=useRouter()
 const searchParams=useSearchParams()
 const [mode,setMode]=useState<"signin"|"signup">("signin")
 const [email,setEmail]=useState("")
 const [password,setPassword]=useState("")
 const [busy,setBusy]=useState(false)
 const [message,setMessage]=useState("")
 const [error,setError]=useState("")
 const returnTo=searchParams.get("returnTo")||"/scouting"
 const submit=async(e:FormEvent)=>{
  e.preventDefault();setBusy(true);setError("");setMessage("")
  if(mode==="signup"){
   const {data,error}=await supabase.auth.signUp({email,password})
   if(error){setError(error.message);setBusy(false);return}
   if(data.session){router.replace(returnTo);return}
   setMessage("Account created. Check your email if confirmation is required, then sign in.")
   setMode("signin");setBusy(false);return
  }
  const {error}=await supabase.auth.signInWithPassword({email,password})
  if(error){setError(error.message);setBusy(false);return}
  router.replace(returnTo)
 }
 return <main style={{minHeight:"calc(100vh - 76px)",display:"grid",placeItems:"center",padding:"40px 20px",background:"#f5f4ef"}}>
  <section style={{width:"100%",maxWidth:460,background:"#fff",border:"1px solid #dedcd5",borderRadius:16,padding:32}}>
   <Link href="/" style={{textDecoration:"none",color:"#111",fontWeight:800,fontSize:22}}>WFM<span style={{color:"#777"}}>•</span></Link>
   <h1 style={{margin:"26px 0 8px",fontSize:32}}>Sign in to WFM</h1>
   <p style={{margin:"0 0 22px",color:"#666",lineHeight:1.5}}>Access your private scouting lists, notes and recruitment workflows.</p>
   <div style={{display:"flex",gap:8,marginBottom:18}}>
    <button type="button" onClick={()=>{setMode("signin");setError("");setMessage("")}} style={{flex:1,padding:10,border:"1px solid #ccc",borderRadius:8,background:mode==="signin"?"#111":"#fff",color:mode==="signin"?"#fff":"#111",fontWeight:700}}>Sign in</button>
    <button type="button" onClick={()=>{setMode("signup");setError("");setMessage("")}} style={{flex:1,padding:10,border:"1px solid #ccc",borderRadius:8,background:mode==="signup"?"#111":"#fff",color:mode==="signup"?"#fff":"#111",fontWeight:700}}>Create account</button>
   </div>
   <form onSubmit={submit}>
    <label style={{display:"block",fontSize:11,fontWeight:700,textTransform:"uppercase",color:"#777"}}>Email</label>
    <input value={email} onChange={e=>setEmail(e.target.value)} type="email" autoComplete="email" required placeholder="you@example.com" style={{width:"100%",marginTop:6,padding:11,border:"1px solid #ccc",borderRadius:8,fontSize:14}}/>
    <label style={{display:"block",marginTop:14,fontSize:11,fontWeight:700,textTransform:"uppercase",color:"#777"}}>Password</label>
    <input value={password} onChange={e=>setPassword(e.target.value)} type="password" autoComplete={mode==="signup"?"new-password":"current-password"} required placeholder="Your password" style={{width:"100%",marginTop:6,padding:11,border:"1px solid #ccc",borderRadius:8,fontSize:14}}/>
    <button type="submit" disabled={busy} style={{width:"100%",marginTop:16,padding:12,border:0,borderRadius:8,background:"#111",color:"#fff",fontWeight:700,opacity:busy?.6:1}}>{busy?(mode==="signup"?"Creating...":"Signing in..."):(mode==="signup"?"Create account":"Sign in")}</button>
   </form>
   {error&&<div style={{marginTop:14,padding:12,borderRadius:8,background:"#fff1f1",color:"#8a1c1c",fontSize:12,lineHeight:1.45}}>{error}</div>}
   {message&&<div style={{marginTop:14,padding:12,borderRadius:8,background:"#f3f3f0",fontSize:12,lineHeight:1.45}}>{message}</div>}
   <Link href={returnTo} style={{display:"inline-block",marginTop:20,fontSize:12,color:"#555"}}>← Return to WFM</Link>
  </section>
 </main>
}

export default function LoginPage(){
 return <Suspense fallback={<main style={{minHeight:"calc(100vh - 76px)",display:"grid",placeItems:"center",padding:"40px 20px",background:"#f5f4ef"}}><div>Loading WFM sign in…</div></main>}><LoginForm/></Suspense>
}
