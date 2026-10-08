'use client'

import Link from "next/link"
import { FormEvent, Suspense, useState } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { getLocaleFromPathname, localizedPath, type WfmLocale } from "../lib/i18n"
import { supabase } from "../lib/supabase"

const LOGIN_TRANSLATIONS: Record<WfmLocale, Record<string, string>> = {
  en: { title:"Sign in to WFM", description:"Access your private scouting lists, notes and recruitment workflows.", signin:"Sign in", signup:"Create account", email:"Email", password:"Password", yourPassword:"Your password", creating:"Creating...", signingIn:"Signing in...", created:"Account created. Check your email if confirmation is required, then sign in.", return:"← Return to WFM", loading:"Loading WFM sign in…" },
  es: { title:"Inicia sesión en WFM", description:"Accede a tus listas privadas de scouting, notas y flujos de reclutamiento.", signin:"Iniciar sesión", signup:"Crear cuenta", email:"Correo electrónico", password:"Contraseña", yourPassword:"Tu contraseña", creating:"Creando...", signingIn:"Iniciando sesión...", created:"Cuenta creada. Revisa tu correo si se requiere confirmación y luego inicia sesión.", return:"← Volver a WFM", loading:"Cargando inicio de sesión de WFM…" },
  pt: { title:"Entrar no WFM", description:"Acesse suas listas privadas de scouting, notas e fluxos de recrutamento.", signin:"Entrar", signup:"Criar conta", email:"E-mail", password:"Senha", yourPassword:"Sua senha", creating:"Criando...", signingIn:"Entrando...", created:"Conta criada. Verifique seu e-mail se a confirmação for necessária e depois entre.", return:"← Voltar ao WFM", loading:"Carregando login do WFM…" },
  fr: { title:"Se connecter à WFM", description:"Accédez à vos listes de scouting privées, notes et workflows de recrutement.", signin:"Se connecter", signup:"Créer un compte", email:"E-mail", password:"Mot de passe", yourPassword:"Votre mot de passe", creating:"Création...", signingIn:"Connexion...", created:"Compte créé. Vérifiez votre e-mail si une confirmation est requise, puis connectez-vous.", return:"← Retour à WFM", loading:"Chargement de la connexion WFM…" },
  de: { title:"Bei WFM anmelden", description:"Greifen Sie auf Ihre privaten Scouting-Listen, Notizen und Recruiting-Workflows zu.", signin:"Anmelden", signup:"Konto erstellen", email:"E-Mail", password:"Passwort", yourPassword:"Ihr Passwort", creating:"Wird erstellt...", signingIn:"Anmeldung...", created:"Konto erstellt. Prüfen Sie Ihre E-Mail, falls eine Bestätigung erforderlich ist, und melden Sie sich anschließend an.", return:"← Zurück zu WFM", loading:"WFM-Anmeldung wird geladen…" }
}

function LoginForm(){
 const router=useRouter()
 const searchParams=useSearchParams()
 const pathname=usePathname()
 const locale=getLocaleFromPathname(pathname)
 const text=LOGIN_TRANSLATIONS[locale]
 const [mode,setMode]=useState<"signin"|"signup">(searchParams.get("mode")==="signup"?"signup":"signin")
 const [email,setEmail]=useState("")
 const [password,setPassword]=useState("")
 const [busy,setBusy]=useState(false)
 const [message,setMessage]=useState("")
 const [error,setError]=useState("")
 const returnTo=searchParams.get("returnTo")||localizedPath(locale,"/scouting")
 const submit=async(e:FormEvent)=>{
  e.preventDefault();setBusy(true);setError("");setMessage("")
  if(mode==="signup"){
   const {data,error}=await supabase.auth.signUp({email,password})
   if(error){setError(error.message);setBusy(false);return}
   if(data.session){window.wfmTrackInteraction?.({action:'signup'});router.replace(returnTo);return}
   setMessage(text.created);setMode("signin");setBusy(false);return
  }
  const {error}=await supabase.auth.signInWithPassword({email,password})
  if(error){setError(error.message);setBusy(false);return}
  window.wfmTrackInteraction?.({action:'login'});
  router.replace(returnTo)
 }
 return <main style={{minHeight:"calc(100vh - 76px)",display:"grid",placeItems:"center",padding:"40px 20px",background:"#f5f4ef"}}>
  <section style={{width:"100%",maxWidth:460,background:"#fff",border:"1px solid #dedcd5",borderRadius:16,padding:32}}>
   <Link href={localizedPath(locale,"/")} style={{textDecoration:"none",color:"#111",fontWeight:800,fontSize:22}}>WFM<span style={{color:"#777"}}>•</span></Link>
   <h1 style={{margin:"26px 0 8px",fontSize:32}}>{text.title}</h1>
   <p style={{margin:"0 0 22px",color:"#666",lineHeight:1.5}}>{text.description}</p>
   <div style={{display:"flex",gap:8,marginBottom:18}}>
    <button type="button" onClick={()=>{setMode("signin");setError("");setMessage("")}} style={{flex:1,padding:10,border:"1px solid #ccc",borderRadius:8,background:mode==="signin"?"#111":"#fff",color:mode==="signin"?"#fff":"#111",fontWeight:700}}>{text.signin}</button>
    <button type="button" onClick={()=>{setMode("signup");setError("");setMessage("")}} style={{flex:1,padding:10,border:"1px solid #ccc",borderRadius:8,background:mode==="signup"?"#111":"#fff",color:mode==="signup"?"#fff":"#111",fontWeight:700}}>{text.signup}</button>
   </div>
   <form onSubmit={submit}>
    <label style={{display:"block",fontSize:11,fontWeight:700,textTransform:"uppercase",color:"#777"}}>{text.email}</label>
    <input value={email} onChange={e=>setEmail(e.target.value)} type="email" autoComplete="email" required placeholder="you@example.com" style={{width:"100%",marginTop:6,padding:11,border:"1px solid #ccc",borderRadius:8,fontSize:14}}/>
    <label style={{display:"block",marginTop:14,fontSize:11,fontWeight:700,textTransform:"uppercase",color:"#777"}}>{text.password}</label>
    <input value={password} onChange={e=>setPassword(e.target.value)} type="password" autoComplete={mode==="signup"?"new-password":"current-password"} required placeholder={text.yourPassword} style={{width:"100%",marginTop:6,padding:11,border:"1px solid #ccc",borderRadius:8,fontSize:14}}/>
    <button type="submit" disabled={busy} style={{width:"100%",marginTop:16,padding:12,border:0,borderRadius:8,background:"#111",color:"#fff",fontWeight:700,opacity:busy?.6:1}}>{busy?(mode==="signup"?text.creating:text.signingIn):(mode==="signup"?text.signup:text.signin)}</button>
   </form>
   {error&&<div style={{marginTop:14,padding:12,borderRadius:8,background:"#fff1f1",color:"#8a1c1c",fontSize:12,lineHeight:1.45}}>{error}</div>}
   {message&&<div style={{marginTop:14,padding:12,borderRadius:8,background:"#f3f3f0",fontSize:12,lineHeight:1.45}}>{message}</div>}
   <Link href={returnTo} style={{display:"inline-block",marginTop:20,fontSize:12,color:"#555"}}>{text.return}</Link>
  </section>
 </main>
}

export default function LoginPage(){
 const pathname=usePathname()
 const locale=getLocaleFromPathname(pathname)
 const text=LOGIN_TRANSLATIONS[locale]
 return <Suspense fallback={<main style={{minHeight:"calc(100vh - 76px)",display:"grid",placeItems:"center",padding:"40px 20px",background:"#f5f4ef"}}><div>{text.loading}</div></main>}><LoginForm/></Suspense>
}
