# T12 — owner-run, one-time, numeric-only Script Property inspection helper
Date: 2026-09-22. **Preparation on the isolated GitHub branch only. Not added to the actual Apps Script project; not run or deployed.**

## Purpose and exact scope
The existing owner-used Google Apps Script editor displays only the first 50 Script Properties. The migration must learn the value of **TRENDOS_NEXT_SIMPLE_ORDER_NO** without guessing it from the maximum observed Sheet order number. This snippet reads only that named Script Property. It never lists other properties, prints a value that fails numeric checks, resets the counter, updates Sheets, creates an order, touches a Cloudflare Worker/D1, publishes an Apps Script deployment, or calls legacy cleanup helpers.

**Important distinction:** *Preparing this snippet in GitHub* is not an Apps Script production change. If the owner later pastes and saves it in the actual Apps Script editor, that DOES modify the project's draft / Head source even if the owner never clicks Deploy; running it is a separate owner action, and its execution log contains the numeric counter. Do not characterize the method as zero-change to Apps Script Head.

## Copy/paste snippet — run ONLY if the owner decides to edit Head
```javascript
function trendosT12ReadNextSimpleOrderNoOnce_20260922() {
  const raw = PropertiesService.getScriptProperties()
    .getProperty('TRENDOS_NEXT_SIMPLE_ORDER_NO');

  if (raw === null) {
    console.log('NEXT_ORDER_NO_NOT_FOUND');
    return;
  }

  if (!/^[0-9]+$/.test(raw) ||
      !Number.isSafeInteger(Number(raw))) {
    console.log('NEXT_ORDER_NO_INVALID_OR_UNSAFE');
    return;
  }

  console.log('NEXT_ORDER_NO=' + raw);
}
```

Exact output is one of `NEXT_ORDER_NO=<digits>`, `NEXT_ORDER_NO_NOT_FOUND`, or `NEXT_ORDER_NO_INVALID_OR_UNSAFE`; a permissions/runtime failure could instead show an Apps Script error. The function prints no raw property when absent/malformed; it reports zero and leading-zero numeric text as-is, without claiming validity as a production migration seed.

## Owner UI instructions and conditions
1. Verify the Apps Script project is the owner’s actual currently used TrendOS project. Only after accepting the *draft/Head edit* described above, create a NEW temporary `.gs` file (e.g. `T12_ReadOnlyCounter_20260922.gs`) and paste the snippet unchanged. Do **not** replace, edit, or run `Code.gs` or any existing order-creation helper.
2. Save the draft once. From the function selector, explicitly select `trendosT12ReadNextSimpleOrderNoOnce_20260922`, and run **only** that named function once. If Google requests unexpectedly broad or confusing permission, stop and request review; never paste authorization codes, OAuth access/refresh tokens or app secrets into chat.
3. Open the Execution log. Send only the full `NEXT_ORDER_NO=...` line, or exactly one of the two absence/invalid labels, not a screenshot of all Script Properties, source URLs, user identity or other logs.
4. **Do NOT click Deploy, reset/clean Script Properties, switch version numbers, enable a Worker, or call any operational or historical idempotency-cleanup function.** Saving a separate draft file is still a source edit: if live Head-based clients/triggers could be affected or the owner does not consent to the draft edit, STOP before step 1 and seek an approved alternative.
5. The helper is read-only and does not freeze concurrent order writers. Its numeric observation is time-dependent and is **not** the final Cloudflare seed. Obtain a separate owner-approved exclusive writer-fence and post-fence consistent reread before any actual authority transfer.

## Status / next handoff
PREPARED ONLY, not executed. Owner has asked to **prepare** this function; there is no evidence yet that the owner pasted, saved, selected, ran, or retrieved its output. Preserve current exclusive Google business CREATE authority. Once owner supplies the numeric-only result, log it privately/with minimal necessary summary on the T12 branch; do not commit raw Script Properties, screenshots, tokens, other internal business/customer data or the complete Apps Script export.
