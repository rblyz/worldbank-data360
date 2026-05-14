import { getJSON, DATA360_BASE } from '../utils/http.js'
import type { IndicatorListResult } from '../types/params.js'

export class IndicatorsBuilder {
  constructor(private readonly _datasetId: string) {}

  async fetch(): Promise<IndicatorListResult> {
    return getJSON<unknown[]>(DATA360_BASE, '/data360/indicators', { datasetId: this._datasetId })
  }
}
