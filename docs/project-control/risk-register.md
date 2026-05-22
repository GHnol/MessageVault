# KeepMees Project Risk Register

**Last updated:** 2026-05-17 (America/New_York)
**Owner:** Coordinator / Project Control
**Relationship:** Project Control view. Technical/product/operational detail lives in `docs/ops/risk-register.md`. If they differ, the ops register wins and this is corrected.

Each risk: name · description · severity · likelihood · owner lane · trigger · mitigation · contingency · status · review cadence.
Severity/Likelihood: High / Medium / Low.

---

| ID | Risk | Sev | Lik | Owner | Trigger | Mitigation | Contingency | Status | Review |
|---|---|---|---|---|---|---|---|---|---|
| R-PROD-1 | Project scope sprawl | High | Med | Coordinator | New work outside authorized package | Package-scoped Operator Mode; phase gates; Tower | Stop, re-baseline at weekly sync | Mitigated | Weekly Project Control Sync |
| R-PROD-2 | Fake readiness claims | High | Med | Product Strategy | Doc/surface implies unbuilt readiness | Gate 2; format-availability honesty (Pkg 4E) | Correct doc; record in decision log | Mitigated | Monthly Roadmap Reset |
| R-PROD-3 | Message Book reduced to generic export | High | Low | Product Strategy | Copy/positioning drifts to "export" | Meaning-first framing locked (DEC-ID-01) | Re-assert product truth | Mitigated | Monthly Roadmap Reset |
| R-PROD-4 | KeepMees reduced to only Message Book | Med | Med | Product Strategy | Docs treat MB as the boundary | DEC-ID-01 guard in all docs | Correct framing | Mitigated | Monthly Roadmap Reset |
| R-TECH-1 | Pagination regression | High | Low | Development | Scope-guarded constants changed | Scope guard + version gate (DEC-A-03) | Revert; bump version; migration note | Mitigated | Development Review |
| R-TECH-2 | chat.db schema change (Apple) | High | Low | Development | macOS/iOS update breaks import | Adapter isolated | Update adapter only | Open | Development Review |
| R-TECH-3 | Test coverage gaps | Med | Med | QA | New path without E2E | E2E + unit baseline before commit | Add coverage before merge | Mitigated | Development Review |
| R-DSGN-1 | Design drifts from preview truth | High | Med | Design System | Figma vs Preview conflict | Preview wins on composition (DEC-V-06); Gate 3 | Re-align to engine | Open (gated) | Product/Design Review |
| R-FID-1 | Preview ≠ final print reality | High | Med | Preview/Print | Claimed fidelity unverified | DEC-V-07 honest position; Gate 3 | Document bounded delta; no overclaim | Open | Product/Design Review |
| R-MFG-1 | Manufacturing ≠ product promise | High | Med | Production | Provisional dims treated as final | DEC-P-10 provisional; Gate 5 | Confirm per vendor before export | Open (gated) | Monthly Roadmap Reset |
| R-VEND-1 | Vendor uncertainty / not confirmed | High | Med | Vendor | No vendor meeting locked specs | Multiple candidates tracked; gated | Hold commerce; reassess specs | Open (gated) | Monthly Roadmap Reset |
| R-VEND-2 | IngramSpark 7×10" jacketed unavailable | High | Med | Vendor | Vendor reply negative | Alternatives (PrintNinja/BookBaby) | Switch candidate | Open | Monthly Roadmap Reset |
| R-PKG-1 | Packaging complexity | Med | Med | Packaging | Premature SOP work | Gate 7; packaging gated | Defer until vendor real | Mitigated | Monthly Roadmap Reset |
| R-PRIV-1 | Privacy/trust overclaims | High | Low | Legal/Business | Marketing claims beyond system | Gate 2; no public claims pre-launch | Correct language; legal review | Mitigated | Monthly Roadmap Reset |
| R-MKT-1 | Market/competitor pressure | Med | Med | Competitor Intel | Competitor move | Register maintained; differentiation clear | Reassess positioning | Open | Monthly Roadmap Reset |
| R-BUD-1 | Budget constraints (designer gap) | High | High | Finance/Design | Quote exceeds budget | Designer paused; passive search | Re-authorize budget or self-execute brief | Open | Monthly Budget Review |
| R-CAP-1 | Founder time constraints (separate full-time role) | High | High | Coordinator | Limited evenings/weekends | Lightweight cadence; sprint not overloaded; TickTick check-off layer | Reduce sprint scope; extend timelines (Low-confidence) | Open | Weekly CEO Review |
| R-AI-1 | AI coordination overload | Med | Med | AI Workflow | Too many chats/prompts, unclear next | Tower + next-7-days + next-session-prompt | Collapse to single next action | Mitigated | Weekly Project Control Sync |
| R-AI-2 | Chat context loss | Med | Med | AI Workflow | Compact/clear without handoff | Continuity protocols; CURRENT_STATE/AI_HANDOFF | Resume from repo only | Mitigated | Weekly Project Control Sync |
| R-AI-3 | Claude/Codex handoff failure | Med | Low | AI Workflow | Tool switch via chat memory | Tool-switching protocol; repo handoff | Stop; reconstruct from repo | Mitigated | Weekly Project Control Sync |
| R-SCH-1 | Launch schedule uncertainty | High | High | Launch Readiness | Treating Low-confidence dates as commitments | All far dates Low/directional; gates | Communicate as directional only | Mitigated (by labeling) | Monthly Roadmap Reset |
| R-LEG-1 | Legal/business prerequisites missed | Med | Low | Legal/Business | Checkout before legal ready | Gate 8; deferred until Phase 11 | Block checkout | Mitigated | Monthly Roadmap Reset |

---

## Top risks to watch now

1. **R-BUD-1** designer budget gap (High/High) — blocks Phase 7+.
2. **R-CAP-1** founder capacity (High/High) — schedule kept deliberately light; do not overload sprints.
3. **R-SCH-1** schedule uncertainty (High/High) — every far date is Low-confidence/directional by design.
4. **R-VEND-1** vendor not confirmed (gated) — dominant downstream blocker.

## Review cadence summary

- Weekly Project Control Sync: scope/AI/handoff risks.
- Weekly CEO Review: founder capacity.
- Monthly Risk Review (2nd Sunday): full register pass.
- Monthly Budget Review (1st Sunday): R-BUD-1.
- Monthly Roadmap Reset (1st Sunday): product/vendor/schedule risks.
