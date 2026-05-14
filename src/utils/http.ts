import type { SDKError } from '../types/params.js'

export const DATA360_BASE = 'https://data360api.worldbank.org'
export const V2_BASE = 'https://api.worldbank.org/V2'

const DOCS_URL = 'https://data360api.worldbank.org/swagger/index.html'

export class SDKRequestError extends Error {
  readonly sdkError: SDKError

  constructor(sdkError: SDKError) {
    super(sdkError.message)
    this.name = 'SDKRequestError'
    this.sdkError = sdkError
  }
}

function suggestionFor(status: number, pathname: string): string {
  if (status === 400) return `Check your DATABASE_ID and filter parameters — an invalid value was sent to ${pathname}.`
  if (status === 404) return `Resource not found at ${pathname}. Verify parameter names and values.`
  return 'Retry or check the World Bank API status at https://datahelpdesk.worldbank.org.'
}

export async function getJSON<T>(
  base: string,
  path: string,
  params: Record<string, string | string[] | number | boolean | undefined>
): Promise<T> {
  const url = new URL(path, base)
  for (const [key, val] of Object.entries(params)) {
    if (val === undefined || val === null || val === '') continue
    if (Array.isArray(val)) {
      for (const v of val) url.searchParams.append(key, v)
    } else {
      url.searchParams.set(key, String(val))
    }
  }
  const res = await fetch(url.toString(), { headers: { Accept: 'application/json' } })
  if (!res.ok) {
    throw new SDKRequestError({
      message: `HTTP ${res.status} from GET ${url.pathname}`,
      suggestion: suggestionFor(res.status, url.pathname),
      docsUrl: DOCS_URL
    })
  }
  return res.json() as Promise<T>
}

export async function postJSON<T>(base: string, path: string, body: unknown): Promise<T> {
  const url = new URL(path, base)
  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body)
  })
  if (!res.ok) {
    throw new SDKRequestError({
      message: `HTTP ${res.status} from POST ${url.pathname}`,
      suggestion: suggestionFor(res.status, url.pathname),
      docsUrl: DOCS_URL
    })
  }
  return res.json() as Promise<T>
}
