import { getJSON, DATA360_BASE } from '../utils/http.js'
import type { DisaggregationResult } from '../types/params.js'

export class DisaggregationBuilder {
  private _indicatorId?: string

  constructor(private readonly _datasetId: string) {}

  indicator(id: string): this { this._indicatorId = id; return this }

  async fetch(): Promise<DisaggregationResult> {
    return getJSON<unknown>(DATA360_BASE, '/data360/disaggregation', {
      datasetId: this._datasetId,
      indicatorId: this._indicatorId
    })
  }
}
