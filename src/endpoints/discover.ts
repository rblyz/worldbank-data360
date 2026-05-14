import { postJSON, DATA360_BASE } from '../utils/http.js'
import type { DiscoverResult, DatabaseInfo } from '../types/params.js'

interface FacetValue { value: string; count: number }
interface FacetResponse {
  '@odata.count': number
  '@search.facets': Record<string, FacetValue[]>
}

const DB_NAMES: Record<string, string> = {
  WB_WDI: 'World Development Indicators',
  WB_EDSTATS: 'Education Statistics',
  WB_ES: 'Enterprise Survey',
  WB_GS: 'Gender Statistics',
  WB_FINDEX: 'Financial Inclusion',
  WB_HNP: 'Health Nutrition and Population',
  WB_HCP: 'Human Capital Project',
  WB_SSGD: 'Social Sustainability Global Database',
  WB_MPO: 'Macro Poverty Outlook',
  WB_IDS: 'International Debt Statistics',
  WB_CLEAR: 'Climate and Environment',
  WB_ESG: 'ESG',
  WB_FSI: 'Food Systems',
  WB_CCKP: 'Climate Change Knowledge Portal',
  WB_WITS: 'World Integrated Trade Solution',
  IMF_BOP: 'Balance of Payments',
  IMF_FSI: 'Financial Soundness Indicators',
  IMF_IFS: 'International Financial Statistics',
  IMF_WEO: 'World Economic Outlook',
  WEF_GCI: 'Global Competitiveness Index',
  WEF_TTDI: 'Travel and Tourism Development Index',
  OECD_IDD: 'Income Distribution',
  OECD_PMR: 'Product Market Regulation',
  BS_SGI: 'Sustainable Governance Indicators',
  BS_BTI: 'Bertelsmann Transformation Index',
  VDEM_CORE: 'V-Dem Democracy Indices',
  WJP_ROL: 'World Justice Project Rule of Law',
  FH_FIW: 'Freedom House — Freedom in the World',
  FAO_AS: 'FAO Agriculture',
  UN_SDG: 'UN Sustainable Development Goals',
  OWID_CB: 'Our World in Data — Central Banks',
  JRC_EDGAR: 'EU Emissions (EDGAR)',
}

export async function discover(): Promise<DiscoverResult> {
  const raw = await postJSON<FacetResponse>(DATA360_BASE, '/data360/searchv2', {
    count: true,
    top: 0,
    facets: ['series_description/database_id,count:100']
  })

  const facetValues = raw['@search.facets']?.['series_description/database_id'] ?? []

  const databases: DatabaseInfo[] = facetValues.map(f => ({
    id: f.value,
    name: DB_NAMES[f.value],
    indicatorCount: f.count
  }))

  return {
    totalIndicators: raw['@odata.count'] ?? 0,
    databases
  }
}
