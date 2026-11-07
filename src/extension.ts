import * as vscode from 'vscode'
import { runCheck, type CheckResult } from './client'

const SERVER_URL = 'https://mcp.workpods.ai/mcp'

interface Command {
  readonly id: string
  readonly tool: string
  readonly prompt: string
  readonly progress: string
}

const COMMANDS: readonly Command[] = [
  {
    id: 'agentReady.checkPage',
    tool: 'seo_audit_page',
    prompt: 'Page to audit for SEO and AI search',
    progress: 'Running the SEO audit',
  },
  {
    id: 'agentReady.checkAiCrawlers',
    tool: 'check_ai_crawler_access',
    prompt: 'Page to check for AI crawler access (GPTBot, ClaudeBot, PerplexityBot and more)',
    progress: 'Checking AI crawler access',
  },
  {
    id: 'agentReady.checkSiteFiles',
    tool: 'check_robots_sitemap_llms_txt',
    prompt: "Site whose robots.txt, sitemaps, llms.txt and agent files to read",
    progress: 'Reading the site files',
  },
]

export function activate(context: vscode.ExtensionContext): void {
  const version = String(context.extension.packageJSON.version)
  const output = vscode.window.createOutputChannel('Agent Ready')
  context.subscriptions.push(output)

  // Lets Copilot agent mode (and any VS Code chat that uses MCP) call every Agent Ready tool.
  context.subscriptions.push(
    vscode.lm.registerMcpServerDefinitionProvider('workpods.agent-ready', {
      provideMcpServerDefinitions: () => [
        new vscode.McpHttpServerDefinition(
          'Agent Ready Website Audit',
          vscode.Uri.parse(SERVER_URL),
          {},
          version,
        ),
      ],
    }),
  )

  for (const command of COMMANDS) {
    context.subscriptions.push(
      vscode.commands.registerCommand(command.id, () => check(command, version, output)),
    )
  }
}

async function check(
  command: Command,
  version: string,
  output: vscode.OutputChannel,
): Promise<void> {
  const url = await vscode.window.showInputBox({
    prompt: command.prompt,
    placeHolder: 'https://example.com/pricing',
    validateInput: (value) =>
      /^https?:\/\/[^\s/]+\.[^\s]+$/.test(value.trim())
        ? undefined
        : 'Enter a full http or https URL, such as https://example.com/pricing',
  })
  if (url === undefined) return
  try {
    const found = await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `Agent Ready: ${command.progress}…`,
        cancellable: true,
      },
      (_progress, token) => {
        const abort = new AbortController()
        token.onCancellationRequested(() => abort.abort())
        return runCheck(command.tool, { url: url.trim() }, version, abort.signal)
      },
    )
    show(found, output)
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') return
    const message = error instanceof Error ? error.message : 'The check failed.'
    vscode.window.showErrorMessage(`Agent Ready: ${message}`)
  }
}

function show(found: CheckResult, output: vscode.OutputChannel): void {
  output.clear()
  output.appendLine(found.summary)
  output.appendLine('')
  output.appendLine(JSON.stringify(found.result, null, 2))
  output.show(true)
  const reportUrl = found.reportUrl
  if (reportUrl === null) {
    vscode.window.showInformationMessage(found.summary)
    return
  }
  vscode.window.showInformationMessage(found.summary, 'Open report').then((choice) => {
    if (choice === 'Open report') vscode.env.openExternal(vscode.Uri.parse(reportUrl))
  })
}

export function deactivate(): void {}
