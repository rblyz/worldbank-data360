import { getJSON, DATA360_BASE } from '../utils/http.js'
import { normalizeDataRecord } from '../utils/compact.js'
import type { DataResult, DataRecord, ExplainResult } from '../types/params.js'
import type { components } from '../types/generated.js'

type RawResponse = components['schemas']['DataResponse']

const PAGE_SIZE = 1000

type Fetcher = (skip: number) => Promise<RawResponse>

export async function paginate(fetcher: Fetcher): Promise<DataResult> {
  let skip = 0
  let totalCount = 0
  const allRecords: DataRecord[] = []

  while (true) {
    const raw = await fetcher(skip)
    const page = raw.value ?? []

    if (skip === 0) totalCount = raw.count ?? 0

    for (const r of page) {
      allRecords.push(normalizeDataRecord(r as Record<string, unknown>))
    }

    if (page.length < PAGE_SIZE || allRecords.length >= totalCount) break
    skip += PAGE_SIZE
  }

  allRecords.sort((a, b) => {
    const pa = a.period ?? '', pb = b.period ?? ''
    if (pa !== pb) return pa < pb ? -1 : 1
    const aa = a.area ?? '', ab = b.area ?? ''
    return aa < ab ? -1 : aa > ab ? 1 : 0
  })

  return { count: totalCount, records: allRecords }
}

export class DataQueryBuilder {
  private readonly _databaseId: string
  private _indicator?: string
  private _area?: string | string[]
  private _sex?: string
  private _age?: string
  private _urbanisation?: string
  private _compBreakdown1?: string
  private _compBreakdown2?: string
  private _compBreakdown3?: string
  private _timePeriod?: string
  private _freq?: string
  private _unitMeasure?: string
  private _unitType?: string
  private _unitMult?: string
  private _timePeriodFrom?: string
  private _timePeriodTo?: string

  constructor(databaseId: string) {
    this._databaseId = databaseId
  }

  indicator(id: string): this { this._indicator = id; return this }
  area(code: string | string[]): this { this._area = code; return this }
  sex(value: string): this { this._sex = value; return this }
  age(value: string): this { this._age = value; return this }
  urbanisation(value: string): this { this._urbanisation = value; return this }
  breakdown1(value: string): this { this._compBreakdown1 = value; return this }
  breakdown2(value: string): this { this._compBreakdown2 = value; return this }
  breakdown3(value: string): this { this._compBreakdown3 = value; return this }
  timePeriod(value: string): this { this._timePeriod = value; return this }
  freq(value: string): this { this._freq = value; return this }
  unitMeasure(value: string): this { this._unitMeasure = value; return this }
  unitType(value: string): this { this._unitType = value; return this }
  unitMult(value: string): this { this._unitMult = value; return this }
  from(year: string): this { this._timePeriodFrom = year; return this }
  to(year: string): this { this._timePeriodTo = year; return this }

  private buildParams(skip: number = 0): Record<string, string | number | undefined> {
    return {
      DATABASE_ID: this._databaseId,
      INDICATOR: this._indicator,
      REF_AREA: Array.isArray(this._area) ? this._area.join(',') : this._area,
      SEX: this._sex,
      AGE: this._age,
      URBANISATION: this._urbanisation,
      COMP_BREAKDOWN_1: this._compBreakdown1,
      COMP_BREAKDOWN_2: this._compBreakdown2,
      COMP_BREAKDOWN_3: this._compBreakdown3,
      TIME_PERIOD: this._timePeriod,
      FREQ: this._freq,
      UNIT_MEASURE: this._unitMeasure,
      UNIT_TYPE: this._unitType,
      UNIT_MULT: this._unitMult,
      timePeriodFrom: this._timePeriodFrom,
      timePeriodTo: this._timePeriodTo,
      skip: skip > 0 ? skip : undefined
    }
  }

  async fetch(): Promise<DataResult> {
    return paginate(skip =>
      getJSON<RawResponse>(DATA360_BASE, '/data360/data', this.buildParams(skip))
    )
  }

  explain(): ExplainResult {
    const filters: Record<string, string | string[] | undefined> = {}
    if (this._sex) filters['sex'] = this._sex
    if (this._age) filters['age'] = this._age
    if (this._urbanisation) filters['urbanisation'] = this._urbanisation
    if (this._compBreakdown1) filters['breakdown1'] = this._compBreakdown1
    if (this._compBreakdown2) filters['breakdown2'] = this._compBreakdown2
    if (this._compBreakdown3) filters['breakdown3'] = this._compBreakdown3
    if (this._freq) filters['freq'] = this._freq
    if (this._unitMeasure) filters['unitMeasure'] = this._unitMeasure

    const parts: string[] = [`Database: ${this._databaseId}`]
    if (this._indicator) parts.push(`Indicator: ${this._indicator}`)
    if (this._area) {
      parts.push(`Area: ${Array.isArray(this._area) ? this._area.join(', ') : this._area}`)
    }
    if (this._timePeriodFrom || this._timePeriodTo) {
      parts.push(`Period: ${this._timePeriodFrom ?? '?'}–${this._timePeriodTo ?? 'present'}`)
    }
    if (Object.keys(filters).length > 0) {
      parts.push(`Filters: ${JSON.stringify(filters)}`)
    }

    return {
      databaseId: this._databaseId,
      indicator: this._indicator,
      area: this._area,
      timePeriodFrom: this._timePeriodFrom,
      timePeriodTo: this._timePeriodTo,
      filters,
      description: parts.join(' | ')
    }
  }

  async toContext(): Promise<string> {
    const result = await this.fetch()
    const meta = this.explain()

    const lines: string[] = [
      `## World Bank Data: ${meta.description}`,
      `Total records: ${result.count}`,
      '',
      '| period | area | indicator | value |',
      '|--------|------|-----------|-------|'
    ]

    for (const r of result.records) {
      lines.push(`| ${r.period ?? ''} | ${r.area ?? ''} | ${r.indicator ?? ''} | ${r.value} |`)
    }

    return lines.join('\n')
  }
}
