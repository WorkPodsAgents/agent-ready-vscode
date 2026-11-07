// A minimal client for the hosted Agent Ready MCP server, so the commands work without Copilot.
// It speaks MCP's Streamable HTTP transport: initialize, then one tools/call in that session.
const ENDPOINT = 'https://mcp.workpods.ai/mcp'
const PROTOCOL_VERSION = '2025-06-18'

export interface CheckResult {
  readonly summary: string
  /** A shareable report page kept 30 days; null for checks that keep none. */
  readonly reportUrl: string | null
  readonly result: Record<string, unknown>
}

interface RpcReply {
  readonly result?: { content?: { type: string; text?: string }[]; isError?: boolean }
  readonly error?: { message: string }
}

export async function runCheck(
  tool: string,
  args: Record<string, unknown>,
  clientVersion: string,
  signal: AbortSignal,
): Promise<CheckResult> {
  const opened = await post(
    {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: {},
        clientInfo: { name: 'agent-ready-vscode', version: clientVersion },
      },
    },
    null,
    signal,
  )
  const session = opened.session
  if (session === null) throw new Error('Agent Ready did not open a session; try again later.')
  await post({ jsonrpc: '2.0', method: 'notifications/initialized' }, session, signal)
  const called = await post(
    { jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: tool, arguments: args } },
    session,
    signal,
  )
  const reply = called.reply
  if (reply?.error) throw new Error(reply.error.message)
  const text = reply?.result?.content?.find((part) => part.type === 'text')?.text
  if (text === undefined) throw new Error('Agent Ready sent an empty answer; try again later.')
  // A refused or failed check comes back as one plain sentence.
  if (reply?.result?.isError) throw new Error(text)
  return JSON.parse(text) as CheckResult
}

async function post(
  message: object,
  session: string | null,
  signal: AbortSignal,
): Promise<{ session: string | null; reply: RpcReply | null }> {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    accept: 'application/json, text/event-stream',
    'mcp-protocol-version': PROTOCOL_VERSION,
  }
  if (session !== null) headers['mcp-session-id'] = session
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers,
    body: JSON.stringify(message),
    signal,
  })
  if (response.status === 429) {
    throw new Error('Agent Ready is busy or your daily limit is used up; try again later.')
  }
  if (!response.ok && response.status !== 202) {
    throw new Error(`Agent Ready answered HTTP ${response.status}; try again later.`)
  }
  const body = await response.text()
  return { session: response.headers.get('mcp-session-id') ?? session, reply: parse(body) }
}

/** The answer arrives as plain JSON or as server-sent events; either way take the JSON-RPC reply. */
function parse(body: string): RpcReply | null {
  const trimmed = body.trim()
  if (trimmed === '') return null
  if (trimmed.startsWith('{')) return JSON.parse(trimmed) as RpcReply
  const data = trimmed
    .split('\n')
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trim())
    .filter((line) => line.startsWith('{'))
  const last = data.at(-1)
  return last === undefined ? null : (JSON.parse(last) as RpcReply)
}
