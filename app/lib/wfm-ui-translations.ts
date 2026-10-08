import type { WfmLocale } from './i18n'

const EN: Record<string,string> = {
  "Add":"Add","ADMIN":"ADMIN","No description":"No description","Optional auth user UUID":"Optional auth user UUID","Optional club UUID":"Optional club UUID","ENTITLEMENTS":"ENTITLEMENTS","records":"records","Club:":"Club:","User:":"User:","Page":"Page","as of":"as of","ends":"ends","compared":"compared","save these candidates to a scouting list":"save these candidates to a scouting list","Select scouting list":"Select scouting list","Sign in to save":"Sign in to save","New List":"New List","Add Compared Players":"Add Compared Players","Description":"Description","Report name":"Report name","2027 CM shortlist comparison":"2027 CM shortlist comparison","Recruitment context or internal purpose.":"Recruitment context or internal purpose.","Report name is required.":"Report name is required.","Saved scouting reports are available inside an active club workspace.":"Saved scouting reports are available inside an active club workspace.","Report saved to the club library.":"Report saved to the club library.","Save report":"Save report","CLUB LIBRARY":"CLUB LIBRARY","Save comparison":"Save comparison","This report is private to active members of your club.":"This report is private to active members of your club.","Delete this scouting profile?":"Delete this scouting profile?","Independent profile":"Independent profile","This profile will be linked to":"This profile will be linked to","The club link provides context for the scouting workflow; it does not determine recruitment criteria or rank candidates.":"The club link provides context for the scouting workflow; it does not determine recruitment criteria or rank candidates.","U23 Central Midfielder":"U23 Central Midfielder","No competition records available.":"No competition records available.","Minimum global peer percentile":"Minimum global peer percentile","450":"450","USA, Colombia, Brazil":"USA, Colombia, Brazil","xG /90":"xG /90","xA /90":"xA /90","Chances created /90":"Chances created /90","Key passes /90":"Key passes /90","Tackles /90":"Tackles /90","Interceptions /90":"Interceptions /90","Progressive carries /90":"Progressive carries /90"
,"Analytics preferences":"Analytics preferences","WFM uses analytics to understand website traffic and improve the site. You can accept or decline analytics tracking.":"WFM uses analytics to understand website traffic and improve the site. You can accept or decline analytics tracking.","Accept analytics":"Accept analytics","Decline":"Decline","Loading visitor activity…":"Loading visitor activity…","WFM ADMIN · VISITOR ACTIVITY":"WFM ADMIN · VISITOR ACTIVITY","Visitor activity":"Visitor activity","First-party activity from visitors who accepted analytics tracking. Signed-in WFM accounts are linked to their internal account profile; anonymous visitors remain anonymous.":"First-party activity from visitors who accepted analytics tracking. Signed-in WFM accounts are linked to their internal account profile; anonymous visitors remain anonymous.","Commercial dashboard":"Commercial dashboard","Homepage":"Homepage","LAST ACTIVITY":"LAST ACTIVITY","Visitor overview":"Visitor overview","Online now":"Online now","Sessions":"Sessions","Signed-in users":"Signed-in users","Anonymous sessions":"Anonymous sessions","WINDOW":"WINDOW","Activity range":"Activity range","Show activity from":"Show activity from","Last hour":"Last hour","Last 6 hours":"Last 6 hours","Last 24 hours":"Last 24 hours","Last 7 days":"Last 7 days","RECENT ACTIVITY":"RECENT ACTIVITY","events":"events","No visitor activity has been recorded in this period.":"No visitor activity has been recorded in this period.","Visitor":"Visitor","Status":"Status","Activity":"Activity","Time":"Time","Anonymous visitor":"Anonymous visitor","Signed in":"Signed in","Anonymous":"Anonymous","Page view":"Page view","Heartbeat":"Heartbeat","Interaction":"Interaction",
  "TODAY'S SALES ACTIONS":"TODAY'S SALES ACTIONS",  "Follow-up intelligence":"Follow-up intelligence",  "Prioritized follow-ups, overdue opportunities, upcoming conversations, and stalled accounts.":"Prioritized follow-ups, overdue opportunities, upcoming conversations, and stalled accounts.",  "Overdue":"Overdue",  "Due today":"Due today",  "Upcoming":"Upcoming",  "Stalled":"Stalled",  "No sales actions need attention right now.":"No sales actions need attention right now.",  "No follow-up date":"No follow-up date",
  "Sources":"Sources","Verified records":"Verified records","Latest source access":"Latest source access",
}
const ES: Record<string,string> = {
  "Add":"Añadir","ADMIN":"ADMIN","No description":"Sin descripción","Optional auth user UUID":"UUID opcional del usuario","Optional club UUID":"UUID opcional del club","ENTITLEMENTS":"PERMISOS","records":"registros","Club:":"Club:","User:":"Usuario:","Page":"Página","as of":"a fecha de","ends":"termina","compared":"comparadas","save these candidates to a scouting list":"guardar estas candidatas en una lista de scouting","Select scouting list":"Seleccionar lista de scouting","Sign in to save":"Inicia sesión para guardar","New List":"Nueva lista","Add Compared Players":"Añadir jugadoras comparadas","Description":"Descripción","Report name":"Nombre del informe","2027 CM shortlist comparison":"comparación de preselección de MC 2027","Recruitment context or internal purpose.":"Contexto de fichaje o propósito interno.","Report name is required.":"El nombre del informe es obligatorio.","Saved scouting reports are available inside an active club workspace.":"Los informes de scouting guardados están disponibles dentro de un espacio de club activo.","Report saved to the club library.":"Informe guardado en la biblioteca del club.","Save report":"Guardar informe","CLUB LIBRARY":"BIBLIOTECA DEL CLUB","Save comparison":"Guardar comparación","This report is private to active members of your club.":"Este informe es privado para los miembros activos de tu club.","Delete this scouting profile?":"¿Eliminar este perfil de scouting?","Independent profile":"Perfil independiente","This profile will be linked to":"Este perfil se vinculará a","The club link provides context for the scouting workflow; it does not determine recruitment criteria or rank candidates.":"El vínculo con el club proporciona contexto para el flujo de scouting; no determina los criterios de fichaje ni clasifica candidatas.","U23 Central Midfielder":"Centrocampista central sub-23","No competition records available.":"No hay registros de competiciones disponibles.","Minimum global peer percentile":"Percentil global mínimo de pares","450":"450","USA, Colombia, Brazil":"EE. UU., Colombia, Brasil","xG /90":"xG /90","xA /90":"xA /90","Chances created /90":"Ocasiones creadas /90","Key passes /90":"Pases clave /90","Tackles /90":"Entradas /90","Interceptions":"Intercepciones","Progressive carries /90":"Conducciones progresivas /90"
,"Analytics preferences":"Preferencias de analítica","WFM uses analytics to understand website traffic and improve the site. You can accept or decline analytics tracking.":"WFM utiliza analítica para comprender el tráfico y mejorar el sitio. Puedes aceptar o rechazar el seguimiento analítico.","Accept analytics":"Aceptar analítica","Decline":"Rechazar","Loading visitor activity…":"Cargando actividad de visitantes…","WFM ADMIN · VISITOR ACTIVITY":"ADMIN WFM · ACTIVIDAD DE VISITANTES","Visitor activity":"Actividad de visitantes","First-party activity from visitors who accepted analytics tracking. Signed-in WFM accounts are linked to their internal account profile; anonymous visitors remain anonymous.":"Actividad propia de visitantes que aceptaron el seguimiento. Las cuentas de WFM con sesión iniciada se vinculan a su perfil interno; los visitantes anónimos permanecen anónimos.","Commercial dashboard":"Panel comercial","Homepage":"Página de inicio","LAST ACTIVITY":"ÚLTIMA ACTIVIDAD","Visitor overview":"Resumen de visitantes","Online now":"En línea ahora","Sessions":"Sesiones","Signed-in users":"Usuarios con sesión","Anonymous sessions":"Sesiones anónimas","WINDOW":"PERÍODO","Activity range":"Rango de actividad","Show activity from":"Mostrar actividad de","Last hour":"Última hora","Last 6 hours":"Últimas 6 horas","Last 24 hours":"Últimas 24 horas","Last 7 days":"Últimos 7 días","RECENT ACTIVITY":"ACTIVIDAD RECIENTE","events":"eventos","No visitor activity has been recorded in this period.":"No se ha registrado actividad de visitantes en este período.","Visitor":"Visitante","Status":"Estado","Activity":"Actividad","Time":"Hora","Anonymous visitor":"Visitante anónimo","Signed in":"Con sesión iniciada","Anonymous":"Anónimo","Page view":"Vista de página","Heartbeat":"Actividad periódica","Interaction":"Interacción",
  "TODAY'S SALES ACTIONS":"ACCIONES DE VENTAS DE HOY",  "Follow-up intelligence":"Inteligencia de seguimiento",  "Prioritized follow-ups, overdue opportunities, upcoming conversations, and stalled accounts.":"Seguimientos prioritarios, oportunidades vencidas, conversaciones próximas y cuentas estancadas.",  "Overdue":"Vencido",  "Due today":"Vence hoy",  "Upcoming":"Próximo",  "Stalled":"Estancado",  "No sales actions need attention right now.":"No hay acciones de ventas que requieran atención ahora.",  "No follow-up date":"Sin fecha de seguimiento",
  "Sources":"Fuentes","Verified records":"Registros verificados","Latest source access":"Último acceso a la fuente",
}
const PT: Record<string,string> = {
  "Add":"Adicionar","ADMIN":"ADMIN","No description":"Sem descrição","Optional auth user UUID":"UUID opcional do usuário","Optional club UUID":"UUID opcional do clube","ENTITLEMENTS":"PERMISSÕES","records":"registros","Club:":"Clube:","User:":"Usuário:","Page":"Página","as of":"em","ends":"termina","compared":"comparadas","save these candidates to a scouting list":"salvar estas candidatas em uma lista de scouting","Select scouting list":"Selecionar lista de scouting","Sign in to save":"Entre para salvar","New List":"Nova lista","Add Compared Players":"Adicionar jogadoras comparadas","Description":"Descrição","Report name":"Nome do relatório","2027 CM shortlist comparison":"comparação de pré-seleção de MC 2027","Recruitment context or internal purpose.":"Contexto de recrutamento ou finalidade interna.","Report name is required.":"O nome do relatório é obrigatório.","Saved scouting reports are available inside an active club workspace.":"Relatórios de scouting salvos estão disponíveis em um espaço de clube ativo.","Report saved to the club library.":"Relatório salvo na biblioteca do clube.","Save report":"Salvar relatório","CLUB LIBRARY":"BIBLIOTECA DO CLUBE","Save comparison":"Salvar comparação","This report is private to active members of your club.":"Este relatório é privado para membros ativos do seu clube.","Delete this scouting profile?":"Excluir este perfil de scouting?","Independent profile":"Perfil independente","This profile will be linked to":"Este perfil será vinculado a","The club link provides context for the scouting workflow; it does not determine recruitment criteria or rank candidates.":"O vínculo do clube fornece contexto para o fluxo de scouting; não determina os critérios de recrutamento nem classifica candidatas.","U23 Central Midfielder":"Meia central sub-23","No competition records available.":"Não há registros de competições disponíveis.","Minimum global peer percentile":"Percentil global mínimo de pares","450":"450","USA, Colombia, Brazil":"EUA, Colômbia, Brasil","xG /90":"xG /90","xA /90":"xA /90","Chances created /90":"Chances criadas /90","Key passes /90":"Passes-chave /90","Tackles /90":"Desarmes /90","Interceptions":"Intercepções","Progressive carries /90":"Conduções progressivas /90"
,"Analytics preferences":"Preferências de análise","WFM uses analytics to understand website traffic and improve the site. You can accept or decline analytics tracking.":"O WFM usa análise para entender o tráfego e melhorar o site. Você pode aceitar ou recusar o rastreamento analítico.","Accept analytics":"Aceitar análise","Decline":"Recusar","Loading visitor activity…":"Carregando atividade dos visitantes…","WFM ADMIN · VISITOR ACTIVITY":"ADMIN WFM · ATIVIDADE DOS VISITANTES","Visitor activity":"Atividade dos visitantes","First-party activity from visitors who accepted analytics tracking. Signed-in WFM accounts are linked to their internal account profile; anonymous visitors remain anonymous.":"Atividade própria de visitantes que aceitaram o rastreamento. Contas WFM autenticadas são vinculadas ao perfil interno; visitantes anônimos permanecem anônimos.","Commercial dashboard":"Painel comercial","Homepage":"Página inicial","LAST ACTIVITY":"ÚLTIMA ATIVIDADE","Visitor overview":"Resumo dos visitantes","Online now":"Online agora","Sessions":"Sessões","Signed-in users":"Usuários autenticados","Anonymous sessions":"Sessões anônimas","WINDOW":"PERÍODO","Activity range":"Intervalo de atividade","Show activity from":"Mostrar atividade de","Last hour":"Última hora","Last 6 hours":"Últimas 6 horas","Last 24 hours":"Últimas 24 horas","Last 7 days":"Últimos 7 dias","RECENT ACTIVITY":"ATIVIDADE RECENTE","events":"eventos","No visitor activity has been recorded in this period.":"Nenhuma atividade de visitantes foi registrada neste período.","Visitor":"Visitante","Status":"Status","Activity":"Atividade","Time":"Hora","Anonymous visitor":"Visitante anônimo","Signed in":"Autenticado","Anonymous":"Anônimo","Page view":"Visualização de página","Heartbeat":"Atividade periódica","Interaction":"Interação",
  "TODAY'S SALES ACTIONS":"AÇÕES DE VENDAS DE HOJE",  "Follow-up intelligence":"Inteligência de acompanhamento",  "Prioritized follow-ups, overdue opportunities, upcoming conversations, and stalled accounts.":"Acompanhamentos prioritários, oportunidades atrasadas, conversas próximas e contas estagnadas.",  "Overdue":"Atrasado",  "Due today":"Vence hoje",  "Upcoming":"Próximo",  "Stalled":"Estagnado",  "No sales actions need attention right now.":"Nenhuma ação de vendas precisa de atenção agora.",  "No follow-up date":"Sem data de acompanhamento",
  "Sources":"Fontes","Verified records":"Registros verificados","Latest source access":"Último acesso à fonte",
}
const FR: Record<string,string> = {
  "Add":"Ajouter","ADMIN":"ADMIN","No description":"Aucune description","Optional auth user UUID":"UUID utilisateur facultatif","Optional club UUID":"UUID club facultatif","ENTITLEMENTS":"AUTORISATIONS","records":"enregistrements","Club:":"Club :","User:":"Utilisateur :","Page":"Page","as of":"au","ends":"se termine","compared":"comparées","save these candidates to a scouting list":"enregistrer ces candidates dans une liste de scouting","Select scouting list":"Sélectionner une liste de scouting","Sign in to save":"Connectez-vous pour enregistrer","New List":"Nouvelle liste","Add Compared Players":"Ajouter les joueuses comparées","Description":"Description","Report name":"Nom du rapport","2027 CM shortlist comparison":"comparaison de présélection MC 2027","Recruitment context or internal purpose.":"Contexte de recrutement ou usage interne.","Report name is required.":"Le nom du rapport est obligatoire.","Saved scouting reports are available inside an active club workspace.":"Les rapports de scouting enregistrés sont disponibles dans un espace club actif.","Report saved to the club library.":"Rapport enregistré dans la bibliothèque du club.","Save report":"Enregistrer le rapport","CLUB LIBRARY":"BIBLIOTHÈQUE DU CLUB","Save comparison":"Enregistrer la comparaison","This report is private to active members of your club.":"Ce rapport est privé aux membres actifs de votre club.","Delete this scouting profile?":"Supprimer ce profil de scouting ?","Independent profile":"Profil indépendant","This profile will be linked to":"Ce profil sera lié à","The club link provides context for the scouting workflow; it does not determine recruitment criteria or rank candidates.":"Le lien du club fournit un contexte au workflow de scouting ; il ne détermine pas les critères de recrutement ni le classement des candidates.","U23 Central Midfielder":"Milieu central U23","No competition records available.":"Aucun enregistrement de compétition disponible.","Minimum global peer percentile":"Percentile global minimal des pairs","450":"450","USA, Colombia, Brazil":"États-Unis, Colombie, Brésil","xG /90":"xG /90","xA /90":"xA /90","Chances created /90":"Occasions créées /90","Key passes /90":"Passes clés /90","Tackles /90":"Tacles /90","Interceptions":"Interceptions","Progressive carries /90":"Conduites progressives /90"
,"Analytics preferences":"Préférences d’analyse","WFM uses analytics to understand website traffic and improve the site. You can accept or decline analytics tracking.":"WFM utilise l’analyse pour comprendre le trafic et améliorer le site. Vous pouvez accepter ou refuser le suivi analytique.","Accept analytics":"Accepter l’analyse","Decline":"Refuser","Loading visitor activity…":"Chargement de l’activité des visiteurs…","WFM ADMIN · VISITOR ACTIVITY":"ADMIN WFM · ACTIVITÉ DES VISITEURS","Visitor activity":"Activité des visiteurs","First-party activity from visitors who accepted analytics tracking. Signed-in WFM accounts are linked to their internal account profile; anonymous visitors remain anonymous.":"Activité propriétaire des visiteurs ayant accepté le suivi. Les comptes WFM connectés sont liés à leur profil interne ; les visiteurs anonymes restent anonymes.","Commercial dashboard":"Tableau de bord commercial","Homepage":"Accueil","LAST ACTIVITY":"DERNIÈRE ACTIVITÉ","Visitor overview":"Vue d’ensemble des visiteurs","Online now":"En ligne maintenant","Sessions":"Sessions","Signed-in users":"Utilisateurs connectés","Anonymous sessions":"Sessions anonymes","WINDOW":"PÉRIODE","Activity range":"Plage d’activité","Show activity from":"Afficher l’activité depuis","Last hour":"Dernière heure","Last 6 hours":"6 dernières heures","Last 24 hours":"24 dernières heures","Last 7 days":"7 derniers jours","RECENT ACTIVITY":"ACTIVITÉ RÉCENTE","events":"événements","No visitor activity has been recorded in this period.":"Aucune activité de visiteur n’a été enregistrée pendant cette période.","Visitor":"Visiteur","Status":"Statut","Activity":"Activité","Time":"Heure","Anonymous visitor":"Visiteur anonyme","Signed in":"Connecté","Anonymous":"Anonyme","Page view":"Vue de page","Heartbeat":"Activité périodique","Interaction":"Interaction",
  "TODAY'S SALES ACTIONS":"ACTIONS COMMERCIALES DU JOUR",  "Follow-up intelligence":"Intelligence de suivi",  "Prioritized follow-ups, overdue opportunities, upcoming conversations, and stalled accounts.":"Suivis prioritaires, opportunités en retard, conversations à venir et comptes en attente.",  "Overdue":"En retard",  "Due today":"À traiter aujourd’hui",  "Upcoming":"À venir",  "Stalled":"En attente",  "No sales actions need attention right now.":"Aucune action commerciale ne nécessite d’attention pour le moment.",  "No follow-up date":"Aucune date de suivi",
  "Sources":"Sources","Verified records":"Enregistrements vérifiés","Latest source access":"Dernier accès à la source",
}
const DE: Record<string,string> = {
  "Add":"Hinzufügen","ADMIN":"ADMIN","No description":"Keine Beschreibung","Optional auth user UUID":"Optionale Auth-Benutzer-UUID","Optional club UUID":"Optionale Club-UUID","ENTITLEMENTS":"BERECHTIGUNGEN","records":"Datensätze","Club:":"Verein:","User:":"Benutzer:","Page":"Seite","as of":"Stand","ends":"endet","compared":"verglichen","save these candidates to a scouting list":"diese Kandidatinnen in einer Scouting-Liste speichern","Select scouting list":"Scouting-Liste auswählen","Sign in to save":"Zum Speichern anmelden","New List":"Neue Liste","Add Compared Players":"Verglichene Spielerinnen hinzufügen","Description":"Beschreibung","Report name":"Berichtsname","2027 CM shortlist comparison":"MC-Vergleich der Vorauswahl 2027","Recruitment context or internal purpose.":"Recruitment-Kontext oder interner Zweck.","Report name is required.":"Der Berichtsname ist erforderlich.","Saved scouting reports are available inside an active club workspace.":"Gespeicherte Scouting-Berichte sind in einem aktiven Vereinsbereich verfügbar.","Report saved to the club library.":"Bericht in der Vereinsbibliothek gespeichert.","Save report":"Bericht speichern","CLUB LIBRARY":"VEREINSBIBLIOTHEK","Save comparison":"Vergleich speichern","This report is private to active members of your club.":"Dieser Bericht ist nur für aktive Mitglieder Ihres Vereins sichtbar.","Delete this scouting profile?":"Dieses Scouting-Profil löschen?","Independent profile":"Unabhängiges Profil","This profile will be linked to":"Dieses Profil wird verknüpft mit","The club link provides context for the scouting workflow; it does not determine recruitment criteria or rank candidates.":"Die Vereinsverknüpfung liefert Kontext für den Scouting-Workflow; sie bestimmt weder die Recruiting-Kriterien noch die Rangfolge der Kandidatinnen.","U23 Central Midfielder":"Zentrales Mittelfeld U23","No competition records available.":"Keine Wettbewerbsdaten verfügbar.","Minimum global peer percentile":"Minimales globales Peer-Perzentil","450":"450","USA, Colombia, Brazil":"USA, Kolumbien, Brasilien","xG /90":"xG /90","xA /90":"xA /90","Chances created /90":"Erschaffene Chancen /90","Key passes /90":"Schlüsselpässe /90","Tackles /90":"Tacklings /90","Interceptions":"Abfangen","Progressive carries /90":"Progressive Ballvorträge /90"
,"Analytics preferences":"Analyse-Einstellungen","WFM uses analytics to understand website traffic and improve the site. You can accept or decline analytics tracking.":"WFM verwendet Analysen, um den Website-Traffic zu verstehen und die Website zu verbessern. Sie können das Analyse-Tracking akzeptieren oder ablehnen.","Accept analytics":"Analyse akzeptieren","Decline":"Ablehnen","Loading visitor activity…":"Besucheraktivität wird geladen…","WFM ADMIN · VISITOR ACTIVITY":"WFM ADMIN · BESUCHERAKTIVITÄT","Visitor activity":"Besucheraktivität","First-party activity from visitors who accepted analytics tracking. Signed-in WFM accounts are linked to their internal account profile; anonymous visitors remain anonymous.":"Eigene Aktivitätsdaten von Besuchern, die dem Analyse-Tracking zugestimmt haben. Angemeldete WFM-Konten werden mit ihrem internen Profil verknüpft; anonyme Besucher bleiben anonym.","Commercial dashboard":"Kommerzielles Dashboard","Homepage":"Startseite","LAST ACTIVITY":"LETZTE AKTIVITÄT","Visitor overview":"Besucherübersicht","Online now":"Jetzt online","Sessions":"Sitzungen","Signed-in users":"Angemeldete Benutzer","Anonymous sessions":"Anonyme Sitzungen","WINDOW":"ZEITRAUM","Activity range":"Aktivitätszeitraum","Show activity from":"Aktivität anzeigen von","Last hour":"Letzte Stunde","Last 6 hours":"Letzte 6 Stunden","Last 24 hours":"Letzte 24 Stunden","Last 7 days":"Letzte 7 Tage","RECENT ACTIVITY":"AKTUELLE AKTIVITÄT","events":"Ereignisse","No visitor activity has been recorded in this period.":"In diesem Zeitraum wurde keine Besucheraktivität erfasst.","Visitor":"Besucher","Status":"Status","Activity":"Aktivität","Time":"Zeit","Anonymous visitor":"Anonymer Besucher","Signed in":"Angemeldet","Anonymous":"Anonym","Page view":"Seitenaufruf","Heartbeat":"Aktivitätsimpuls","Interaction":"Interaktion",
  "TODAY'S SALES ACTIONS":"HEUTIGE VERTRIEBSAUFGABEN",  "Follow-up intelligence":"Follow-up-Intelligenz",  "Prioritized follow-ups, overdue opportunities, upcoming conversations, and stalled accounts.":"Priorisierte Nachfassaktionen, überfällige Chancen, bevorstehende Gespräche und stagnierende Accounts.",  "Overdue":"Überfällig",  "Due today":"Heute fällig",  "Upcoming":"Bevorstehend",  "Stalled":"Stagnierend",  "No sales actions need attention right now.":"Derzeit benötigen keine Vertriebsaktionen Aufmerksamkeit.",  "No follow-up date":"Kein Follow-up-Datum",
}

Object.assign(EN, {
  "Data verification audit":"Data verification audit",
  "PRODUCT ACTIVITY":"PRODUCT ACTIVITY",
  "WFM feature usage":"WFM feature usage",
  "Player views":"Player views",
  "Club views":"Club views",
  "Searches":"Searches",
  "Contract views":"Contract views",
  "Transfer views":"Transfer views",
  "Salary views":"Salary views",
  "Scouting views":"Scouting views",
  "MOST VIEWED":"MOST VIEWED",
  "Players and clubs":"Players and clubs",
  "No semantic product activity yet.":"No semantic product activity yet.",
  "ago":"ago",
  "WFM ADMIN · ANALYTICS COMMAND CENTER":"WFM ADMIN · ANALYTICS COMMAND CENTER",
  "Refresh":"Refresh",
  "LIVE NOW":"LIVE NOW",
  "Events":"Events",
  "TOP ACTIVITY":"TOP ACTIVITY",
  "Most viewed pages":"Most viewed pages",
  "No page views in this period.":"No page views in this period.",
  "IDENTIFIED USERS":"IDENTIFIED USERS",
  "Signed-in activity":"Signed-in activity",
  "No signed-in activity in this period.":"No signed-in activity in this period.",
  "WFM account":"WFM account",
  "pages":"pages",
  "VISITORS":"VISITORS",
  "sessions":"sessions",
  "Pages":"Pages",
  "Last page":"Last page",
  "Last active":"Last active",
  "Online":"Online",
  "SESSION DETAIL":"SESSION DETAIL",
  "Signed-in visitor":"Signed-in visitor",
  "First seen":"First seen",
  "unique pages":"unique pages",
  "Close":"Close"
})
Object.assign(ES, {
  "Data verification audit":"Auditoría de verificación de datos",
  "PRODUCT ACTIVITY":"ACTIVIDAD DEL PRODUCTO",
  "WFM feature usage":"Uso de funciones de WFM",
  "Player views":"Vistas de jugadoras",
  "Club views":"Vistas de clubes",
  "Searches":"Búsquedas",
  "Contract views":"Vistas de contratos",
  "Transfer views":"Vistas de transferencias",
  "Salary views":"Vistas de salarios",
  "Scouting views":"Vistas de scouting",
  "MOST VIEWED":"MÁS VISTOS",
  "Players and clubs":"Jugadoras y clubes",
  "No semantic product activity yet.":"Aún no hay actividad semántica del producto.",
  "ago":"hace",
  "WFM ADMIN · ANALYTICS COMMAND CENTER":"ADMIN WFM · CENTRO DE ANALÍTICA",
  "Refresh":"Actualizar",
  "LIVE NOW":"EN VIVO AHORA",
  "Events":"Eventos",
  "TOP ACTIVITY":"ACTIVIDAD PRINCIPAL",
  "Most viewed pages":"Páginas más vistas",
  "No page views in this period.":"No hay vistas de página en este período.",
  "IDENTIFIED USERS":"USUARIOS IDENTIFICADOS",
  "Signed-in activity":"Actividad de usuarios con sesión",
  "No signed-in activity in this period.":"No hay actividad de usuarios con sesión en este período.",
  "WFM account":"Cuenta WFM",
  "pages":"páginas",
  "VISITORS":"VISITANTES",
  "sessions":"sesiones",
  "Pages":"Páginas",
  "Last page":"Última página",
  "Last active":"Última actividad",
  "Online":"En línea",
  "SESSION DETAIL":"DETALLE DE SESIÓN",
  "Signed-in visitor":"Visitante con sesión",
  "First seen":"Primera visita",
  "unique pages":"páginas únicas",
  "Close":"Cerrar"
})
Object.assign(PT, {
  "Data verification audit":"Auditoria de verificação de dados",
  "PRODUCT ACTIVITY":"ATIVIDADE DO PRODUTO",
  "WFM feature usage":"Uso de recursos do WFM",
  "Player views":"Visualizações de jogadoras",
  "Club views":"Visualizações de clubes",
  "Searches":"Pesquisas",
  "Contract views":"Visualizações de contratos",
  "Transfer views":"Visualizações de transferências",
  "Salary views":"Visualizações de salários",
  "Scouting views":"Visualizações de scouting",
  "MOST VIEWED":"MAIS VISTOS",
  "Players and clubs":"Jogadoras e clubes",
  "No semantic product activity yet.":"Ainda não há atividade semântica do produto.",
  "ago":"atrás",
  "WFM ADMIN · ANALYTICS COMMAND CENTER":"ADMIN WFM · CENTRAL DE ANÁLISES",
  "Refresh":"Atualizar",
  "LIVE NOW":"AO VIVO AGORA",
  "Events":"Eventos",
  "TOP ACTIVITY":"ATIVIDADE PRINCIPAL",
  "Most viewed pages":"Páginas mais visitadas",
  "No page views in this period.":"Nenhuma visualização de página neste período.",
  "IDENTIFIED USERS":"USUÁRIOS IDENTIFICADOS",
  "Signed-in activity":"Atividade de usuários autenticados",
  "No signed-in activity in this period.":"Nenhuma atividade de usuários autenticados neste período.",
  "WFM account":"Conta WFM",
  "pages":"páginas",
  "VISITORS":"VISITANTES",
  "sessions":"sessões",
  "Pages":"Páginas",
  "Last page":"Última página",
  "Last active":"Última atividade",
  "Online":"Online",
  "SESSION DETAIL":"DETALHES DA SESSÃO",
  "Signed-in visitor":"Visitante autenticado",
  "First seen":"Primeira visita",
  "unique pages":"páginas únicas",
  "Close":"Fechar"
})
Object.assign(FR, {
  "Data verification audit":"Audit de vérification des données",
  "PRODUCT ACTIVITY":"ACTIVITÉ PRODUIT",
  "WFM feature usage":"Utilisation des fonctionnalités WFM",
  "Player views":"Vues des joueuses",
  "Club views":"Vues des clubs",
  "Searches":"Recherches",
  "Contract views":"Vues des contrats",
  "Transfer views":"Vues des transferts",
  "Salary views":"Vues des salaires",
  "Scouting views":"Vues du scouting",
  "MOST VIEWED":"LES PLUS CONSULTÉS",
  "Players and clubs":"Joueuses et clubs",
  "No semantic product activity yet.":"Aucune activité produit sémantique pour le moment.",
  "ago":"il y a",
  "WFM ADMIN · ANALYTICS COMMAND CENTER":"ADMIN WFM · CENTRE D’ANALYSE",
  "Refresh":"Actualiser",
  "LIVE NOW":"EN DIRECT",
  "Events":"Événements",
  "TOP ACTIVITY":"ACTIVITÉ PRINCIPALE",
  "Most viewed pages":"Pages les plus consultées",
  "No page views in this period.":"Aucune vue de page pendant cette période.",
  "IDENTIFIED USERS":"UTILISATEURS IDENTIFIÉS",
  "Signed-in activity":"Activité des utilisateurs connectés",
  "No signed-in activity in this period.":"Aucune activité d’utilisateur connecté pendant cette période.",
  "WFM account":"Compte WFM",
  "pages":"pages",
  "VISITORS":"VISITEURS",
  "sessions":"sessions",
  "Pages":"Pages",
  "Last page":"Dernière page",
  "Last active":"Dernière activité",
  "Online":"En ligne",
  "SESSION DETAIL":"DÉTAIL DE SESSION",
  "Signed-in visitor":"Visiteur connecté",
  "First seen":"Première visite",
  "unique pages":"pages uniques",
  "Close":"Fermer"
})
Object.assign(DE, {
  "Data verification audit":"Datenverifizierungsprüfung",
  "PRODUCT ACTIVITY":"PRODUKTAKTIVITÄT",
  "WFM feature usage":"Nutzung der WFM-Funktionen",
  "Player views":"Spielerinnen-Aufrufe",
  "Club views":"Vereinsaufrufe",
  "Searches":"Suchen",
  "Contract views":"Vertragsaufrufe",
  "Transfer views":"Transferaufrufe",
  "Salary views":"Gehaltsaufrufe",
  "Scouting views":"Scouting-Aufrufe",
  "MOST VIEWED":"AM MEISTEN ANGESEHEN",
  "Players and clubs":"Spielerinnen und Vereine",
  "No semantic product activity yet.":"Noch keine semantischen Produktaktivitäten.",
  "ago":"her",
  "WFM ADMIN · ANALYTICS COMMAND CENTER":"WFM ADMIN · ANALYTICS-CENTER",
  "Refresh":"Aktualisieren",
  "LIVE NOW":"JETZT LIVE",
  "Events":"Ereignisse",
  "TOP ACTIVITY":"TOP-AKTIVITÄT",
  "Most viewed pages":"Meistbesuchte Seiten",
  "No page views in this period.":"Keine Seitenaufrufe in diesem Zeitraum.",
  "IDENTIFIED USERS":"IDENTIFIZIERTE BENUTZER",
  "Signed-in activity":"Aktivität angemeldeter Benutzer",
  "No signed-in activity in this period.":"Keine Aktivität angemeldeter Benutzer in diesem Zeitraum.",
  "WFM account":"WFM-Konto",
  "pages":"Seiten",
  "VISITORS":"BESUCHER",
  "sessions":"Sitzungen",
  "Pages":"Seiten",
  "Last page":"Letzte Seite",
  "Last active":"Zuletzt aktiv",
  "Online":"Online",
  "SESSION DETAIL":"SITZUNGSDETAILS",
  "Signed-in visitor":"Angemeldeter Besucher",
  "First seen":"Erstmals gesehen",
  "unique pages":"einzigartige Seiten",
  "Close":"Schließen"
})

Object.assign(EN, {
  "FUNNEL":"FUNNEL","Visitor to scouting funnel":"Visitor to scouting funnel","Visitors":"Visitors","Player searches":"Player searches","Signed up or logged in":"Signed up or logged in","Scouting activity":"Scouting activity","ENGAGEMENT":"ENGAGEMENT","Returning and active users":"Returning and active users","Returning signed-in users":"Returning signed-in users","Avg events / session":"Avg events / session","Active locales":"Active locales","TRENDS":"TRENDS","Activity over time":"Activity over time","No activity trend data in this period.":"No activity trend data in this period."
})
Object.assign(ES, {
  "FUNNEL":"EMBUDO","Visitor to scouting funnel":"Embudo de visitante a scouting","Visitors":"Visitantes","Player searches":"Búsquedas de jugadoras","Signed up or logged in":"Registro o inicio de sesión","Scouting activity":"Actividad de scouting","ENGAGEMENT":"PARTICIPACIÓN","Returning and active users":"Usuarios recurrentes y activos","Returning signed-in users":"Usuarios recurrentes con sesión","Avg events / session":"Prom. eventos / sesión","Active locales":"Idiomas activos","TRENDS":"TENDENCIAS","Activity over time":"Actividad a lo largo del tiempo","No activity trend data in this period.":"No hay datos de tendencias de actividad en este período."
})
Object.assign(PT, {
  "FUNNEL":"FUNIL","Visitor to scouting funnel":"Funil de visitante até scouting","Visitors":"Visitantes","Player searches":"Pesquisas de jogadoras","Signed up or logged in":"Cadastro ou login","Scouting activity":"Atividade de scouting","ENGAGEMENT":"ENGAJAMENTO","Returning and active users":"Usuários recorrentes e ativos","Returning signed-in users":"Usuários autenticados recorrentes","Avg events / session":"Média de eventos / sessão","Active locales":"Idiomas ativos","TRENDS":"TENDÊNCIAS","Activity over time":"Atividade ao longo do tempo","No activity trend data in this period.":"Não há dados de tendência de atividade neste período."
})
Object.assign(FR, {
  "FUNNEL":"ENTONNOIR","Visitor to scouting funnel":"Entonnoir visiteur vers scouting","Visitors":"Visiteurs","Player searches":"Recherches de joueuses","Signed up or logged in":"Inscription ou connexion","Scouting activity":"Activité de scouting","ENGAGEMENT":"ENGAGEMENT","Returning and active users":"Utilisateurs actifs et récurrents","Returning signed-in users":"Utilisateurs connectés récurrents","Avg events / session":"Moy. événements / session","Active locales":"Langues actives","TRENDS":"TENDANCES","Activity over time":"Activité dans le temps","No activity trend data in this period.":"Aucune donnée de tendance d’activité pour cette période."
})
Object.assign(DE, {
  "FUNNEL":"TRICHTER","Visitor to scouting funnel":"Trichter von Besuchern zu Scouting","Visitors":"Besucher","Player searches":"Spielerinnen-Suchen","Signed up or logged in":"Registrierung oder Anmeldung","Scouting activity":"Scouting-Aktivität","ENGAGEMENT":"ENGAGEMENT","Returning and active users":"Wiederkehrende und aktive Benutzer","Returning signed-in users":"Wiederkehrende angemeldete Benutzer","Avg events / session":"Ø Ereignisse / Sitzung","Active locales":"Aktive Sprachen","TRENDS":"TRENDS","Activity over time":"Aktivität im Zeitverlauf","No activity trend data in this period.":"Keine Trenddaten zur Aktivität in diesem Zeitraum."
})

Object.assign(EN, {"Analytics command center":"Analytics command center","WFM administrator":"WFM administrator","Refreshing…":"Refreshing…","Updated":"Updated"})
Object.assign(ES, {"Analytics command center":"Centro de analítica","WFM administrator":"Administrador WFM","Refreshing…":"Actualizando…","Updated":"Actualizado"})
Object.assign(PT, {"Analytics command center":"Central de análises","WFM administrator":"Administrador WFM","Refreshing…":"Atualizando…","Updated":"Atualizado"})
Object.assign(FR, {"Analytics command center":"Centre d’analyse","WFM administrator":"Administrateur WFM","Refreshing…":"Actualisation…","Updated":"Mis à jour"})
Object.assign(DE, {"Analytics command center":"Analytics-Center","WFM administrator":"WFM-Administrator","Refreshing…":"Wird aktualisiert…","Updated":"Aktualisiert"})


Object.assign(EN, {"COMMERCIAL INTELLIGENCE":"COMMERCIAL INTELLIGENCE","Account usage":"Account usage","Signed-in account activity from the last 7 days, grouped for commercial planning. Anonymous traffic is excluded.":"Signed-in account activity from the last 7 days, grouped for commercial planning. Anonymous traffic is excluded.","No signed-in account activity yet.":"No signed-in account activity yet.","Unclassified account":"Unclassified account","scouting actions":"scouting actions","ACCOUNT MIX":"ACCOUNT MIX","Usage by account type":"Usage by account type","No account activity yet.":"No account activity yet."})
Object.assign(ES, {"COMMERCIAL INTELLIGENCE":"INTELIGENCIA COMERCIAL","Account usage":"Uso por cuenta","Signed-in account activity from the last 7 days, grouped for commercial planning. Anonymous traffic is excluded.":"Actividad de cuentas con sesión de los últimos 7 días, agrupada para planificación comercial. Se excluye el tráfico anónimo.","No signed-in account activity yet.":"Aún no hay actividad de cuentas con sesión.","Unclassified account":"Cuenta sin clasificar","scouting actions":"acciones de scouting","ACCOUNT MIX":"TIPOS DE CUENTA","Usage by account type":"Uso por tipo de cuenta","No account activity yet.":"Aún no hay actividad de cuentas."})
Object.assign(PT, {"COMMERCIAL INTELLIGENCE":"INTELIGÊNCIA COMERCIAL","Account usage":"Uso por conta","Signed-in account activity from the last 7 days, grouped for commercial planning. Anonymous traffic is excluded.":"Atividade de contas autenticadas dos últimos 7 dias, agrupada para planejamento comercial. O tráfego anônimo é excluído.","No signed-in account activity yet.":"Ainda não há atividade de contas autenticadas.","Unclassified account":"Conta não classificada","scouting actions":"ações de scouting","ACCOUNT MIX":"TIPOS DE CONTA","Usage by account type":"Uso por tipo de conta","No account activity yet.":"Ainda não há atividade de contas."})
Object.assign(FR, {"COMMERCIAL INTELLIGENCE":"INTELLIGENCE COMMERCIALE","Account usage":"Utilisation par compte","Signed-in account activity from the last 7 days, grouped for commercial planning. Anonymous traffic is excluded.":"Activité des comptes connectés sur les 7 derniers jours, regroupée pour la planification commerciale. Le trafic anonyme est exclu.","No signed-in account activity yet.":"Aucune activité de compte connecté pour le moment.","Unclassified account":"Compte non classé","scouting actions":"actions de scouting","ACCOUNT MIX":"RÉPARTITION DES COMPTES","Usage by account type":"Utilisation par type de compte","No account activity yet.":"Aucune activité de compte pour le moment."})
Object.assign(DE, {"COMMERCIAL INTELLIGENCE":"KOMMERZIELLE INTELLIGENZ","Account usage":"Kontonutzung","Signed-in account activity from the last 7 days, grouped for commercial planning. Anonymous traffic is excluded.":"Aktivität angemeldeter Konten der letzten 7 Tage, für die kommerzielle Planung gruppiert. Anonymer Traffic ist ausgeschlossen.","No signed-in account activity yet.":"Noch keine Aktivität angemeldeter Konten.","Unclassified account":"Nicht klassifiziertes Konto","scouting actions":"Scouting-Aktionen","ACCOUNT MIX":"KONTOMIX","Usage by account type":"Nutzung nach Kontotyp","No account activity yet.":"Noch keine Kontoaktivität."})

Object.assign(EN, {"Lead score":"Lead score","High priority":"High priority","Warm lead":"Warm lead","Early lead":"Early lead"})
Object.assign(ES, {"Lead score":"Puntuación de lead","High priority":"Alta prioridad","Warm lead":"Lead cálido","Early lead":"Lead inicial"})
Object.assign(PT, {"Lead score":"Pontuação do lead","High priority":"Alta prioridade","Warm lead":"Lead aquecido","Early lead":"Lead inicial"})
Object.assign(FR, {"Lead score":"Score du prospect","High priority":"Priorité élevée","Warm lead":"Prospect qualifié","Early lead":"Prospect initial"})
Object.assign(DE, {"Lead score":"Lead-Score","High priority":"Hohe Priorität","Warm lead":"Warmer Lead","Early lead":"Früher Lead"})

Object.assign(EN, {"Last active":"Last active"})
Object.assign(ES, {"Last active":"Última actividad"})
Object.assign(PT, {"Last active":"Última atividade"})
Object.assign(FR, {"Last active":"Dernière activité"})
Object.assign(DE, {"Last active":"Letzte Aktivität"})

Object.assign(EN, {
  "SALES PIPELINE":"SALES PIPELINE","Opportunity tiers":"Opportunity tiers","Accounts are ranked using WFM engagement, active commercial access, and linked club or agency profile data.":"Accounts are ranked using WFM engagement, active commercial access, and linked club or agency profile data.","High-value":"High-value","Warm":"Warm","Prospect":"Prospect","Free":"Free","Club profile":"Club profile","Agency profile":"Agency profile","Access plan":"Access plan","No active commercial plan":"No active commercial plan"
})
Object.assign(ES, {
  "SALES PIPELINE":"EMBUDO COMERCIAL","Opportunity tiers":"Niveles de oportunidad","Accounts are ranked using WFM engagement, active commercial access, and linked club or agency profile data.":"Las cuentas se clasifican según su actividad en WFM, acceso comercial activo y perfiles vinculados de clubes o agencias.","High-value":"Alto valor","Warm":"Cálido","Prospect":"Prospecto","Free":"Gratis","Club profile":"Perfil del club","Agency profile":"Perfil de la agencia","Access plan":"Plan de acceso","No active commercial plan":"Sin plan comercial activo"
})
Object.assign(PT, {
  "SALES PIPELINE":"PIPELINE COMERCIAL","Opportunity tiers":"Níveis de oportunidade","Accounts are ranked using WFM engagement, active commercial access, and linked club or agency profile data.":"As contas são classificadas pelo engajamento no WFM, acesso comercial ativo e perfis vinculados de clubes ou agências.","High-value":"Alto valor","Warm":"Aquecido","Prospect":"Prospecto","Free":"Grátis","Club profile":"Perfil do clube","Agency profile":"Perfil da agência","Access plan":"Plano de acesso","No active commercial plan":"Sem plano comercial ativo"
})
Object.assign(FR, {
  "SALES PIPELINE":"PIPELINE COMMERCIAL","Opportunity tiers":"Niveaux d’opportunité","Accounts are ranked using WFM engagement, active commercial access, and linked club or agency profile data.":"Les comptes sont classés selon leur engagement WFM, leur accès commercial actif et les profils de clubs ou d’agences associés.","High-value":"Forte valeur","Warm":"Prospect chaud","Prospect":"Prospect","Free":"Gratuit","Club profile":"Profil du club","Agency profile":"Profil de l’agence","Access plan":"Plan d’accès","No active commercial plan":"Aucun plan commercial actif"
})
Object.assign(DE, {
  "SALES PIPELINE":"VERTRIEBSPROZESS","Opportunity tiers":"Chancenstufen","Accounts are ranked using WFM engagement, active commercial access, and linked club or agency profile data.":"Konten werden anhand der WFM-Nutzung, des aktiven kommerziellen Zugangs und verknüpfter Vereins- oder Agenturprofile bewertet.","High-value":"Hoher Wert","Warm":"Warm","Prospect":"Interessent","Free":"Kostenlos","Club profile":"Vereinsprofil","Agency profile":"Agenturprofil","Access plan":"Zugangsplan","No active commercial plan":"Kein aktiver kommerzieller Plan"
})


Object.assign(EN, {"Recommended action":"Recommended action","Schedule renewal or expansion conversation":"Schedule renewal or expansion conversation","Contact for premium commercial discussion":"Contact for premium commercial discussion","Offer a scouting or data upgrade":"Offer a scouting or data upgrade","Start a club or agency sales conversation":"Start a club or agency sales conversation","Introduce WFM commercial plans":"Introduce WFM commercial plans","Nurture with product education":"Nurture with product education","Monitor engagement":"Monitor engagement"})
Object.assign(ES, {"Recommended action":"Acción recomendada","Schedule renewal or expansion conversation":"Programar conversación de renovación o expansión","Contact for premium commercial discussion":"Contactar para una conversación comercial premium","Offer a scouting or data upgrade":"Ofrecer una mejora de scouting o datos","Start a club or agency sales conversation":"Iniciar una conversación comercial con el club o la agencia","Introduce WFM commercial plans":"Presentar los planes comerciales de WFM","Nurture with product education":"Mantener la relación con educación sobre el producto","Monitor engagement":"Monitorear la actividad"})
Object.assign(PT, {"Recommended action":"Ação recomendada","Schedule renewal or expansion conversation":"Agendar conversa de renovação ou expansão","Contact for premium commercial discussion":"Contatar para uma conversa comercial premium","Offer a scouting or data upgrade":"Oferecer upgrade de scouting ou dados","Start a club or agency sales conversation":"Iniciar conversa comercial com o clube ou a agência","Introduce WFM commercial plans":"Apresentar os planos comerciais do WFM","Nurture with product education":"Manter relacionamento com educação sobre o produto","Monitor engagement":"Monitorar o engajamento"})
Object.assign(FR, {"Recommended action":"Action recommandée","Schedule renewal or expansion conversation":"Planifier une conversation de renouvellement ou d’extension","Contact for premium commercial discussion":"Contacter pour une discussion commerciale premium","Offer a scouting or data upgrade":"Proposer une extension scouting ou données","Start a club or agency sales conversation":"Lancer une conversation commerciale avec le club ou l’agence","Introduce WFM commercial plans":"Présenter les offres commerciales WFM","Nurture with product education":"Entretenir le prospect avec du contenu produit","Monitor engagement":"Surveiller l’engagement"})
Object.assign(DE, {"Recommended action":"Empfohlene Aktion","Schedule renewal or expansion conversation":"Gespräch über Verlängerung oder Ausbau planen","Contact for premium commercial discussion":"Kontakt für ein Premium-Gespräch aufnehmen","Offer a scouting or data upgrade":"Scouting- oder Daten-Upgrade anbieten","Start a club or agency sales conversation":"Vertriebsgespräch mit Verein oder Agentur starten","Introduce WFM commercial plans":"WFM-Geschäftsmodelle vorstellen","Nurture with product education":"Mit Produktinformationen weiterentwickeln","Monitor engagement":"Aktivität beobachten"})


Object.assign(EN, {"View opportunity":"View opportunity","OPPORTUNITY DETAIL":"OPPORTUNITY DETAIL","Opportunity detail":"Opportunity detail","Close opportunity":"Close opportunity","Opportunity tier":"Opportunity tier","Events":"Events","Unique pages":"Unique pages","No linked club profile":"No linked club profile","No linked agency profile":"No linked agency profile","Verification status unavailable":"Verification status unavailable","Activity history":"Activity history","No recent activity.":"No recent activity."})
Object.assign(ES, {"View opportunity":"Ver oportunidad","OPPORTUNITY DETAIL":"DETALLE DE OPORTUNIDAD","Opportunity detail":"Detalle de oportunidad","Close opportunity":"Cerrar oportunidad","Opportunity tier":"Nivel de oportunidad","Events":"Eventos","Unique pages":"Páginas únicas","No linked club profile":"Sin perfil de club vinculado","No linked agency profile":"Sin perfil de agencia vinculado","Verification status unavailable":"Estado de verificación no disponible","Activity history":"Historial de actividad","No recent activity.":"No hay actividad reciente."})
Object.assign(PT, {"View opportunity":"Ver oportunidade","OPPORTUNITY DETAIL":"DETALHE DA OPORTUNIDADE","Opportunity detail":"Detalhes da oportunidade","Close opportunity":"Fechar oportunidade","Opportunity tier":"Nível de oportunidade","Events":"Eventos","Unique pages":"Páginas únicas","No linked club profile":"Nenhum perfil de clube vinculado","No linked agency profile":"Nenhum perfil de agência vinculado","Verification status unavailable":"Status de verificação indisponível","Activity history":"Histórico de atividade","No recent activity.":"Nenhuma atividade recente."})
Object.assign(FR, {"View opportunity":"Voir l’opportunité","OPPORTUNITY DETAIL":"DÉTAIL DE L’OPPORTUNITÉ","Opportunity detail":"Détail de l’opportunité","Close opportunity":"Fermer l’opportunité","Opportunity tier":"Niveau d’opportunité","Events":"Événements","Unique pages":"Pages uniques","No linked club profile":"Aucun profil de club associé","No linked agency profile":"Aucun profil d’agence associé","Verification status unavailable":"Statut de vérification indisponible","Activity history":"Historique d’activité","No recent activity.":"Aucune activité récente."})
Object.assign(DE, {"View opportunity":"Chance ansehen","OPPORTUNITY DETAIL":"CHANCENDETAILS","Opportunity detail":"Chancendetails","Close opportunity":"Chance schließen","Opportunity tier":"Chancenstufe","Events":"Ereignisse","Unique pages":"Eindeutige Seiten","No linked club profile":"Kein verknüpftes Vereinsprofil","No linked agency profile":"Kein verknüpftes Agenturprofil","Verification status unavailable":"Verifizierungsstatus nicht verfügbar","Activity history":"Aktivitätsverlauf","No recent activity.":"Keine aktuelle Aktivität.", "Sources":"Quellen","Verified records":"Verifizierte Datensätze","Latest source access":"Letzter Quellenzugriff",
})


Object.assign(EN, {
  "WOMEN’S FOOTBALL MARKET":"WOMEN’S FOOTBALL MARKET",
  "A connected view of clubs, leagues, rosters, compensation, market values, and transfer activity.":"A connected view of clubs, leagues, rosters, compensation, market values, and transfer activity.",
  "ACTIVE PLAYERS":"ACTIVE PLAYERS","WITH SALARY DATA":"WITH SALARY DATA","WITH MARKET VALUES":"WITH MARKET VALUES",
  "Loading clubs…":"Loading clubs…","clubs shown":"clubs shown","All competitions":"All competitions","All seasons":"All seasons","All countries":"All countries","All types":"All types",
  "Name":"Name","Roster":"Roster","Payroll":"Payroll","Market value":"Market value","Club":"Club","Competition":"Competition","Country":"Country","Active roster":"Active roster","Known payroll":"Known payroll","Squad market value":"Squad market value","Transfers":"Transfers","Unknown":"Unknown",
  "LIVE DATABASE":"LIVE DATABASE",
  "Comparable player compensation with normalized USD values, original currency context, and confidence attached to every record.":"Comparable player compensation with normalized USD values, original currency context, and confidence attached to every record.",
  "We couldn't load salary data right now.":"We couldn't load salary data right now.",
  "Filter by salary band":"Filter by salary band","Sort salary records":"Sort salary records","All leagues":"All leagues","All salary bands":"All salary bands","All confidence":"All confidence",
  "PLAYER":"PLAYER","POSITION":"POSITION","ANNUAL USD":"ANNUAL USD","WEEKLY USD":"WEEKLY USD","ORIGINAL":"ORIGINAL","CONFIDENCE":"CONFIDENCE",
  "Player":"Player","Unknown player":"Unknown player","Nationality unknown":"Nationality unknown","Unknown club":"Unknown club","League unknown":"League unknown",
  "Explore women’s football competitions, seasons, clubs and player coverage across the WFM database.":"Explore women’s football competitions, seasons, clubs and player coverage across the WFM database.",
  "Loading competitions…":"Loading competitions…","Type":"Type","Level":"Level","Seasons":"Seasons","Clubs":"Clubs","Players":"Players","Search competitions":"Search competitions","No competitions found.":"No competitions found."
});
Object.assign(ES, {
  "WOMEN’S FOOTBALL MARKET":"MERCADO DEL FÚTBOL FEMENINO","A connected view of clubs, leagues, rosters, compensation, market values, and transfer activity.":"Una vista conectada de clubes, ligas, plantillas, salarios, valores de mercado y actividad de transferencias.",
  "ACTIVE PLAYERS":"JUGADORAS ACTIVAS","WITH SALARY DATA":"CON DATOS SALARIALES","WITH MARKET VALUES":"CON VALORES DE MERCADO","Loading clubs…":"Cargando clubes…","clubs shown":"clubes mostrados","All competitions":"Todas las competiciones","All seasons":"Todas las temporadas","All countries":"Todos los países","All types":"Todos los tipos","Name":"Nombre","Roster":"Plantilla","Payroll":"Masa salarial","Market value":"Valor de mercado","Club":"Club","Competition":"Competición","Country":"País","Active roster":"Plantilla activa","Known payroll":"Masa salarial conocida","Squad market value":"Valor de mercado de la plantilla","Transfers":"Transferencias","Unknown":"Desconocido",
  "LIVE DATABASE":"BASE DE DATOS EN VIVO","Comparable player compensation with normalized USD values, original currency context, and confidence attached to every record.":"Compensación comparable de jugadoras con valores normalizados en USD, contexto de moneda original y nivel de confianza.",
  "We couldn't load salary data right now.":"No pudimos cargar los datos salariales en este momento.","Filter by salary band":"Filtrar por banda salarial","Sort salary records":"Ordenar registros salariales","All leagues":"Todas las ligas","All salary bands":"Todas las bandas salariales","All confidence":"Toda la confianza","PLAYER":"JUGADORA","POSITION":"POSICIÓN","ANNUAL USD":"USD ANUAL","WEEKLY USD":"USD SEMANAL","ORIGINAL":"ORIGINAL","CONFIDENCE":"CONFIANZA","Player":"Jugadora","Unknown player":"Jugadora desconocida","Nationality unknown":"Nacionalidad desconocida","Unknown club":"Club desconocido","League unknown":"Liga desconocida",
  "Explore women’s football competitions, seasons, clubs and player coverage across the WFM database.":"Explora competiciones, temporadas, clubes y cobertura de jugadoras de fútbol femenino en la base de datos de WFM.","Loading competitions…":"Cargando competiciones…","Type":"Tipo","Level":"Nivel","Seasons":"Temporadas","Clubs":"Clubes","Players":"Jugadoras","Search competitions":"Buscar competiciones","No competitions found.":"No se encontraron competiciones."
});
Object.assign(PT, {
  "WOMEN’S FOOTBALL MARKET":"MERCADO DO FUTEBOL FEMININO","A connected view of clubs, leagues, rosters, compensation, market values, and transfer activity.":"Uma visão conectada de clubes, ligas, elencos, salários, valores de mercado e atividade de transferências.","ACTIVE PLAYERS":"JOGADORAS ATIVAS","WITH SALARY DATA":"COM DADOS SALARIAIS","WITH MARKET VALUES":"COM VALORES DE MERCADO","Loading clubs…":"Carregando clubes…","clubs shown":"clubes exibidos","All competitions":"Todas as competições","All seasons":"Todas as temporadas","All countries":"Todos os países","All types":"Todos os tipos","Name":"Nome","Roster":"Elenco","Payroll":"Folha salarial","Market value":"Valor de mercado","Club":"Clube","Competition":"Competição","Country":"País","Active roster":"Elenco ativo","Known payroll":"Folha salarial conhecida","Squad market value":"Valor de mercado do elenco","Transfers":"Transferências","Unknown":"Desconhecido",
  "LIVE DATABASE":"BANCO DE DADOS AO VIVO","Comparable player compensation with normalized USD values, original currency context, and confidence attached to every record.":"Compensação comparável de jogadoras com valores normalizados em USD, contexto da moeda original e nível de confiança.","We couldn't load salary data right now.":"Não foi possível carregar os dados salariais agora.","Filter by salary band":"Filtrar por faixa salarial","Sort salary records":"Ordenar registros salariais","All leagues":"Todas as ligas","All salary bands":"Todas as faixas salariais","All confidence":"Todos os níveis de confiança","PLAYER":"JOGADORA","POSITION":"POSIÇÃO","ANNUAL USD":"USD ANUAL","WEEKLY USD":"USD SEMANAL","ORIGINAL":"ORIGINAL","CONFIDENCE":"CONFIANÇA","Player":"Jogadora","Unknown player":"Jogadora desconhecida","Nationality unknown":"Nacionalidade desconhecida","Unknown club":"Clube desconhecido","League unknown":"Liga desconhecida",
  "Explore women’s football competitions, seasons, clubs and player coverage across the WFM database.":"Explore competições, temporadas, clubes e cobertura de jogadoras de futebol feminino no banco de dados WFM.","Loading competitions…":"Carregando competições…","Type":"Tipo","Level":"Nível","Seasons":"Temporadas","Clubs":"Clubes","Players":"Jogadoras","Search competitions":"Buscar competições","No competitions found.":"Nenhuma competição encontrada."
});
Object.assign(FR, {
  "WOMEN’S FOOTBALL MARKET":"MARCHÉ DU FOOTBALL FÉMININ","A connected view of clubs, leagues, rosters, compensation, market values, and transfer activity.":"Une vue connectée des clubs, ligues, effectifs, salaires, valeurs de marché et mouvements.",
  "ACTIVE PLAYERS":"JOUEUSES ACTIVES","WITH SALARY DATA":"AVEC DONNÉES SALARIALES","WITH MARKET VALUES":"AVEC VALEURS DE MARCHÉ","Loading clubs…":"Chargement des clubs…","clubs shown":"clubs affichés","All competitions":"Toutes les compétitions","All seasons":"Toutes les saisons","All countries":"Tous les pays","All types":"Tous les types","Name":"Nom","Roster":"Effectif","Payroll":"Masse salariale","Market value":"Valeur de marché","Club":"Club","Competition":"Compétition","Country":"Pays","Active roster":"Effectif actif","Known payroll":"Masse salariale connue","Squad market value":"Valeur de marché de l’effectif","Transfers":"Transferts","Unknown":"Inconnu",
  "LIVE DATABASE":"BASE DE DONNÉES EN DIRECT","Comparable player compensation with normalized USD values, original currency context, and confidence attached to every record.":"Rémunération comparable des joueuses avec valeurs normalisées en USD, contexte de devise d’origine et niveau de confiance.","We couldn't load salary data right now.":"Impossible de charger les données salariales pour le moment.","Filter by salary band":"Filtrer par tranche salariale","Sort salary records":"Trier les salaires","All leagues":"Toutes les ligues","All salary bands":"Toutes les tranches salariales","All confidence":"Tous les niveaux de confiance","PLAYER":"JOUEUSE","POSITION":"POSTE","ANNUAL USD":"USD ANNUEL","WEEKLY USD":"USD HEBDOMADAIRE","ORIGINAL":"ORIGINAL","CONFIDENCE":"CONFIANCE","Player":"Joueuse","Unknown player":"Joueuse inconnue","Nationality unknown":"Nationalité inconnue","Unknown club":"Club inconnu","League unknown":"Ligue inconnue",
  "Explore women’s football competitions, seasons, clubs and player coverage across the WFM database.":"Explorez les compétitions, saisons, clubs et joueuses de football féminin dans la base WFM.","Loading competitions…":"Chargement des compétitions…","Type":"Type","Level":"Niveau","Seasons":"Saisons","Clubs":"Clubs","Players":"Joueuses","Search competitions":"Rechercher des compétitions","No competitions found.":"Aucune compétition trouvée."
});
Object.assign(DE, {
  "WOMEN’S FOOTBALL MARKET":"FRAUENFUSSBALL-MARKT","A connected view of clubs, leagues, rosters, compensation, market values, and transfer activity.":"Eine vernetzte Übersicht über Vereine, Ligen, Kader, Gehälter, Marktwerte und Transferaktivitäten.","ACTIVE PLAYERS":"AKTIVE SPIELERINNEN","WITH SALARY DATA":"MIT GEHALTSDATEN","WITH MARKET VALUES":"MIT MARKTWERTEN","Loading clubs…":"Vereine werden geladen…","clubs shown":"Vereine angezeigt","All competitions":"Alle Wettbewerbe","All seasons":"Alle Saisons","All countries":"Alle Länder","All types":"Alle Typen","Name":"Name","Roster":"Kader","Payroll":"Gehaltsbudget","Market value":"Marktwert","Club":"Verein","Competition":"Wettbewerb","Country":"Land","Active roster":"Aktiver Kader","Known payroll":"Bekanntes Gehaltsbudget","Squad market value":"Kader-Marktwert","Transfers":"Transfers","Unknown":"Unbekannt",
  "LIVE DATABASE":"LIVE-DATENBANK","A connected view":"Eine vernetzte Ansicht","Comparable player compensation with normalized USD values, original currency context, and confidence attached to every record.":"Vergleichbare Spielergehälter mit normalisierten USD-Werten, Originalwährung und Vertrauensniveau.","We couldn't load salary data right now.":"Gehaltsdaten konnten derzeit nicht geladen werden.","Filter by salary band":"Nach Gehaltsband filtern","Sort salary records":"Gehaltsdatensätze sortieren","All leagues":"Alle Ligen","All salary bands":"Alle Gehaltsbänder","All confidence":"Alle Vertrauensstufen","PLAYER":"SPIELERIN","POSITION":"POSITION","ANNUAL USD":"USD JÄHRLICH","WEEKLY USD":"USD WÖCHENTLICH","ORIGINAL":"ORIGINAL","CONFIDENCE":"VERTRAUEN","Player":"Spielerin","Unknown player":"Unbekannte Spielerin","Nationality unknown":"Nationalität unbekannt","Unknown club":"Unbekannter Verein","League unknown":"Liga unbekannt",
  "Explore women’s football competitions, seasons, clubs and player coverage across the WFM database.":"Entdecke Wettbewerbe, Saisons, Vereine und Spielerinnen im Frauenfußball in der WFM-Datenbank.","Loading competitions…":"Wettbewerbe werden geladen…","Type":"Typ","Level":"Stufe","Seasons":"Saisons","Clubs":"Vereine","Players":"Spielerinnen","Search competitions":"Wettbewerbe suchen","No competitions found.":"Keine Wettbewerbe gefunden."
});

Object.assign(EN, {
  "Current club confirmed by contract":"Current club confirmed by contract",
  "Current club based on latest transfer":"Current club based on latest transfer",
  "Current club based on latest club statistics":"Current club based on latest club statistics",
  "Current club based on latest contract record":"Current club based on latest contract record",
  "Current club source unavailable":"Current club source unavailable"
});
Object.assign(ES, {
  "Current club confirmed by contract":"Club actual confirmado por contrato",
  "Current club based on latest transfer":"Club actual basado en el último traspaso",
  "Current club based on latest club statistics":"Club actual basado en las estadísticas de club más recientes",
  "Current club based on latest contract record":"Club actual basado en el contrato más reciente",
  "Current club source unavailable":"Fuente del club actual no disponible"
});
Object.assign(PT, {
  "Current club confirmed by contract":"Clube atual confirmado por contrato",
  "Current club based on latest transfer":"Clube atual baseado na transferência mais recente",
  "Current club based on latest club statistics":"Clube atual baseado nas estatísticas de clube mais recentes",
  "Current club based on latest contract record":"Clube atual baseado no contrato mais recente",
  "Current club source unavailable":"Fonte do clube atual indisponível"
});
Object.assign(FR, {
  "Current club confirmed by contract":"Club actuel confirmé par contrat",
  "Current club based on latest transfer":"Club actuel basé sur le dernier transfert",
  "Current club based on latest club statistics":"Club actuel basé sur les dernières statistiques du club",
  "Current club based on latest contract record":"Club actuel basé sur le contrat le plus récent",
  "Current club source unavailable":"Source du club actuel indisponible"
});
Object.assign(DE, {
  "Current club confirmed by contract":"Aktueller Verein durch Vertrag bestätigt",
  "Current club based on latest transfer":"Aktueller Verein laut letztem Transfer",
  "Current club based on latest club statistics":"Aktueller Verein laut neuesten Vereinsstatistiken",
  "Current club based on latest contract record":"Aktueller Verein laut neuestem Vertragsdatensatz",
  "Current club source unavailable":"Quelle des aktuellen Vereins nicht verfügbar"
});


Object.assign(EN, {
  "Contact":"Contact","Contact WFM":"Contact WFM","Use this contact pathway for privacy requests, data corrections, verification, licensing, commercial access, and general support.":"Use this contact pathway for privacy requests, data corrections, verification, licensing, commercial access, and general support.",
  "Privacy & data rights":"Privacy & data rights","Data correction":"Data correction","Club / agency verification":"Club / agency verification","Licensing / copyright":"Licensing / copyright","Commercial access":"Commercial access","General support":"General support",
  "Email":"Email","Organization (optional)":"Organization (optional)","Subject":"Subject","WFM record or page URL (optional)":"WFM record or page URL (optional)","Message":"Message","Explain your request and include supporting details or evidence links when appropriate.":"Explain your request and include supporting details or evidence links when appropriate.","Submitting…":"Submitting…","Submit request":"Submit request","Your request has been submitted. WFM will review it through the contact workflow.":"Your request has been submitted. WFM will review it through the contact workflow.","For privacy requests, WFM may need enough information to identify the relevant account or record. Please do not submit passwords, payment-card numbers, or other sensitive secrets.":"For privacy requests, WFM may need enough information to identify the relevant account or record. Please do not submit passwords, payment-card numbers, or other sensitive secrets.",
  "Contact requests":"Contact requests","Privacy, correction, verification, licensing, commercial, and support requests submitted through WFM.":"Privacy, correction, verification, licensing, commercial, and support requests submitted through WFM.","No contact requests yet.":"No contact requests yet.","Open referenced page":"Open referenced page"
});
Object.assign(ES, {
  "Contact":"Contacto","Contact WFM":"Contactar con WFM","Use this contact pathway for privacy requests, data corrections, verification, licensing, commercial access, and general support.":"Usa este canal de contacto para solicitudes de privacidad, correcciones de datos, verificación, licencias, acceso comercial y soporte general.",
  "Privacy & data rights":"Privacidad y derechos sobre datos","Data correction":"Corrección de datos","Club / agency verification":"Verificación de club / agencia","Licensing / copyright":"Licencias / derechos de autor","Commercial access":"Acceso comercial","General support":"Soporte general",
  "Email":"Correo electrónico","Organization (optional)":"Organización (opcional)","Subject":"Asunto","WFM record or page URL (optional)":"URL del registro o página de WFM (opcional)","Message":"Mensaje","Explain your request and include supporting details or evidence links when appropriate.":"Explica tu solicitud e incluye detalles de respaldo o enlaces de evidencia cuando corresponda.","Submitting…":"Enviando…","Submit request":"Enviar solicitud","Your request has been submitted. WFM will review it through the contact workflow.":"Tu solicitud ha sido enviada. WFM la revisará mediante el flujo de contacto.","For privacy requests, WFM may need enough information to identify the relevant account or record. Please do not submit passwords, payment-card numbers, or other sensitive secrets.":"Para solicitudes de privacidad, WFM puede necesitar información suficiente para identificar la cuenta o el registro correspondiente. No envíes contraseñas, números de tarjetas de pago ni otros secretos sensibles.",
  "Contact requests":"Solicitudes de contacto","Privacy, correction, verification, licensing, commercial, and support requests submitted through WFM.":"Solicitudes de privacidad, corrección, verificación, licencias, acceso comercial y soporte enviadas a través de WFM.","No contact requests yet.":"Aún no hay solicitudes de contacto.","Open referenced page":"Abrir página referenciada"
});
Object.assign(PT, {
  "Contact":"Contato","Contact WFM":"Entrar em contato com a WFM","Use this contact pathway for privacy requests, data corrections, verification, licensing, commercial access, and general support.":"Use este canal para solicitações de privacidade, correções de dados, verificação, licenciamento, acesso comercial e suporte geral.",
  "Privacy & data rights":"Privacidade e direitos sobre dados","Data correction":"Correção de dados","Club / agency verification":"Verificação de clube / agência","Licensing / copyright":"Licenciamento / direitos autorais","Commercial access":"Acesso comercial","General support":"Suporte geral",
  "Email":"E-mail","Organization (optional)":"Organização (opcional)","Subject":"Assunto","WFM record or page URL (optional)":"URL do registro ou página da WFM (opcional)","Message":"Mensagem","Explain your request and include supporting details or evidence links when appropriate.":"Explique sua solicitação e inclua detalhes de suporte ou links de evidência quando apropriado.","Submitting…":"Enviando…","Submit request":"Enviar solicitação","Your request has been submitted. WFM will review it through the contact workflow.":"Sua solicitação foi enviada. A WFM a analisará pelo fluxo de contato.","For privacy requests, WFM may need enough information to identify the relevant account or record. Please do not submit passwords, payment-card numbers, or other sensitive secrets.":"Para solicitações de privacidade, a WFM pode precisar de informações suficientes para identificar a conta ou o registro. Não envie senhas, números de cartão de pagamento ou outros segredos sensíveis.",
  "Contact requests":"Solicitações de contato","Privacy, correction, verification, licensing, commercial, and support requests submitted through WFM.":"Solicitações de privacidade, correção, verificação, licenciamento, acesso comercial e suporte enviadas pela WFM.","No contact requests yet.":"Ainda não há solicitações de contato.","Open referenced page":"Abrir página referenciada"
});
Object.assign(FR, {
  "Contact":"Contact","Contact WFM":"Contacter WFM","Use this contact pathway for privacy requests, data corrections, verification, licensing, commercial access, and general support.":"Utilisez ce canal pour les demandes de confidentialité, corrections de données, vérification, licences, accès commercial et assistance générale.",
  "Privacy & data rights":"Confidentialité et droits sur les données","Data correction":"Correction des données","Club / agency verification":"Vérification du club / de l’agence","Licensing / copyright":"Licences / droits d’auteur","Commercial access":"Accès commercial","General support":"Assistance générale",
  "Email":"E-mail","Organization (optional)":"Organisation (facultatif)","Subject":"Objet","WFM record or page URL (optional)":"URL du registre ou de la page WFM (facultatif)","Message":"Message","Explain your request and include supporting details or evidence links when appropriate.":"Expliquez votre demande et ajoutez les détails ou liens justificatifs pertinents.","Submitting…":"Envoi…","Submit request":"Envoyer la demande","Your request has been submitted. WFM will review it through the contact workflow.":"Votre demande a été envoyée. WFM l’examinera via le processus de contact.","For privacy requests, WFM may need enough information to identify the relevant account or record. Please do not submit passwords, payment-card numbers, or other sensitive secrets.":"Pour les demandes de confidentialité, WFM peut avoir besoin d’informations suffisantes pour identifier le compte ou le registre concerné. N’envoyez pas de mots de passe, de numéros de carte bancaire ni d’autres secrets sensibles.",
  "Contact requests":"Demandes de contact","Privacy, correction, verification, licensing, commercial, and support requests submitted through WFM.":"Demandes de confidentialité, correction, vérification, licences, accès commercial et assistance envoyées via WFM.","No contact requests yet.":"Aucune demande de contact pour le moment.","Open referenced page":"Ouvrir la page référencée"
});
Object.assign(DE, {
  "Contact":"Kontakt","Contact WFM":"WFM kontaktieren","Use this contact pathway for privacy requests, data corrections, verification, licensing, commercial access, and general support.":"Nutzen Sie diesen Kontaktweg für Datenschutzanfragen, Datenkorrekturen, Verifizierung, Lizenzen, kommerziellen Zugang und allgemeinen Support.",
  "Privacy & data rights":"Datenschutz und Datenrechte","Data correction":"Datenkorrektur","Club / agency verification":"Vereins- / Agenturverifizierung","Licensing / copyright":"Lizenzierung / Urheberrecht","Commercial access":"Kommerzieller Zugang","General support":"Allgemeiner Support",
  "Email":"E-Mail","Organization (optional)":"Organisation (optional)","Subject":"Betreff","WFM record or page URL (optional)":"WFM-Datensatz- oder Seiten-URL (optional)","Message":"Nachricht","Explain your request and include supporting details or evidence links when appropriate.":"Beschreiben Sie Ihre Anfrage und fügen Sie bei Bedarf unterstützende Details oder Beleglinks hinzu.","Submitting…":"Wird gesendet…","Submit request":"Anfrage senden","Your request has been submitted. WFM will review it through the contact workflow.":"Ihre Anfrage wurde übermittelt. WFM wird sie über den Kontaktprozess prüfen.","For privacy requests, WFM may need enough information to identify the relevant account or record. Please do not submit passwords, payment-card numbers, or other sensitive secrets.":"Für Datenschutzanfragen benötigt WFM möglicherweise ausreichende Angaben zur Identifizierung des betreffenden Kontos oder Datensatzes. Senden Sie keine Passwörter, Zahlungskartennummern oder andere vertrauliche Geheimnisse.",
  "Contact requests":"Kontaktanfragen","Privacy, correction, verification, licensing, commercial, and support requests submitted through WFM.":"Datenschutz-, Korrektur-, Verifizierungs-, Lizenzierungs-, kommerzielle und Supportanfragen, die über WFM eingereicht wurden.","No contact requests yet.":"Noch keine Kontaktanfragen.","Open referenced page":"Referenzierte Seite öffnen"
});

export const WFM_UI_TRANSLATIONS: Record<WfmLocale, Record<string,string>> = { en: EN, es: ES, pt: PT, fr: FR, de: DE }
