# Operator Inbox — KeepMees / MessageVault

Drop stream responses here. Run the processor to generate routing packets.

---

## Purpose

The Operator Inbox is the entry point for the local stream update routing system. Paste any response from a ChatGPT stream chat into a new Markdown file here, then run `scripts/process-operator-inbox.mjs` to extract structured routing data.

---

## File naming convention

```
YYYY-MM-DD_stream-name_short-title.md
```

Examples:

```
2026-05-15_development_package-3c-review.md
2026-05-15_product_product-system-note.md
2026-05-15_vendor_bookbaby-response.md
2026-05-15_coordinator_package-2-6-auth.md
```

**Recognized stream names** (part 2 of filename):

`coordinator`, `product`, `development`, `design`, `vendor`, `packaging`, `competitors`, `ai-mastery`, `tools`, `brand`, `claude-code`, `codex`

---

## How to create an inbox file

1. Get a response from one of the 15 stream chats.
2. Create a new file: `operator-inbox/YYYY-MM-DD_stream-name_short-title.md`
3. Paste the full response as the file body.
4. Run the processor.

---

## How to run the processor

From the repo root:

```bash
# Process the most recently dated inbox file
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

## Outputs

Processor writes 4 files to `operator-outbox/`:

| File | Purpose |
|---|---|
| `*.routing.md` | Human-readable routing packet with extracted data |
| `*.routing.json` | Machine-readable routing packet (matches routing-packet schema) |
| `*.coordinator-summary.md` | One-page summary for Coordinator review |
| `*.suggested-prompts.md` | Copy-paste prompts for routing to each stream |

---

## Privacy rules

- **Never commit real chat exports to this directory.**
- **Never commit private message content.**
- All `*.md` files in `operator-inbox/` are gitignored by default.
- Only `README.md` and `.gitkeep` files are tracked.
- Generated outbox files are also gitignored.
- Processed files can be archived to `operator-inbox/processed/` for local reference — also gitignored.

---

## What the processor does NOT do

- It does not modify any repo docs automatically.
- It does not send content to external APIs.
- It does not connect to ChatGPT.
- It does not commit anything.

All output requires human review before being acted upon.

---

## processed/ subfolder

Move processed inbox files to `operator-inbox/processed/` to keep the inbox tidy. All files here are gitignored.
