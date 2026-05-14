export interface SDKError {
  message: string
  suggestion: string
  docsUrl: string
}

export interface DataRecord {
  value: number
  indicator?: string
  area?: string
  period?: string
  TIME_FORMAT?: string
  UNIT_MULT?: number
  COMMENT_OBS?: string
  OBS_STATUS?: string
  OBS_CONF?: string
  AGG_METHOD?: string
  DECIMALS?: string
  COMMENT_TS?: string
  DATA_SOURCE?: string
  LATEST_DATA?: boolean
  DATABASE_ID?: string
  SEX?: string
  AGE?: string
  URBANISATION?: string
  COMP_BREAKDOWN_1?: string
  COMP_BREAKDOWN_2?: string
  COMP_BREAKDOWN_3?: string
  FREQ?: string
  UNIT_MEASURE?: string
  UNIT_TYPE?: string
}

export interface DataResult {
  count: number
  records: DataRecord[]
}

export interface ExplainResult {
  databaseId: string
  indicator?: string
  area?: string | string[]
  timePeriodFrom?: string
  timePeriodTo?: string
  filters: Record<string, string | string[] | undefined>
  description: string
}

export interface V2Region {
  id: string
  iso2code: string
  value: string
}

export interface V2Country {
  id: string
  iso2Code: string
  name: string
  region: V2Region
  adminregion: V2Region
  incomeLevel: V2Region
  lendingType: V2Region
  capitalCity: string
  longitude: string
  latitude: string
}

export interface V2Indicator {
  id: string
  name: string
  unit: string
  source: { id: string; value: string }
  sourceNote: string
  sourceOrganization: string
  topics: Array<{ id: string; value: string }>
}

export interface V2Topic {
  id: string
  value: string
  sourceNote: string
}

export interface V2PaginationMeta {
  page: number
  pages: number
  per_page: number
  total: number
}

export interface V2Result<T> {
  meta: V2PaginationMeta
  items: T[]
}

export type IndicatorListResult = unknown[]
export type DisaggregationResult = unknown
export type MetadataResult = unknown
export type SearchResult = unknown

export interface SearchResultItem {
  id: string
  name: string
  databaseId: string
  score: number
  topics?: string[]
}

export interface SearchResponse {
  total: number
  shown: number
  items: SearchResultItem[]
}

export interface DatabaseInfo {
  id: string
  name?: string
  indicatorCount: number
}

export interface DiscoverResult {
  totalIndicators: number
  databases: DatabaseInfo[]
  hint: string
}

export interface SearchQuery {
  count?: boolean
  filter?: string
  orderby?: string
  select?: string
  searchFields?: string
  search?: string
  top?: number
  skip?: number
  facets?: string[]
  vectorFilterModeSearch?: string
  vectorQueries?: Array<{
    vector?: number[]
    fields?: string
    kind?: string
    k?: number
    weight?: number
    threshold?: { kind?: string; value?: number }
  }>
}
