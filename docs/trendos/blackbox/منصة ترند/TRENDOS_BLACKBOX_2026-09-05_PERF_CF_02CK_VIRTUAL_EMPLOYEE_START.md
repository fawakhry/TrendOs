# TrendOS Blackbox — PERF-CF-02CK Virtual Qualification Employee START

Date: 2026-09-05
Scope: TrendOS main platform / Cloudflare Production qualification only.

## User authorization

The user explicitly requested creating a virtual employee for the qualification flow.

## Planned bounded change

Create one dedicated test employee row in the authoritative TrendOS `المستخدمين` sheet for 02CK qualification only.

Planned identity:
- username: `رحمه اختبار`
- department: `خدمة عملاء`
- role: `تشغيل`
- active: `نعم`
- purpose: dedicated synthetic Cloud Write qualification account only

Safety constraints:
- no Admin role
- no Production order write as part of account creation
- no Cloud Write flag/cutover change
- no Worker secret rotation
- no modification to real employee rows
- dedicated random session token and current login timestamp only for this test employee
- password cell will not reuse any real employee password; account is not intended for normal interactive login

Reason for username choice:
Current `accountingUserMode_` grants the existing `final` mode to usernames containing `رحمه`; using `رحمه اختبار` therefore reuses the existing least-privilege accepted path without changing application code or granting Admin/print/laser privileges.

Status: STARTED — no sheet mutation recorded in this checkpoint yet.
