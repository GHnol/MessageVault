# KeepMees — Prototype Archive (formerly MessageVault)

**This repository is archived. It is permanently feature-frozen. It is not the active KeepMees product repository.**

This is the pre-reset KeepMees prototype, developed from 2026-03-21 to 2026-06-27 under the working repository name **MessageVault**. Development stopped at commit `f19a8a4`. Nothing further will be built here.

---

## Why this repository is archived

The prototype failed founder-led testing against real exported conversation data. The failures were not isolated defects; they spanned the product end to end:

- **Import fidelity** — real exports did not round-trip faithfully.
- **Identity** — participant and self-identification were unreliable across platforms.
- **Media** — attachments and media intake were not credibly handled.
- **Statistics** — analytics were shallow and not trustworthy on real data.
- **State** — session and project state handling did not hold up in real use.
- **Curation** — there was no credible path from a raw import to a keepsake worth keeping.
- **UX** — the experience did not meet the standard the product requires.
- **Design** — the visual language was not at product quality.
- **Product direction** — the overall direction did not survive contact with real data.

The founder-approved response was **full product reconstitution**, not incremental repair. See `docs/archive/keepmees-gate-0-decision.md`.

---

## What this repository is now

Retained for **historical evidence, research, autopsy, and explicitly reviewed salvage only.**

It is a useful record of what was attempted, what was decided, and what failed. It is not a foundation.

## What this repository is not

**No code, contract, product table, lock, manufacturing assumption, vendor assumption, or architecture decision in this repository is automatically authoritative for the rebuilt KeepMees product.**

Everything here must be re-derived, re-justified, and re-approved before it can influence the new product. Nothing ports by default. Salvage requires explicit evidence and explicit approval, item by item.

---

## Where the real product lives

The canonical, clean **KeepMees** repository will be created separately, only after the approved planning and design gates: product/brand, data/privacy, UX/design, architecture, and master specification.

That repository — not this one — is the active product.

---

## Contributing

Do not develop new features or fixes here. This repository accepts no product work.

Permitted future changes are limited to archival and historical-accuracy corrections. See `ARCHIVE_NOTICE.md`.
