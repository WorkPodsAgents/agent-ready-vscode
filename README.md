# Agent Ready Website Audit for VS Code

Run an SEO and AI search audit of any web page without leaving VS Code: see it the way Google, ChatGPT, Perplexity and AI agents read it. No account or API key needed.

## In Copilot agent mode

The extension adds the hosted [Agent Ready Website Audit](https://workpods.ai/tools/agent-ready) MCP server to VS Code. Open Copilot Chat in **Agent** mode, check that **Agent Ready Website Audit** is ticked in the tools list, and ask in plain words:

- "Run an SEO audit of https://example.com/pricing and tell me what to fix first."
- "Can ChatGPT, Claude and Perplexity read https://example.com?"
- "Draft an llms.txt for example.com."
- "Crawl example.com, 20 pages, and list broken links and duplicate titles."

It has 12 tools: an SEO audit of a page, a check of robots.txt, sitemaps and llms.txt, AI crawler access, AI agent readiness, a comparison with a competitor's page, local SEO details, a site-wide crawl of up to 50 pages, and drafts of an llms.txt file, robots.txt rules for AI crawlers and schema markup.

## Commands

Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`) and run:

- **Agent Ready: SEO audit of a page**: indexing, title and description, headings, schema markup, links, image alt text and AI readiness.
- **Agent Ready: Check AI crawler access**: whether GPTBot, ClaudeBot, PerplexityBot and more may read a page, from robots.txt, meta tags and headers.
- **Agent Ready: Check robots.txt, sitemaps and llms.txt**

The summary appears as a notification with an **Open report** button, and the full result goes to the **Agent Ready** output panel. Each report page is kept for 30 days.

## Privacy

The extension sends the URL you enter to `mcp.workpods.ai`, which fetches that public page. The server records the domain and path it checked, never the query string, your IP address or the page text. Read the [privacy policy](https://workpods.ai/privacy#agent-ready-mcp).

It only reads public pages. It never signs in, submits forms or changes a site. It does not cover rankings, keyword volumes or backlinks.

## More from Agent Ready

The [Agent Ready Chrome extension and CLI](https://workpods.ai/tools/agent-ready) run the same checks in your browser and in CI. The code is open source under Apache 2.0.
