# SERVER-139 — Ubuntu isolated stage checkpoint

Owner screenshot on October 23, 2026 at 23:12 Cairo time showed a successful detached checkout in the existing Ubuntu stage sandbox.

Previous HEAD: 978b9f2. Current pinned HEAD: e599835802d7d1fe3da9bf1fdda03156ead49bc6. The revision includes SERVER-136 source and its fake-only CI, previously confirmed 11/11 passing. No real GraphQL call has been run, and the underlying stage HTTP 403 remains unresolved.

Next owner action: invoke SERVER-136 script with `--help` using the existing sandbox path, and report the output. The help path makes no network request, accesses no secrets and performs no orders, printing or laser operations.

This is a supplemental Ubuntu server-book entry, preserving existing book history without overwrites.
