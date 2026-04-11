# Phase 3: Verification & Parity Artifact Purge - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-04
**Phase:** 3-Verification & Parity Artifact Purge
**Areas discussed:** Parity Code Removal, Test Suite Strictness, Regression Artifacts

---

## Parity Code Removal

| Option                 | Description                                                 | Selected |
| ---------------------- | ----------------------------------------------------------- | -------- |
| Delete completely      | Recommended - cleans up codebase as per 'Artifact Purge'    | ✓        |
| Keep behind a dev flag | Useful for future debugging, keeps the code but disables it |          |

**User's choice:** Delete completely
**Notes:** User chose the recommended option.

---

## Test Suite Strictness

| Option                        | Description                                                            | Selected |
| ----------------------------- | ---------------------------------------------------------------------- | -------- |
| Allow minor pixel differences | Recommended - WebGL vs DOM rendering often has anti-aliasing diffs     | ✓        |
| Strict 0% tolerance           | Ensures exact parity but might be brittle to cross-browser differences |          |

**User's choice:** Allow minor pixel differences
**Notes:** User chose the recommended option.

---

## Regression Artifacts

| Option                       | Description                                           | Selected |
| ---------------------------- | ----------------------------------------------------- | -------- |
| Standard Playwright traces   | Recommended - less overhead, standard tool            | ✓        |
| Detailed visual diff reports | Generates images highlighting exact pixel differences |          |

**User's choice:** Standard Playwright traces
**Notes:** User chose the recommended option.
