# Operator Outbox — KeepMees / MessageVault

Generated routing packets and summaries land here. Review before acting on any output.

---

## Purpose

The Operator Outbox receives all output from `scripts/process-operator-inbox.mjs`. Each processed inbox file produces 4 output files here.

---

## Output file types

| Suffix | Purpose |
|---|---|
| `.routing.md` | Human-readable routing packet: stream, packages, commits, decisions, risks, next actions, doc update suggestions |
| `.routing.json` | Machine-readable routing packet — conforms to `docs/automation/schemas/routing-packet.schema.json` |
| `.coordinator-summary.md` | One-page summary for pasting to Coordinator (ChatGPT Chat 01) |
| `.suggested-prompts.md` | Copy-paste prompt blocks for routing to Coordinator, Claude Code, and other streams |

---

## How to use outputs

1. **Read `*.routing.md`** — verify the processor extracted the right stream, packages, decisions, and routing targets.
2. **Review `*.coordinator-summary.md`** — if Coordinator approval is required, copy and send to ChatGPT Chat 01.
3. **Review `*.suggested-prompts.md`** — pick the prompt that matches your routing intent.
4. **Optionally use `*.routing.json`** — for future automation or structured record-keeping.

**All outputs are human-readable suggestions. Do not act on them without review.**

---

## Privacy rules

- All `*.md` and `*.json` files in `operator-outbox/` are gitignored by default.
- Only `README.md` and `.gitkeep` are tracked.
- Never commit generated outbox files to the repo.

---

## Future n8n integration

When n8n or Make automation is added (later phase), the `.routing.json` file is the designed integration point. The processor can be wrapped as a subprocess in an n8n Execute Command node. The JSON output can then be parsed and routed to GitHub Issues, project boards, or stream chats automatically — without modifying this workflow.
