TrendOS Apps Script V150 live dry-run route probe trigger.

Expected before manual deployment:
- V150_ROUTE_STATE=NOT_INSTALLED
- live Apps Script Web App remains Version 149.

Expected after manual deployment of the tested Code.gs candidate:
- V150_ROUTE_STATE=INSTALLED_LOCKED
- code is dry-run-secret-not-configured or unauthorized
- sheetsWritten=false
- mutationCount=0

This probe is GET-only and sends no reconciliation secret.
