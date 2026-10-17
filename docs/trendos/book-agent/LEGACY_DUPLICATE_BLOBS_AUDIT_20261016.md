# Verified exact-byte duplicate Git blobs — TrendOS archive triage (2026-10-16)

- Source: `fawakhry/TrendOs` branch `agent/trendos-book-audit-v1-20261014`, tree at `10a380b5127063bd8cf92de67f2aa7a22e103e74`.
- Enumerated 2006 blobs and 101 exact-blob SHA groups (202 file paths across those groups).
- There are **9** duplicate groups containing Apps Script `.gs` files, covering **18** file paths.
- Git SHA-1 blob parity verifies same bytes inside each group. This **does not** prove file inactivity, safe removal, redundant runtime deployment, ownership transfer, or an active conflict.
- Overall classification: `UNKNOWN_NEEDS_PROOF`; confirmed duplicate property: `DUPLICATE_BYTES_VERIFIED`; do not change to `CONFLICTING_DUPLICATE` without proof of conflicting load paths.
- Historical snapshots, deploy build inputs and runtime Apps Script project membership must be checked before any movement. `APPROVED_FOR_DELETE=0`.

## First exact-path audit candidate set — mirrored `.gs` only

| Root file | Mirrored file under autonomous-printshop | Git blob SHA | Bytes | Status |
|---|---|---|---:|---|
| `trendos-integrity-dashboard-v1.gs` | `autonomous-printshop/sources/trendos/control-tower/trendos-integrity-dashboard-v1.gs` | `9ce3a4c3e1a11f318a7d1c87b12d6cf0c14aa838` | 18465 | UNKNOWN_NEEDS_PROOF; NO_DELETE |
| `v1940-deploy-health.gs` | `autonomous-printshop/sources/trendos/control-tower/v1940-deploy-health.gs` | `41e57f19de8e865888a1b8bad2cc478c44c438c3` | 2569 | UNKNOWN_NEEDS_PROOF; NO_DELETE |
| `customer-manager-backend-v1932.gs` | `autonomous-printshop/sources/trendos/customer-comms/customer-manager-backend-v1932.gs` | `8c645d72abaa68431fe6a0213f3b96af3f27e42f` | 14313 | UNKNOWN_NEEDS_PROOF; NO_DELETE |
| `trendos-whatsapp-integrity-v1.gs` | `autonomous-printshop/sources/trendos/customer-comms/trendos-whatsapp-integrity-v1.gs` | `c3e59c50f17de2604f0192a5b8f651e53caf9018` | 16169 | UNKNOWN_NEEDS_PROOF; NO_DELETE |
| `press-control-backend-v1.gs` | `autonomous-printshop/sources/trendos/machine-agent/press-control-backend-v1.gs` | `ba544600f19bd5ea59dbf7efcde9440a0c758b97` | 6824 | UNKNOWN_NEEDS_PROOF; NO_DELETE |
| `gaber-material-persistence-backend-v1.gs` | `autonomous-printshop/sources/trendos/material-control/gaber-material-persistence-backend-v1.gs` | `c8890c62e6a230492ceb9499392508a946c18ec5` | 22892 | UNKNOWN_NEEDS_PROOF; NO_DELETE |
| `gaber-material-ui-backend-v1.gs` | `autonomous-printshop/sources/trendos/material-control/gaber-material-ui-backend-v1.gs` | `a3615c1745e0f839c6dc310ce5fac301fefcbabc` | 20055 | UNKNOWN_NEEDS_PROOF; NO_DELETE |
| `gaber-material-waste-decision-v1.gs` | `autonomous-printshop/sources/trendos/material-control/gaber-material-waste-decision-v1.gs` | `c321849222accab379b46a872da94ac09b0a4049` | 2717 | UNKNOWN_NEEDS_PROOF; NO_DELETE |
| `operator-task-workflow-v2.gs` | `autonomous-printshop/sources/trendos/operator-task/operator-task-workflow-v2.gs` | `e2ee3c460756eb39d711e93809f1073ca1aa3821` | 21482 | UNKNOWN_NEEDS_PROOF; NO_DELETE |

## Required proof for each proposed cleanup

1. Find caller references, build manifests and deployment membership on actual deployed versions, not merely Git HEAD.
2. Check file creation commit and last change, ascertain intentionally mirrored packaging vs stale orphan.
3. Copy each proposed removal candidate to a separately recoverable archive, verify SHA and restore test.
4. Obtain owner explicit approval for an exact path list; never auto-delete, merge or deploy.

## Full repository duplicate-group inventory (SHA and paths only)

These are structural duplicate blobs, not necessarily duplicate source-code units. No original source bodies are reproduced.

1. `9a2df860c870f6ec797e36253ee5fce1087a37f2` (5481 bytes): `OPERATOR_TASK_WORKFLOW_V2_CANDIDATE.md`; `autonomous-printshop/sources/trendos/operator-task/OPERATOR_TASK_WORKFLOW_V2_CANDIDATE.md`
2. `406c5be0fccb959fc8ab0bebba2123da01682506` (65186 bytes): `WHATS_AGENT_BOOK.md`; `autonomous-printshop/sources/trendos/books/WHATS_AGENT_BOOK.md`
3. `3b8889d96a00d7f9300a1c3146cd78de10886952` (2859 bytes): `WORK_QUEUE_V1_CANDIDATE.md`; `autonomous-printshop/sources/trendos/lineage/WORK_QUEUE_V1_SUPERSEDED.md`
4. `07e79efe9dc2f72d681820355d1044d6a1713db1` (8563 bytes): `autonomous-printshop/sources/trendos/control-tower/go-live-autopilot-v1.js`; `go-live-autopilot-v1.js`
5. `105facf54f263ab2eb2fa1a014afb3651b251232` (16224 bytes): `autonomous-printshop/sources/trendos/control-tower/trend-master-resilience-v1931.js`; `trend-master-resilience-v1931.js`
6. `9ce3a4c3e1a11f318a7d1c87b12d6cf0c14aa838` (18465 bytes): `autonomous-printshop/sources/trendos/control-tower/trendos-integrity-dashboard-v1.gs`; `trendos-integrity-dashboard-v1.gs`
7. `41e57f19de8e865888a1b8bad2cc478c44c438c3` (2569 bytes): `autonomous-printshop/sources/trendos/control-tower/v1940-deploy-health.gs`; `v1940-deploy-health.gs`
8. `2426aec33e79f1e16615ad1263fa8244d4742c45` (1907 bytes): `autonomous-printshop/sources/trendos/customer-comms/customer-feedback-v1.js`; `customer-feedback-v1.js`
9. `8c645d72abaa68431fe6a0213f3b96af3f27e42f` (14313 bytes): `autonomous-printshop/sources/trendos/customer-comms/customer-manager-backend-v1932.gs`; `customer-manager-backend-v1932.gs`
10. `c952a64e914fe0434307ed22a41c374e255d0352` (2173 bytes): `autonomous-printshop/sources/trendos/customer-comms/customer-manager-send-integrity-v1.js`; `customer-manager-send-integrity-v1.js`
11. `9627116f22f00eb5d7282638c19dbe95d89332f7` (8957 bytes): `autonomous-printshop/sources/trendos/customer-comms/customer-manager-v1.js`; `customer-manager-v1.js`
12. `c3e59c50f17de2604f0192a5b8f651e53caf9018` (16169 bytes): `autonomous-printshop/sources/trendos/customer-comms/trendos-whatsapp-integrity-v1.gs`; `trendos-whatsapp-integrity-v1.gs`
13. `f4697c717f40fc4cb0c8563b8b62640aa2a05785` (15834 bytes): `autonomous-printshop/sources/trendos/employee-supervisor/employee-manager-strips-v2.js`; `employee-manager-strips-v2.js`
14. `1ce5a53852dc2321e9c415807cf129882010d9b3` (9603 bytes): `autonomous-printshop/sources/trendos/employee-supervisor/employee-ops-coach-v1.js`; `employee-ops-coach-v1.js`
15. `6c5220daefeb331c9dd6afd948342780c0dafee7` (6093 bytes): `autonomous-printshop/sources/trendos/employee-supervisor/operations-hub-v1.js`; `operations-hub-v1.js`
16. `ba544600f19bd5ea59dbf7efcde9440a0c758b97` (6824 bytes): `autonomous-printshop/sources/trendos/machine-agent/press-control-backend-v1.gs`; `press-control-backend-v1.gs`
17. `3a35c53400932052923f2d4372c6b7d9b69a9377` (9177 bytes): `autonomous-printshop/sources/trendos/machine-agent/press-control-v1.js`; `press-control-v1.js`
18. `2826e1e6028d5cbfefafea3890c2709c4227b01f` (8402 bytes): `autonomous-printshop/sources/trendos/material-control/gaber-daily-material-flow-v1.js`; `gaber-daily-material-flow-v1.js`
19. `e2916d475c963737cb41b14858e3eefeea773a4f` (14437 bytes): `autonomous-printshop/sources/trendos/material-control/gaber-easystore-ledger-adapter-v1.js`; `gaber-easystore-ledger-adapter-v1.js`
20. `5d1cce2f88e2a06e7f7f928ba89b6442e4e19861` (4774 bytes): `autonomous-printshop/sources/trendos/material-control/gaber-ledger-daily-report-v1.js`; `gaber-ledger-daily-report-v1.js`
21. `03bb4028bf983dd0a94064ada3094b1b8e307ab0` (16363 bytes): `autonomous-printshop/sources/trendos/material-control/gaber-material-control-v1.js`; `gaber-material-control-v1.js`
22. `654c897bf199ec8e51ef6c1063bf5eb00b4d94b6` (9422 bytes): `autonomous-printshop/sources/trendos/material-control/gaber-material-movement-ledger-v1.js`; `gaber-material-movement-ledger-v1.js`
23. `c8890c62e6a230492ceb9499392508a946c18ec5` (22892 bytes): `autonomous-printshop/sources/trendos/material-control/gaber-material-persistence-backend-v1.gs`; `gaber-material-persistence-backend-v1.gs`
24. `1b57199e529f53e66dd12a28f098c3dba30581a1` (7132 bytes): `autonomous-printshop/sources/trendos/material-control/gaber-material-persistence-v1.js`; `gaber-material-persistence-v1.js`
25. `a3615c1745e0f839c6dc310ce5fac301fefcbabc` (20055 bytes): `autonomous-printshop/sources/trendos/material-control/gaber-material-ui-backend-v1.gs`; `gaber-material-ui-backend-v1.gs`
26. `32eefbeaed8f340c3bd4a64e9ece53611f5c9c53` (19482 bytes): `autonomous-printshop/sources/trendos/material-control/gaber-material-ui-v1.js`; `gaber-material-ui-v1.js`
27. `c321849222accab379b46a872da94ac09b0a4049` (2717 bytes): `autonomous-printshop/sources/trendos/material-control/gaber-material-waste-decision-v1.gs`; `gaber-material-waste-decision-v1.gs`
28. `7ef7aa4a52246d6423ccd8c27c9457b76bcc8643` (9427 bytes): `autonomous-printshop/sources/trendos/operator-task/operator-task-edge-v2.mjs`; `cloudflare-d1/src/operator-task-edge-v2.mjs`
29. `e2ee3c460756eb39d711e93809f1073ca1aa3821` (21482 bytes): `autonomous-printshop/sources/trendos/operator-task/operator-task-workflow-v2.gs`; `operator-task-workflow-v2.gs`
30. `5877b083903fe3cdf5124744a9c2677edae3f1fd` (17122 bytes): `autonomous-printshop/sources/trendos/operator-task/operator-task-workflow-v2.js`; `operator-task-workflow-v2.js`
31. `04d91cecc756d5cde44d684c1118f122fd97442f` (10336 bytes): `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_BACKEND_UNIFICATION_HANDOFF.md`; `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_BACKEND_UNIFICATION_HANDOFF.md`
32. `5c6eebf7db5f3b577b0031397c10cafe32b94994` (3385 bytes): `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AA_02AF.md`; `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AA_02AF.md`
33. `1e6d4b24976e8f30689fd924ae846a9517c239d5` (898 bytes): `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AG.md`; `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AG.md`
34. `f6bd3bd004061e84f019202190fd44b08938a0a3` (803 bytes): `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AH.md`; `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AH.md`
35. `9eef808e256e8607f79dc6adeaf1a2bdc9d51d03` (1728 bytes): `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AI_02AJ.md`; `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AI_02AJ.md`
36. `d11288f25b17002a754dde8908fe78d7f046ea66` (1890 bytes): `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AK_02AL.md`; `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AK_02AL.md`
37. `426cd78c793261a7c8395ef5a654621421fb8109` (1921 bytes): `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AM.md`; `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AM.md`
38. `3b7189726c9b1f196f1fc9c78deea9976508c782` (4775 bytes): `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AN_02AP.md`; `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AN_02AP.md`
39. `52cce18f7242051b36ad5cfce209bede311ecf02` (1249 bytes): `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AR.md`; `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AR.md`
40. `3b2704d09687d257f430bf6193b7d2fd3f28de1d` (684 bytes): `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AS.md`; `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AS.md`
41. `ab69b48eb2d98d78a49b494b91f4997ddafe6076` (1238 bytes): `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AT.md`; `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AT.md`
42. `f37b669ac18fd2d9ec6080553f3a84fb8426036f` (2702 bytes): `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AU.md`; `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AU.md`
43. `fdcbc05b44f5ddeeaccbc80af42ba90d3bb64f02` (1609 bytes): `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AV.md`; `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AV.md`
44. `5f4d3f59f50b0dcccd155681ee5f6ee9075bc9bd` (1583 bytes): `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AW.md`; `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AW.md`
45. `8cb2a706bd237b09939c284e182723dc769057a4` (2238 bytes): `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AX.md`; `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AX.md`
46. `e7eeba83f7b73c38135ad78d7d042f67f3388011` (1351 bytes): `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AY.md`; `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AY.md`
47. `cadb023628c6f674f5ec61b35d9a101227992dde` (1147 bytes): `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AZ.md`; `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AZ.md`
48. `4dc870386934688eaab4338452e44a30526bd214` (1077 bytes): `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02BA.md`; `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02BA.md`
49. `b74b8d8b81ce2ebc564c3d0dca2c8c0bda83dadf` (1423 bytes): `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02BB.md`; `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02BB.md`
50. `e43f0a0f06a4cf86841a5be7dde479804bce00d3` (955 bytes): `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02BC.md`; `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02BC.md`
51. `288f97d3f17b1b0c486e6641d15b2968d258855b` (1311 bytes): `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02BD.md`; `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02BD.md`
52. `d3d731650000ee117954f29b530ed47d6edf93d9` (1473 bytes): `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02BE.md`; `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02BE.md`
53. `577dff1e595f1b14033261b0cc3cec02d448294c` (1142 bytes): `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02BF.md`; `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02BF.md`
54. `ff9a0c546745713718b1805ba8e969f3a64f9268` (1096 bytes): `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02BG.md`; `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02BG.md`
55. `aa75e3f3fc98dc4cda7fb11bdb08b008bd62d1aa` (2323 bytes): `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02R.md`; `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02R.md`
56. `5e74672ddf0be7d9030651e3ad186939320c279d` (1885 bytes): `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02S_02T.md`; `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02S_02T.md`
57. `664aa5262d9d028f968a4b9946499993584c5da3` (1305 bytes): `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02U.md`; `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02U.md`
58. `8acaa7a0ede806f7ea4100ba50ba284aa0e26ce1` (1614 bytes): `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02V.md`; `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02V.md`
59. `c1cdcdcde4f7f766609eefd532b72a1a2a03994a` (1948 bytes): `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02W.md`; `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02W.md`
60. `3bbbe5bab3b23b5db399d526dd8e19dab7667b21` (2886 bytes): `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BH_02BJ.md`; `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BH_02BJ.md`
61. `3ce102997b9288195e334adf852f4f6731ea9916` (1330 bytes): `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BL.md`; `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BL.md`
62. `02584806ea01aba83d24057ecbd1a0edc4b628ae` (1349 bytes): `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BM.md`; `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BM.md`
63. `7fa9ad7ae85df4a7dca6f93baec307dc78ce13c8` (1010 bytes): `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BN.md`; `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BN.md`
64. `f442866b3e7bca71f9ac7c0a35bb991e80027042` (1763 bytes): `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BP.md`; `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BP.md`
65. `93cec2f3f797097502bb22a89455f8497ef34600` (1334 bytes): `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BQ.md`; `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BQ.md`
66. `8995da383185f19202a07f5afac5b72f94631632` (907 bytes): `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BR.md`; `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BR.md`
67. `5c4f4830568e09fe9817f82ed860b03f75fe9648` (627 bytes): `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BS.md`; `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BS.md`
68. `47b3022024b0b64faec390d6a564b32067fca646` (1032 bytes): `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BT.md`; `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BT.md`
69. `a8fdbf91bd77986f3ec3f1a4bf932ab439c6cdc8` (704 bytes): `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BU.md`; `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BU.md`
70. `2f2f52cba906cdf6f5dbf0dc54a7c94defc1f037` (690 bytes): `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BV.md`; `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BV.md`
71. `a6771997f774a278233d666cb95e968f4271c821` (812 bytes): `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BW.md`; `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BW.md`
72. `5f8f638c830cb29ee3ad7ff8e9e795525ab090ed` (2202 bytes): `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BX.md`; `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BX.md`
73. `c85a5e073a6d227f63f2b3f3f73a7bb8287fc7a2` (4526 bytes): `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BY.md`; `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BY.md`
74. `af497cf63e7ab97399f368009c92e60c065def5b` (3954 bytes): `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BZ.md`; `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BZ.md`
75. `09d4fd98e43eff4847df29377995458d9331244d` (4848 bytes): `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CA.md`; `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CA.md`
76. `4d41552a3f5c3d10194298b1e05486ce3c53aaa3` (2062 bytes): `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CA_FINAL_VERIFY.md`; `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CA_FINAL_VERIFY.md`
77. `73b1c3ce5a06a56118b7e694361fa3325342d4f3` (2934 bytes): `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CB.md`; `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CB.md`
78. `55834ce89c1469f33252e633b0e968220a02aede` (2780 bytes): `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CB_PRODUCTION_SHADOW_STABILITY_PASS.md`; `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CB_PRODUCTION_SHADOW_STABILITY_PASS.md`
79. `21627cd8973a8b160446c0ff2cf5cfbf419b5795` (3402 bytes): `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CC.md`; `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CC.md`
80. `6277b9b0e0a81be8f9f836b8f8ddce64500127f9` (4711 bytes): `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CC_CLOUD_WRITE_READINESS_REVIEW_PASS.md`; `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CC_CLOUD_WRITE_READINESS_REVIEW_PASS.md`
81. `e2d0f2f973712987c7f56e09689a8b4d86b3938e` (1505 bytes): `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CC_CLOUD_WRITE_READINESS_REVIEW_START.md`; `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CC_CLOUD_WRITE_READINESS_REVIEW_START.md`
82. `d7dcae9b279d3595a25906f7a5b718b74bdf05d7` (2278 bytes): `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CC_READONLY_PROBE_SELF_MATCH_DIAGNOSIS.md`; `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CC_READONLY_PROBE_SELF_MATCH_DIAGNOSIS.md`
83. `d90ad3a9fcea047f1be7f5937e2e52a2a574ffdd` (2022 bytes): `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CC_STALE_PRODUCTION_DB_ID_DIAGNOSIS.md`; `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CC_STALE_PRODUCTION_DB_ID_DIAGNOSIS.md`
84. `0c1935a1173d61b86cf16e8726a8c26404924670` (4606 bytes): `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CD.md`; `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CD.md`
85. `74012a50effc8953dd0fcc2de279f5482f19e816` (2882 bytes): `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CD_PENDING_MIGRATIONS_BLOCKER.md`; `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CD_PENDING_MIGRATIONS_BLOCKER.md`
86. `60073cecf9f402243a290b6bff7d5e43ae310ceb` (2703 bytes): `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CD_PENDING_MIGRATIONS_READONLY_START.md`; `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CD_PENDING_MIGRATIONS_READONLY_START.md`
87. `be1dcf70ac0aef8120b5577bdb357a21be581cdf` (4339 bytes): `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CE.md`; `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CE.md`
88. `8970546c26c4d6f62438d1677a0e747068506cc3` (2647 bytes): `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CE_METADATA_QUERY_MEASUREMENT_FAILURE.md`; `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CE_METADATA_QUERY_MEASUREMENT_FAILURE.md`
89. `6152c4bfcb71c9f261b21f7fc5193716f0f20eee` (2625 bytes): `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CE_MIGRATION_LEDGER_RECONCILIATION_REVIEW_START.md`; `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CE_MIGRATION_LEDGER_RECONCILIATION_REVIEW_START.md`
90. `ef24b99dd7d29799be78360a84852d6ce9840bf7` (3001 bytes): `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CF_PASS.md`; `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CF_PASS.md`
91. `38460996cc0c93c11f87d5080de91e7ed7f13ed5` (2578 bytes): `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CF_START.md`; `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CF_START.md`
92. `f073bca9936679629bb9b5993d07987e720e18a6` (3231 bytes): `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CG_PASS.md`; `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CG_PASS.md`
93. `47482b7dc3c4d4ff65b414b81b80862bcef8b196` (2309 bytes): `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CG_START.md`; `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CG_START.md`
94. `aaea7e79314baa59528aeb6bdfce0d4f1d4bdd93` (1550 bytes): `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CH_CONTRACT_FALSE_POSITIVE.md`; `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CH_CONTRACT_FALSE_POSITIVE.md`
95. `aad89fb71053ad4aa80e37db5bf4956a8d109324` (2176 bytes): `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CH_CONTROLLED_CONTRACT_START.md`; `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CH_CONTROLLED_CONTRACT_START.md`
96. `be7b40ceac5d5a00577b3a53bb9ca8b6e9a428c8` (4980 bytes): `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CH_PASS.md`; `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CH_PASS.md`
97. `0187ba4f3d0fbaabd91f24aaf74fabe72a6f6ae2` (2288 bytes): `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CH_START.md`; `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CH_START.md`
98. `450ea626677ae82113d5e0c10a2667d66e03135f` (5792 bytes): `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CI.md`; `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CI.md`
99. `8cad4f3bcbf39aacaf639302c874bb309f5fc63d` (3991 bytes): `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CJ_LEDGER_RECONCILIATION_ON_STATE_AUTHORIZED_START.md`; `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CJ_LEDGER_RECONCILIATION_ON_STATE_AUTHORIZED_START.md`
100. `c5b2a072b6dccd1a7e6d54ea309839e00a0c8c30` (5182 bytes): `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CJ_PRODUCTION_LEDGER_RECONCILIATION_PASS.md`; `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CJ_PRODUCTION_LEDGER_RECONCILIATION_PASS.md`
101. `b7040cc9ef6dc130d84ed8dce09eccce3cf0dbc3` (3978 bytes): `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PLATFORM_CF_SCOPE_AND_CURRENT_STATE.md`; `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PLATFORM_CF_SCOPE_AND_CURRENT_STATE.md`

**Gates:** SOURCE_ONLY=YES; TESTED=NO; PRODUCTION_VERIFIED=NO; RESTORE_TEST=NO; CLEANUP_APPROVED=NO; REMOVALS=0.
