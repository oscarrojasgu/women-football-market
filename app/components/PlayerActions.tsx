"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "../lib/supabase";
import { getLocaleFromPathname, type WfmLocale } from "../lib/i18n";

export default function PlayerActions() {
  const pathname = usePathname();
  const playerId = useMemo(() => {
    const match = pathname?.match(/^\/players\/([^/]+)$/);
    return match?.[1] || null;
  }, [pathname]);

  const locale = getLocaleFromPathname(pathname || "/");
  const t = (key: string) => PLAYER_ACTIONS_COPY[locale][key] ?? PLAYER_ACTIONS_COPY.en[key] ?? key;

  const [open, setOpen] = useState<"claim" | "update" | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [fieldName, setFieldName] = useState("");
  const [newValue, setNewValue] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!playerId) return;
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id || null);
    });
  }, [playerId]);

  if (!playerId) return null;

  const authenticate = async () => {
    setBusy(true);
    setMessage("");

    if (authMode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      setBusy(false);
      if (error) {
        setMessage(error.message);
        return;
      }

      setUserId(data.user?.id || null);
      setMessage(
        data.user
          ? t("Account created. You can now submit your verification request.")
          : t("Account created. If email confirmation is enabled, check your email before signing in.")
      );
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setBusy(false);
    if (error) {
      setMessage(error.message);
      return;
    }

    setUserId(data.user?.id || null);
    setMessage(t("Signed in successfully."));
  };

  const claimProfile = async () => {
    if (!userId) {
      setMessage(t("Please sign in first."));
      return;
    }

    setBusy(true);
    setMessage("");

    const { error } = await supabase.from("player_claims").insert({
      player_id: playerId,
      user_id: userId,
      verification_method: "account",
      status: "pending",
    });

    setBusy(false);
    setMessage(
      error
        ? error.code === "23505"
          ? t("You already submitted a claim for this profile.")
          : error.message
        : t("Claim submitted. WFM will review your verification.")
    );
  };

  const submitUpdate = async () => {
    if (!userId) {
      setMessage(t("Please sign in first."));
      return;
    }

    if (!fieldName || !newValue) {
      setMessage(t("Choose a field and enter the corrected information."));
      return;
    }

    setBusy(true);
    setMessage("");

    const { error } = await supabase
      .from("verification_submissions")
      .insert({
        player_id: playerId,
        submitted_by: userId,
        submission_type: "player_update",
        field_name: fieldName,
        new_value: newValue,
        evidence_url: evidenceUrl || null,
        notes: notes || null,
        status: "pending",
      });

    setBusy(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(t("Update submitted for WFM review."));
    setFieldName("");
    setNewValue("");
    setEvidenceUrl("");
    setNotes("");
  };

  return (
    <>
      <div
        style={{
          position: "fixed",
          right: 20,
          bottom: "max(20px, env(safe-area-inset-bottom))",
          zIndex: 50,
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          justifyContent: "flex-end",
        }}
      >
        <button
          onClick={() => {
            setOpen("claim");
            setMessage("");
          }}
          style={{
            border: "1px solid #111",
            background: "#111",
            color: "#fff",
            borderRadius: 9,
            padding: "11px 15px",
            fontSize: 13,
            fontWeight: 700,
            boxShadow: "0 6px 20px rgba(0,0,0,.16)",
          }}
        >
          Claim this profile
        </button>

        <button
          onClick={() => {
            setOpen("update");
            setMessage("");
          }}
          style={{
            border: "1px solid #ccc",
            background: "#fff",
            color: "#111",
            borderRadius: 9,
            padding: "11px 15px",
            fontSize: 13,
            fontWeight: 700,
            boxShadow: "0 6px 20px rgba(0,0,0,.12)",
          }}
        >
          Suggest an update
        </button>
      </div>

      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 60,
            background: "rgba(0,0,0,.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onClick={() => setOpen(null)}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 500,
              maxHeight: "90vh",
              overflowY: "auto",
              background: "#fff",
              borderRadius: 14,
              padding: 24,
              boxShadow: "0 20px 60px rgba(0,0,0,.25)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 20,
                alignItems: "center",
              }}
            >
              <div>
                <h2 style={{ margin: 0, fontSize: 21 }}>
                  {open === "claim"
                    ? t("Claim this player profile")
                    : t("Suggest a profile update")}
                </h2>
                <p
                  style={{
                    margin: "7px 0 0",
                    color: "#777",
                    fontSize: 13,
                    lineHeight: 1.45,
                  }}
                >
                  {open === "claim"
                    ? t("Players, agents and authorized representatives can request profile verification.")
                    : t("Submit a correction with evidence. WFM reviews changes before publishing them.")}
                </p>
              </div>

              <button
                onClick={() => setOpen(null)}
                style={{
                  border: 0,
                  background: "#f3f3f3",
                  borderRadius: 8,
                  width: 34,
                  height: 34,
                  fontSize: 18,
                }}
                aria-label=t("Close")
              >
                ×
              </button>
            </div>

            {!userId ? (
              <div style={{ marginTop: 22 }}>
                <div
                  style={{
                    padding: 14,
                    background: "#f7f7f4",
                    borderRadius: 9,
                    fontSize: 13,
                    lineHeight: 1.5,
                  }}
                >
                  Create an account or sign in with your email and password. Your account lets you submit claims and corrections, but does not automatically verify anything.
                </div>

                <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                  <button
                    onClick={() => setAuthMode("signin")}
                    style={{ flex: 1, padding: 9, border: "1px solid #ccc", borderRadius: 8, background: authMode === "signin" ? "#111" : "#fff", color: authMode === "signin" ? "#fff" : "#111", fontWeight: 700 }}
                  >
                    Sign in
                  </button>
                  <button
                    onClick={() => setAuthMode("signup")}
                    style={{ flex: 1, padding: 9, border: "1px solid #ccc", borderRadius: 8, background: authMode === "signup" ? "#111" : "#fff", color: authMode === "signup" ? "#fff" : "#111", fontWeight: 700 }}
                  >
                    Create account
                  </button>
                </div>

                <label
                  style={{
                    display: "block",
                    marginTop: 18,
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    color: "#777",
                  }}
                >
                  Email
                </label>

                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  placeholder="you@example.com"
                  style={{
                    width: "100%",
                    marginTop: 6,
                    padding: 11,
                    border: "1px solid #ccc",
                    borderRadius: 8,
                    fontSize: 14,
                  }}
                />

                <label style={{ display: "block", marginTop: 14, fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#777" }}>
                  Password
                </label>

                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                  placeholder=t("Create a password")
                  style={{ width: "100%", marginTop: 6, padding: 11, border: "1px solid #ccc", borderRadius: 8, fontSize: 14 }}
                />

                <button
                  onClick={authenticate}
                  disabled={busy || !email || !password}
                  style={{
                    width: "100%",
                    marginTop: 12,
                    padding: 12,
                    border: 0,
                    borderRadius: 8,
                    background: "#111",
                    color: "#fff",
                    fontWeight: 700,
                    opacity: busy || !email || !password ? 0.55 : 1,
                  }}
                >
                  {busy ? (authMode === "signup" ? t("Creating...") : t("Signing in...")) : (authMode === "signup" ? t("Create account") : t("Sign in"))}
                </button>
              </div>
            ) : open === "claim" ? (
              <div style={{ marginTop: 22 }}>
                <div
                  style={{
                    padding: 14,
                    border: "1px solid #e3e3e3",
                    borderRadius: 9,
                    fontSize: 13,
                    lineHeight: 1.5,
                  }}
                >
                  Submit your claim and WFM will review your relationship to
                  this player profile before marking it verified.
                </div>

                <button
                  onClick={claimProfile}
                  disabled={busy}
                  style={{
                    width: "100%",
                    marginTop: 14,
                    padding: 12,
                    border: 0,
                    borderRadius: 8,
                    background: "#111",
                    color: "#fff",
                    fontWeight: 700,
                  }}
                >
                  {busy ? t("Submitting...") : t("Submit profile claim")}
                </button>
              </div>
            ) : (
              <div style={{ marginTop: 22 }}>
                <label style={label}>{t("Information to update")}</label>
                <select
                  value={fieldName}
                  onChange={(event) => setFieldName(event.target.value)}
                  style={input}
                >
                  <option value="">{t("Select a field")}</option>
                  <option value="full_name">{t("Full name")}</option>
                  <option value="date_of_birth">{t("Date of birth")}</option>
                  <option value="nationality">{t("Nationality")}</option>
                  <option value="position">{t("Position")}</option>
                  <option value="secondary_position">{t("Secondary position")}</option>
                  <option value="preferred_foot">{t("Preferred foot")}</option>
                  <option value="height_cm">{t("Height")}</option>
                  <option value="birthplace">{t("Birthplace")}</option>
                  <option value="agency">{t("Agency")}</option>
                  <option value="youth_clubs">{t("Youth clubs")}</option>
                  <option value="current_club_since">{t("Current club since")}</option>
                  <option value="contract">{t("Contract information")}</option>
                  <option value="other">{t("Other")}</option>
                </select>

                <label style={label}>{t("Correct information")}</label>
                <textarea
                  value={newValue}
                  onChange={(event) => setNewValue(event.target.value)}
                  rows={3}
                  placeholder=t("Enter the correct information...")
                  style={input}
                />

                <label style={label}>{t("Evidence URL")}</label>
                <input
                  value={evidenceUrl}
                  onChange={(event) => setEvidenceUrl(event.target.value)}
                  type="url"
                  placeholder="https://..."
                  style={input}
                />

                <label style={label}>{t("Notes")}</label>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={3}
                  placeholder=t("Tell us why this should be changed.")
                  style={input}
                />

                <button
                  onClick={submitUpdate}
                  disabled={busy}
                  style={{
                    width: "100%",
                    marginTop: 14,
                    padding: 12,
                    border: 0,
                    borderRadius: 8,
                    background: "#111",
                    color: "#fff",
                    fontWeight: 700,
                  }}
                >
                  {busy ? t("Submitting...") : t("Submit for review")}
                </button>
              </div>
            )}

            {message && (
              <div
                style={{
                  marginTop: 14,
                  padding: 12,
                  borderRadius: 8,
                  background: "#f3f3f0",
                  fontSize: 12,
                  lineHeight: 1.45,
                }}
              >
                {message}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}


const PLAYER_ACTIONS_COPY: Record<WfmLocale, Record<string, string>> = {
en: {
"Claim this profile": "Claim this profile",
"Suggest an update": "Suggest an update",
"Claim this player profile": "Claim this player profile",
"Suggest a profile update": "Suggest a profile update",
"Players, agents and authorized representatives can request profile verification.": "Players, agents and authorized representatives can request profile verification.",
"Submit a correction with evidence. WFM reviews changes before publishing them.": "Submit a correction with evidence. WFM reviews changes before publishing them.",
"Close": "Close",
"Create an account or sign in with your email and password. Your account lets you submit claims and corrections, but does not automatically verify anything.": "Create an account or sign in with your email and password. Your account lets you submit claims and corrections, but does not automatically verify anything.",
"Sign in": "Sign in",
"Create account": "Create account",
"Email": "Email",
"Password": "Password",
"Create a password": "Create a password",
"Creating...": "Creating...",
"Signing in...": "Signing in...",
"Submit your claim and WFM will review your relationship to this player profile before marking it verified.": "Submit your claim and WFM will review your relationship to this player profile before marking it verified.",
"Submitting...": "Submitting...",
"Submit profile claim": "Submit profile claim",
"Information to update": "Information to update",
"Select a field": "Select a field",
"Full name": "Full name",
"Date of birth": "Date of birth",
"Nationality": "Nationality",
"Position": "Position",
"Secondary position": "Secondary position",
"Preferred foot": "Preferred foot",
"Height": "Height",
"Birthplace": "Birthplace",
"Agency": "Agency",
"Youth clubs": "Youth clubs",
"Current club since": "Current club since",
"Contract information": "Contract information",
"Other": "Other",
"Correct information": "Correct information",
"Enter the correct information...": "Enter the correct information...",
"Evidence URL": "Evidence URL",
"Notes": "Notes",
"Tell us why this should be changed.": "Tell us why this should be changed.",
"Submit for review": "Submit for review",
"Account created. You can now submit your verification request.": "Account created. You can now submit your verification request.",
"Account created. If email confirmation is enabled, check your email before signing in.": "Account created. If email confirmation is enabled, check your email before signing in.",
"Signed in successfully.": "Signed in successfully.",
"Please sign in first.": "Please sign in first.",
"You already submitted a claim for this profile.": "You already submitted a claim for this profile.",
"Claim submitted. WFM will review your verification.": "Claim submitted. WFM will review your verification.",
"Choose a field and enter the corrected information.": "Choose a field and enter the corrected information.",
"Update submitted for WFM review.": "Update submitted for WFM review."
},
es: {
"Claim this profile": "Reclamar este perfil",
"Suggest an update": "Sugerir una actualización",
"Claim this player profile": "Reclamar el perfil de esta jugadora",
"Suggest a profile update": "Sugerir una actualización del perfil",
"Players, agents and authorized representatives can request profile verification.": "Las jugadoras, agentes y representantes autorizados pueden solicitar la verificación del perfil.",
"Submit a correction with evidence. WFM reviews changes before publishing them.": "Envía una corrección con pruebas. WFM revisa los cambios antes de publicarlos.",
"Close": "Cerrar",
"Create an account or sign in with your email and password. Your account lets you submit claims and corrections, but does not automatically verify anything.": "Crea una cuenta o inicia sesión con tu correo y contraseña. Tu cuenta permite enviar solicitudes y correcciones, pero no verifica nada automáticamente.",
"Sign in": "Iniciar sesión",
"Create account": "Crear cuenta",
"Email": "Correo electrónico",
"Password": "Contraseña",
"Create a password": "Crea una contraseña",
"Creating...": "Creando...",
"Signing in...": "Iniciando sesión...",
"Submit your claim and WFM will review your relationship to this player profile before marking it verified.": "Envía tu solicitud y WFM revisará tu relación con este perfil antes de marcarlo como verificado.",
"Submitting...": "Enviando...",
"Submit profile claim": "Enviar solicitud de perfil",
"Information to update": "Información que deseas actualizar",
"Select a field": "Selecciona un campo",
"Full name": "Nombre completo",
"Date of birth": "Fecha de nacimiento",
"Nationality": "Nacionalidad",
"Position": "Posición",
"Secondary position": "Posición secundaria",
"Preferred foot": "Pie preferido",
"Height": "Altura",
"Birthplace": "Lugar de nacimiento",
"Agency": "Representante",
"Youth clubs": "Clubes juveniles",
"Current club since": "Club actual desde",
"Contract information": "Información del contrato",
"Other": "Otro",
"Correct information": "Información correcta",
"Enter the correct information...": "Introduce la información correcta...",
"Evidence URL": "URL de la prueba",
"Notes": "Notas",
"Tell us why this should be changed.": "Explica por qué debe cambiarse.",
"Submit for review": "Enviar para revisión",
"Account created. You can now submit your verification request.": "Cuenta creada. Ya puedes enviar tu solicitud de verificación.",
"Account created. If email confirmation is enabled, check your email before signing in.": "Cuenta creada. Si la confirmación por correo está activada, revisa tu bandeja antes de iniciar sesión.",
"Signed in successfully.": "Sesión iniciada correctamente.",
"Please sign in first.": "Inicia sesión primero.",
"You already submitted a claim for this profile.": "Ya has enviado una solicitud para este perfil.",
"Claim submitted. WFM will review your verification.": "Solicitud enviada. WFM revisará tu verificación.",
"Choose a field and enter the corrected information.": "Selecciona un campo e introduce la información corregida.",
"Update submitted for WFM review.": "Actualización enviada para revisión de WFM."
},
pt: {
"Claim this profile": "Reivindicar este perfil",
"Suggest an update": "Sugerir uma atualização",
"Claim this player profile": "Reivindicar o perfil desta jogadora",
"Suggest a profile update": "Sugerir uma atualização do perfil",
"Players, agents and authorized representatives can request profile verification.": "Jogadoras, agentes e representantes autorizados podem solicitar a verificação do perfil.",
"Submit a correction with evidence. WFM reviews changes before publishing them.": "Envie uma correção com evidências. A WFM analisa as alterações antes de publicá-las.",
"Close": "Fechar",
"Create an account or sign in with your email and password. Your account lets you submit claims and corrections, but does not automatically verify anything.": "Crie uma conta ou entre com seu e-mail e senha. Sua conta permite enviar solicitações e correções, mas não verifica nada automaticamente.",
"Sign in": "Entrar",
"Create account": "Criar conta",
"Email": "E-mail",
"Password": "Senha",
"Create a password": "Crie uma senha",
"Creating...": "Criando...",
"Signing in...": "Entrando...",
"Submit your claim and WFM will review your relationship to this player profile before marking it verified.": "Envie sua solicitação e a WFM analisará sua relação com este perfil antes de marcá-lo como verificado.",
"Submitting...": "Enviando...",
"Submit profile claim": "Enviar solicitação de perfil",
"Information to update": "Informação a atualizar",
"Select a field": "Selecione um campo",
"Full name": "Nome completo",
"Date of birth": "Data de nascimento",
"Nationality": "Nacionalidade",
"Position": "Posição",
"Secondary position": "Posição secundária",
"Preferred foot": "Pé preferido",
"Height": "Altura",
"Birthplace": "Local de nascimento",
"Agency": "Agência",
"Youth clubs": "Clubes de formação",
"Current club since": "Clube atual desde",
"Contract information": "Informações do contrato",
"Other": "Outro",
"Correct information": "Informação correta",
"Enter the correct information...": "Insira a informação correta...",
"Evidence URL": "URL da evidência",
"Notes": "Observações",
"Tell us why this should be changed.": "Explique por que isso deve ser alterado.",
"Submit for review": "Enviar para análise",
"Account created. You can now submit your verification request.": "Conta criada. Agora você pode enviar sua solicitação de verificação.",
"Account created. If email confirmation is enabled, check your email before signing in.": "Conta criada. Se a confirmação por e-mail estiver ativada, verifique sua caixa de entrada antes de entrar.",
"Signed in successfully.": "Login realizado com sucesso.",
"Please sign in first.": "Entre primeiro.",
"You already submitted a claim for this profile.": "Você já enviou uma solicitação para este perfil.",
"Claim submitted. WFM will review your verification.": "Solicitação enviada. A WFM analisará sua verificação.",
"Choose a field and enter the corrected information.": "Selecione um campo e informe os dados corrigidos.",
"Update submitted for WFM review.": "Atualização enviada para análise da WFM."
},
fr: {
"Claim this profile": "Revendiquer ce profil",
"Suggest an update": "Suggérer une modification",
"Claim this player profile": "Revendiquer le profil de cette joueuse",
"Suggest a profile update": "Suggérer une modification du profil",
"Players, agents and authorized representatives can request profile verification.": "Les joueuses, agents et représentants autorisés peuvent demander la vérification du profil.",
"Submit a correction with evidence. WFM reviews changes before publishing them.": "Soumettez une correction avec justificatifs. WFM examine les modifications avant leur publication.",
"Close": "Fermer",
"Create an account or sign in with your email and password. Your account lets you submit claims and corrections, but does not automatically verify anything.": "Créez un compte ou connectez-vous avec votre adresse e-mail et votre mot de passe. Votre compte permet d’envoyer des demandes et des corrections, sans vérification automatique.",
"Sign in": "Se connecter",
"Create account": "Créer un compte",
"Email": "E-mail",
"Password": "Mot de passe",
"Create a password": "Créez un mot de passe",
"Creating...": "Création...",
"Signing in...": "Connexion...",
"Submit your claim and WFM will review your relationship to this player profile before marking it verified.": "Soumettez votre demande ; WFM vérifiera votre lien avec ce profil avant de le marquer comme vérifié.",
"Submitting...": "Envoi...",
"Submit profile claim": "Soumettre la demande de profil",
"Information to update": "Information à modifier",
"Select a field": "Sélectionnez un champ",
"Full name": "Nom complet",
"Date of birth": "Date de naissance",
"Nationality": "Nationalité",
"Position": "Poste",
"Secondary position": "Poste secondaire",
"Preferred foot": "Pied préféré",
"Height": "Taille",
"Birthplace": "Lieu de naissance",
"Agency": "Agence",
"Youth clubs": "Clubs de jeunes",
"Current club since": "Club actuel depuis",
"Contract information": "Informations sur le contrat",
"Other": "Autre",
"Correct information": "Information correcte",
"Enter the correct information...": "Saisissez l’information correcte...",
"Evidence URL": "URL du justificatif",
"Notes": "Notes",
"Tell us why this should be changed.": "Expliquez pourquoi cette information doit être modifiée.",
"Submit for review": "Soumettre pour examen",
"Account created. You can now submit your verification request.": "Compte créé. Vous pouvez maintenant soumettre votre demande de vérification.",
"Account created. If email confirmation is enabled, check your email before signing in.": "Compte créé. Si la confirmation par e-mail est activée, consultez votre boîte de réception avant de vous connecter.",
"Signed in successfully.": "Connexion réussie.",
"Please sign in first.": "Veuillez d’abord vous connecter.",
"You already submitted a claim for this profile.": "Vous avez déjà soumis une demande pour ce profil.",
"Claim submitted. WFM will review your verification.": "Demande envoyée. WFM examinera votre vérification.",
"Choose a field and enter the corrected information.": "Choisissez un champ et saisissez l’information corrigée.",
"Update submitted for WFM review.": "Modification soumise à l’examen de WFM."
},
de: {
"Claim this profile": "Dieses Profil beanspruchen",
"Suggest an update": "Änderung vorschlagen",
"Claim this player profile": "Dieses Spielerinnenprofil beanspruchen",
"Suggest a profile update": "Profiländerung vorschlagen",
"Players, agents and authorized representatives can request profile verification.": "Spielerinnen, Agenten und bevollmächtigte Vertreter können eine Profilverifizierung beantragen.",
"Submit a correction with evidence. WFM reviews changes before publishing them.": "Reiche eine Korrektur mit Nachweisen ein. WFM prüft Änderungen vor der Veröffentlichung.",
"Close": "Schließen",
"Create an account or sign in with your email and password. Your account lets you submit claims and corrections, but does not automatically verify anything.": "Erstelle ein Konto oder melde dich mit E-Mail und Passwort an. Damit kannst du Anfragen und Korrekturen einreichen; eine automatische Verifizierung erfolgt nicht.",
"Sign in": "Anmelden",
"Create account": "Konto erstellen",
"Email": "E-Mail",
"Password": "Passwort",
"Create a password": "Passwort erstellen",
"Creating...": "Wird erstellt...",
"Signing in...": "Anmeldung läuft...",
"Submit your claim and WFM will review your relationship to this player profile before marking it verified.": "Reiche deinen Antrag ein. WFM prüft deine Beziehung zu diesem Profil, bevor es als verifiziert gekennzeichnet wird.",
"Submitting...": "Wird übermittelt...",
"Submit profile claim": "Profilantrag einreichen",
"Information to update": "Zu ändernde Information",
"Select a field": "Feld auswählen",
"Full name": "Vollständiger Name",
"Date of birth": "Geburtsdatum",
"Nationality": "Nationalität",
"Position": "Position",
"Secondary position": "Zweitposition",
"Preferred foot": "Bevorzugter Fuß",
"Height": "Größe",
"Birthplace": "Geburtsort",
"Agency": "Agentur",
"Youth clubs": "Jugendvereine",
"Current club since": "Aktueller Verein seit",
"Contract information": "Vertragsinformationen",
"Other": "Sonstiges",
"Correct information": "Korrekte Information",
"Enter the correct information...": "Korrekte Information eingeben...",
"Evidence URL": "Nachweis-URL",
"Notes": "Notizen",
"Tell us why this should be changed.": "Erkläre, warum dies geändert werden sollte.",
"Submit for review": "Zur Prüfung einreichen",
"Account created. You can now submit your verification request.": "Konto erstellt. Du kannst jetzt deinen Verifizierungsantrag einreichen.",
"Account created. If email confirmation is enabled, check your email before signing in.": "Konto erstellt. Falls die E-Mail-Bestätigung aktiviert ist, prüfe vor der Anmeldung dein Postfach.",
"Signed in successfully.": "Erfolgreich angemeldet.",
"Please sign in first.": "Bitte melde dich zuerst an.",
"You already submitted a claim for this profile.": "Du hast bereits einen Antrag für dieses Profil eingereicht.",
"Claim submitted. WFM will review your verification.": "Antrag eingereicht. WFM prüft deine Verifizierung.",
"Choose a field and enter the corrected information.": "Wähle ein Feld und gib die korrigierten Angaben ein.",
"Update submitted for WFM review.": "Änderung zur Prüfung an WFM übermittelt."
}
};

const label = {
  display: "block",
  marginTop: 14,
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase" as const,
  color: "#777",
};

const input = {
  width: "100%",
  marginTop: 6,
  padding: 11,
  border: "1px solid #ccc",
  borderRadius: 8,
  fontSize: 14,
};
