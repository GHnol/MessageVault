# Operator Inbox Protocol

**Last updated:** 2026-05-15
**Applies to:** Claude Code and the Coordinator when routing stream updates into the repo
**Status:** Active — Package 2.6 delivery

---

## Purpose

Define how the Coordinator and Claude Code use the local Operator Inbox to route stream responses from the 15-chat model into structured routing packets, project-record suggestions, and Coordinator-ready next actions.

This protocol reduces the manual burden of reading a stream response, manually deciding which docs to update, and manually routing to the right recipient. The processor does not update docs automatically — it proposes structured outputs for human review.

---

## How to create an inbox file

1. Get a response from any of the 15 stream chats (Coordinator, Product, Development, Design, Vendor, etc.).
2. Create a new Markdown file in `operator-inbox/`:
   ```
   operator-inbox/YYYY-MM-DD_stream-name_short-title.md
   ```
3. Paste the full stream response as the file body. No special formatting required.
4. Run the processor (see below).

**Recognized stream names** (part 2 of filename, lowercase with hyphens):

| Filename part | Stream |
|---|---|
| `coordinator` | Coordinator (ChatGPT Chat 01) |
| `product` | Product — Core Strategy |
| `development` | Development — Core Build |
| `design` | Design — Designer Hiring or Figma |
| `vendor` | Production — Vendor Feasibility |
| `packaging` | Production — Packaging, Bundling, Gifting |
| `competitors` | Competitors — Master Analysis |
| `ai-mastery` | Tools — AI Mastery |
| `tools` | Tools — Claude Code / Git Workflow |
| `brand` | Brand — Logo Drafts |
| `claude-code` | Claude Code (Operator) |
| `codex` | Codex (code generation) |

If the stream is not recognized from the filename, the processor will attempt to detect it from the first 600 characters of the file content (looking for `Source:`, `Stream:`, or `From:` lines). If still unrecognized, it is classified as `Unknown` and routed to Coordinator.

---

## How to run the processor

From the repo root:

```bash
# Process the most recently dated .md file in operator-inbox/
node scripts/process-operator-inbox.mjs --latest

# Process a specific file
node scripts/process-operator-inbox.mjs --file operator-inbox/2026-05-15_development_example.md
```

From `scripts/` directory:

```bash
npm run inbox:latest
npm run inbox -- --file operator-inbox/2026-05-15_development_example.md
```

---

## What the processor extracts

The processor attempts rule-based extraction of the following from each inbox file:

| Field | Extraction method |
|---|---|
| Source stream | Filename part 2 or `Source:` / `Stream:` line |
| Package names | `Package N.N` pattern |
| Commit hashes | 7–40 char lowercase hex strings |
| Test results | `N passing`, `N failing`, `all green` patterns |
| Decisions | `Decision:`, `Decided:`, `Locked:`, `Authorized:` lines |
| Risks | `RISK-XX-NN` IDs and `Risk:` lines |
| Next actions | `Next action:`, `Action required:`, `TODO:` lines |
| Routing targets | Inferred from stream + content keywords |
| Coordinator approval required | True if Coordinator is a routing target or content mentions approval/authorization |
| Suggested doc updates | Inferred from content keywords (backlog, risk, decision, next action, etc.) |

Extraction is rule-based, not AI-level. It catches well-structured responses and common patterns. Poorly structured responses may produce sparse output — that is expected. Always review before acting.

---

## What outputs are produced

Each processed inbox file produces 4 output files in `operator-outbox/`:

| File | Purpose |
|---|---|
| `*.routing.md` | Human-readable routing packet — full extracted data, routing targets, suggested doc updates |
| `*.routing.json` | Machine-readable routing packet conforming to `docs/automation/schemas/routing-packet.schema.json` |
| `*.coordinator-summary.md` | One-page summary for pasting to Coordinator (ChatGPT Chat 01) |
| `*.suggested-prompts.md` | Copy-paste prompts for routing the update to Coordinator, Claude Code, or other streams |

---

## What the routing packet means

A routing packet is a structured representation of what happened in a stream response and who needs to act on it. It is NOT an instruction to act — it is a proposal.

Fields in the routing packet JSON:
- `packetId` — unique ID for this packet (e.g. `RP-20260515-001`)
- `date` — extraction date
- `origin` — which stream this came from
- `destination` — which streams should receive and act on this packet
- `subject` — one-line description
- `urgency` — `immediate`, `this-session`, `next-session`, or `low`
- `summary` — auto-extracted one-paragraph summary
- `coordinatorApprovalRequired` — true if action should not be taken without Coordinator review
- `approvalStatus` — always `pending` on first extraction; update manually if approved

---

## What the user still needs to approve

The processor does not:
- Modify any repo docs (`docs/strategy/**`, `docs/ops/**`, `docs/command-center/**`)
- Commit anything
- Push anything
- Send anything to ChatGPT or any external service
- Apply any decision as locked

**The user must:**
1. Review the `*.routing.md` output — verify extraction accuracy
2. Review the `*.coordinator-summary.md` — decide whether to send to Coordinator
3. Review the `*.suggested-prompts.md` — pick the right prompt for routing
4. Manually update any repo docs that need updating
5. Manually send any prompts to the appropriate stream
6. Manually authorize any next package or scope decision with the Coordinator

---

## Why this does not auto-post to ChatGPT chats

This package (Package 2.6) is local file-based only. It does not have access to ChatGPT sessions, APIs, or browser sessions. The routing automation layer produces structured output for a human to review and route.

Future automation (n8n / Make / Zapier — later phase) can wrap this processor to:
- Watch `operator-inbox/` for new files
- Run the processor automatically
- Route the `.routing.json` to GitHub Issues, project boards, or external APIs
- Require manual approval for Coordinator actions

Until that phase, manual review and routing is required.

---

## How n8n can later wrap this processor

The processor is designed to be subprocess-friendly. A future n8n Execute Command node can:

```
node /path/to/scripts/process-operator-inbox.mjs --file /path/to/inbox-file.md
```

And then parse the output files from `operator-outbox/`. The `.routing.json` file conforms to `docs/automation/schemas/routing-packet.schema.json` and can be consumed by an n8n JSON parse node. No changes to the processor would be required to enable this integration.

---

## Privacy and file handling rules

- **Never commit real chat exports or stream responses to `operator-inbox/`.**
- **Never commit generated output files from `operator-outbox/`.**
- All `*.md` files in `operator-inbox/` are gitignored by default.
- All `*.md` and `*.json` files in `operator-outbox/` are gitignored.
- The only tracked files in these directories are `README.md` and `.gitkeep`.
- Safe test fixtures with fake content live in `scripts/fixtures/operator-inbox/` — these may be committed.
- Never add real user data, real chat exports, or real message content to `scripts/fixtures/`.

---

## File hygiene

Move processed inbox files to `operator-inbox/processed/` after routing. This keeps the inbox directory readable. All files in `processed/` are also gitignored.

The `.gitignore` rules for this system:

```
operator-inbox/*.md
!operator-inbox/README.md
!operator-inbox/.gitkeep
operator-inbox/processed/*.md
!operator-inbox/processed/.gitkeep
operator-outbox/*.md
operator-outbox/*.json
!operator-outbox/README.md
!operator-outbox/.gitkeep
```
