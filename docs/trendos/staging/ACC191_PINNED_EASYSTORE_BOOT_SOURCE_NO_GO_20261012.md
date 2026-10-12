# ACC-191 — EasyStore pinned frontend source checks (NO_GO)

Date 2026-10-12. This is an offline GitHub source and test qualification, not a live browser test.

The CI checks the exact EasyStore Git revision `373d06381594e3ab32a55009fcc74907b1c37c9c`. It compares the V1922 version and cache marker across index.html, app.js and config.js, then verifies script load order and the accounting OFF configuration.

The source checks cover existing origin, opener, nonce, freshness and one-use SSO guards; they do not authenticate a genuine staff session. Five negative mutations check source mode and version drift. Seven original EasyStore tests run on disposable checked-out source; two old cache-index-marker assertions are adapted only in their temporary test copies, using the ACC185 strict adapter.

ACC185 frontend/Worker action checks and current A2.13 disabled pilot checks also run. GitHub artifacts contain source hashes and NO_GO status, with no business records or credentials.

**Limitations:** original UI tests and source analysis are not proof of real Pages publishing, a complete graphical browser smoke test, or actual SSO/finance operating acceptance. The last reported controls stay frontend OFF, backend READONLY, all G1–G5 OPEN, financial release NO_GO.

Initially ACC191 is `IN_PROGRESS_UNVERIFIED` pending independent GitHub PR and Actions results. No release activity is authorized by this work.
