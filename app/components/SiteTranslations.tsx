'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { getLocaleFromPathname, translate } from '../lib/i18n'

const originals = new WeakMap<Text, string>()
const attributeOriginals = new WeakMap<HTMLElement, Record<string, string>>()
const attrs = ['placeholder', 'aria-label', 'title'] as const

const PHRASES: Record<string, Record<string, string>> = {
  es: {
    'Match Center': 'Centro de partidos',
    'MATCH CENTER': 'CENTRO DE PARTIDOS',
    'Transfer Market': 'Mercado de transferencias',
    'Salary records': 'Registros salariales',
    'Median annual': 'Mediana anual',
    'Average annual': 'Promedio anual',
    'Highest annual': 'Máximo anual',
    'Leagues covered': 'Ligas cubiertas',
    'Verified records': 'Registros verificados',
    'All leagues': 'Todas las ligas',
    'All years': 'Todos los años',
    'All confidence': 'Toda la confianza',
    'Recent · 30 days': 'Recientes · 30 días',
    'Known fees': 'Comisiones conocidas',
    'Move date': 'Fecha del movimiento',
    'Reported fee': 'Comisión reportada',
    'No transfers found': 'No se encontraron transferencias',
    'Try changing your filters or clearing the search.': 'Intenta cambiar los filtros o borrar la búsqueda.',
    'Clear filters': 'Borrar filtros',
    'Loading the transfer market...': 'Cargando el mercado de transferencias...',
    'recorded moves': 'movimientos registrados',
    'Showing': 'Mostrando',
    'of': 'de',
    'transfers': 'transferencias',
    'move': 'movimiento',
    'moves': 'movimientos',
    'From': 'Desde',
    'To': 'Hacia',
    'League unknown': 'Liga desconocida',
    'Position unknown': 'Posición desconocida',
    'Women’s Football Market': 'Mercado de Fútbol Femenino',
    'Scouting Workspace': 'Espacio de scouting',
    'Scouting report unavailable': 'Informe de scouting no disponible',
    'Data provenance': 'Procedencia de los datos',
    'Player not found': 'Jugadora no encontrada',
    'Match not found': 'Partido no encontrado',
    'Loading match…': 'Cargando partido…',
    'Performance': 'Rendimiento',
    'All recorded seasons': 'Todas las temporadas registradas',
    'All recorded competitions': 'Todas las competiciones registradas',
    'Player Context': 'Contexto de la jugadora',
    'PLAYER CONTEXT': 'CONTEXTO DE LA JUGADORA',
    'LATEST-SEASON PERFORMANCE': 'RENDIMIENTO DE LA ÚLTIMA TEMPORADA',
    'GLOBAL PEER CONTEXT': 'CONTEXTO GLOBAL DE COMPARACIÓN',
    'Eligible global peers': 'Comparables globales elegibles',
    'Peer group': 'Grupo de comparables',
    'Position': 'Posición',
    'Nationality': 'Nacionalidad',
    'Active contracts': 'Contratos activos',
    'Known payroll': 'Nómina conocida',
    'Expiring': 'Vencen',
    'Search player, club, league, position...': 'Buscar jugadora, club, liga, posición...',
    'Search player, club, league, position': 'Buscar jugadora, club, liga, posición',
    'No players found': 'No se encontraron jugadoras',
    'All salary bands': 'Todos los rangos salariales',
    'Under $50K': 'Menos de $50K',
    '$50K–$99K': '$50K–$99K',
    '$100K–$199K': '$100K–$199K',
    '$200K–$299K': '$200K–$299K',
    '$300K+': '$300K+',
  },
  pt: {
    'Match Center': 'Central de partidas',
    'MATCH CENTER': 'CENTRAL DE PARTIDAS',
    'Transfer Market': 'Mercado de transferências',
    'Salary records': 'Registros salariais',
    'Median annual': 'Mediana anual',
    'Average annual': 'Média anual',
    'Highest annual': 'Maior valor anual',
    'Leagues covered': 'Ligas cobertas',
    'Verified records': 'Registros verificados',
    'All leagues': 'Todas as ligas',
    'All years': 'Todos os anos',
    'All confidence': 'Toda a confiança',
    'Recent · 30 days': 'Recentes · 30 dias',
    'Known fees': 'Taxas conhecidas',
    'Move date': 'Data da transferência',
    'Reported fee': 'Taxa informada',
    'No transfers found': 'Nenhuma transferência encontrada',
    'Try changing your filters or clearing the search.': 'Tente alterar os filtros ou limpar a busca.',
    'Clear filters': 'Limpar filtros',
    'Loading the transfer market...': 'Carregando o mercado de transferências...',
    'recorded moves': 'movimentações registradas',
    'Showing': 'Mostrando',
    'of': 'de',
    'transfers': 'transferências',
    'move': 'movimentação',
    'moves': 'movimentações',
    'From': 'De',
    'To': 'Para',
    'League unknown': 'Liga desconhecida',
    'Position unknown': 'Posição desconhecida',
    'Scouting Workspace': 'Espaço de scouting',
    'Scouting report unavailable': 'Relatório de scouting indisponível',
    'Data provenance': 'Procedência dos dados',
    'Player not found': 'Jogadora não encontrada',
    'Match not found': 'Partida não encontrada',
    'Loading match…': 'Carregando partida…',
    'Performance': 'Desempenho',
    'All recorded seasons': 'Todas as temporadas registradas',
    'All recorded competitions': 'Todas as competições registradas',
    'PLAYER CONTEXT': 'CONTEXTO DA JOGADORA',
    'LATEST-SEASON PERFORMANCE': 'DESEMPENHO DA ÚLTIMA TEMPORADA',
    'GLOBAL PEER CONTEXT': 'CONTEXTO GLOBAL DE COMPARAÇÃO',
    'Eligible global peers': 'Comparáveis globais elegíveis',
    'Peer group': 'Grupo de comparáveis',
    'Active contracts': 'Contratos ativos',
    'Known payroll': 'Folha salarial conhecida',
    'Search player, club, league, position...': 'Pesquisar jogadora, clube, liga, posição...',
    'No players found': 'Nenhuma jogadora encontrada',
    'All salary bands': 'Todas as faixas salariais',
  },
  fr: {
    'Match Center': 'Centre des matchs',
    'MATCH CENTER': 'CENTRE DES MATCHS',
    'Transfer Market': 'Marché des transferts',
    'Salary records': 'Données salariales',
    'Median annual': 'Médiane annuelle',
    'Average annual': 'Moyenne annuelle',
    'Highest annual': 'Maximum annuel',
    'Leagues covered': 'Ligues couvertes',
    'Verified records': 'Données vérifiées',
    'All leagues': 'Toutes les ligues',
    'All years': 'Toutes les années',
    'All confidence': 'Tous les niveaux de confiance',
    'Recent · 30 days': 'Récentes · 30 jours',
    'Known fees': 'Frais connus',
    'Move date': 'Date du mouvement',
    'Reported fee': 'Frais déclarés',
    'No transfers found': 'Aucun transfert trouvé',
    'Try changing your filters or clearing the search.': 'Essayez de modifier vos filtres ou de vider la recherche.',
    'Clear filters': 'Effacer les filtres',
    'Loading the transfer market...': 'Chargement du marché des transferts...',
    'recorded moves': 'mouvements enregistrés',
    'Showing': 'Affichage de',
    'of': 'sur',
    'transfers': 'transferts',
    'move': 'mouvement',
    'moves': 'mouvements',
    'From': 'De',
    'To': 'Vers',
    'League unknown': 'Ligue inconnue',
    'Position unknown': 'Position inconnue',
    'Scouting Workspace': 'Espace de scouting',
    'Scouting report unavailable': 'Rapport de scouting indisponible',
    'Data provenance': 'Provenance des données',
    'Player not found': 'Joueuse introuvable',
    'Match not found': 'Match introuvable',
    'Loading match…': 'Chargement du match…',
    'Performance': 'Performance',
    'All recorded seasons': 'Toutes les saisons enregistrées',
    'All recorded competitions': 'Toutes les compétitions enregistrées',
    'PLAYER CONTEXT': 'CONTEXTE DE LA JOUEUSE',
    'LATEST-SEASON PERFORMANCE': 'PERFORMANCE DE LA DERNIÈRE SAISON',
    'GLOBAL PEER CONTEXT': 'CONTEXTE GLOBAL DE COMPARAISON',
    'Eligible global peers': 'Pairs mondiaux éligibles',
    'Peer group': 'Groupe de pairs',
    'Active contracts': 'Contrats actifs',
    'Known payroll': 'Masse salariale connue',
    'Search player, club, league, position...': 'Rechercher joueuse, club, ligue, position...',
    'No players found': 'Aucune joueuse trouvée',
    'All salary bands': 'Toutes les tranches salariales',
  },
  de: {
    'Match Center': 'Spielzentrum',
    'MATCH CENTER': 'SPIELZENTRUM',
    'Transfer Market': 'Transfermarkt',
    'Salary records': 'Gehaltsdatensätze',
    'Median annual': 'Jahresmedian',
    'Average annual': 'Jahresdurchschnitt',
    'Highest annual': 'Höchstes Jahresgehalt',
    'Leagues covered': 'Abgedeckte Ligen',
    'Verified records': 'Verifizierte Datensätze',
    'All leagues': 'Alle Ligen',
    'All years': 'Alle Jahre',
    'All confidence': 'Alle Vertrauensstufen',
    'Recent · 30 days': 'Letzte · 30 Tage',
    'Known fees': 'Bekannte Gebühren',
    'Move date': 'Bewegungsdatum',
    'Reported fee': 'Gemeldete Gebühr',
    'No transfers found': 'Keine Transfers gefunden',
    'Try changing your filters or clearing the search.': 'Versuche, die Filter zu ändern oder die Suche zu löschen.',
    'Clear filters': 'Filter löschen',
    'Loading the transfer market...': 'Transfermarkt wird geladen...',
    'recorded moves': 'erfasste Bewegungen',
    'Showing': 'Anzeige',
    'of': 'von',
    'transfers': 'Transfers',
    'move': 'Bewegung',
    'moves': 'Bewegungen',
    'From': 'Von',
    'To': 'Zu',
    'League unknown': 'Liga unbekannt',
    'Position unknown': 'Position unbekannt',
    'Scouting Workspace': 'Scouting-Bereich',
    'Scouting report unavailable': 'Scouting-Bericht nicht verfügbar',
    'Data provenance': 'Datenherkunft',
    'Player not found': 'Spielerin nicht gefunden',
    'Match not found': 'Spiel nicht gefunden',
    'Loading match…': 'Spiel wird geladen…',
    'Performance': 'Leistung',
    'All recorded seasons': 'Alle erfassten Saisons',
    'All recorded competitions': 'Alle erfassten Wettbewerbe',
    'PLAYER CONTEXT': 'SPIELERINNEN-KONTEXT',
    'LATEST-SEASON PERFORMANCE': 'LEISTUNG DER LETZTEN SAISON',
    'GLOBAL PEER CONTEXT': 'GLOBALER VERGLEICHSGRUPPEN-KONTEXT',
    'Eligible global peers': 'Geeignete globale Vergleichsspielerinnen',
    'Peer group': 'Vergleichsgruppe',
    'Active contracts': 'Aktive Verträge',
    'Known payroll': 'Bekannte Gehaltssumme',
    'Search player, club, league, position...': 'Spielerin, Verein, Liga, Position suchen...',
    'No players found': 'Keine Spielerinnen gefunden',
    'All salary bands': 'Alle Gehaltsklassen',
  }
}

function translateValue(locale: string, value: string) {
  const trimmed = value.trim()
  if (!trimmed) return value
  const phrase = PHRASES[locale]?.[trimmed]
  if (phrase) return value.replace(trimmed, phrase)
  const translated = translate(locale as any, trimmed)
  return translated === trimmed ? value : value.replace(trimmed, translated)
}

export default function SiteTranslations() {
  const pathname = usePathname()
  const locale = getLocaleFromPathname(pathname)

  useEffect(() => {
    const root = document.body

    const apply = () => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
      let node: Node | null

      while ((node = walker.nextNode())) {
        const text = node as Text
        if (!text.parentElement || ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(text.parentElement.tagName)) continue
        const original = originals.get(text) ?? text.nodeValue ?? ''
        originals.set(text, original)
        text.nodeValue = translateValue(locale, original)
      }

      root.querySelectorAll<HTMLElement>('[placeholder],[aria-label],[title]').forEach((el) => {
        const stored = attributeOriginals.get(el) ?? {}
        attrs.forEach((attr) => {
          const current = el.getAttribute(attr)
          if (current && !stored[attr]) stored[attr] = current
          const original = stored[attr]
          if (original) el.setAttribute(attr, translateValue(locale, original))
        })
        attributeOriginals.set(el, stored)
      })
    }

    apply()
    const observer = new MutationObserver(apply)
    observer.observe(root, { childList: true, subtree: true, characterData: true })
    return () => observer.disconnect()
  }, [locale])

  return null
}
