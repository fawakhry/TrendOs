# AP-250 — Ubuntu desktop shortcut for the offline Print Server preview

**Status:** staged on GitHub only. The shortcut has **not** been installed or used on the owner's Ubuntu desktop. This is not production Print Server activation.

## Intended behavior

After separately approved installation, the desktop icon **TrendOS Print Server (Offline 75s)** runs:

- `/usr/bin/python3 -B <owner home>/TrendOs/autonomous-printshop/print-server/open_offline_ui.py`
- `open_offline_ui.py` invokes the existing AP-247 `offline_pilot.py`, observes its strictly checked ephemeral `127.0.0.1` readiness URL, and requests an existing Firefox installation to open it.
- The existing offline pilot binds localhost, exposes GET-only synthetic APIs, disables TrendOS cloud/Fast Mode, and is code-configured to stop automatically after 75 seconds.
- The desktop icon uses `Terminal=false`. It is a preview convenience, **not** a persistent system service, printing capability, order sync or cloud login.

## Installation is separately owner-gated

The staged `prepare_offline_desktop.py` is read-only by default (`--preview`); **only** an explicit `--install` argument attempts to create one file:

`$HOME/Desktop/TrendOS-Offline-75s.desktop`

The file uses a fixed, absolute, shell-free Python Exec target, is created with exclusive-create / no-follow flags, refuses overwrite, and requires an existing expected checkout, launcher and ordinary Desktop directory. It does not create the Desktop folder, install software, mark GNOME metadata trusted, alter the firewall, add services, fetch Git, or start Firefox/pilot. Root execution is refused. A localized/nonstandard Desktop location causes a safe stop until separately reviewed.

**Ubuntu GNOME note:** a newly created .desktop file may appear as untrusted until the owner manually uses **Allow Launching** from the desktop context menu. Do not programmatically bypass the desktop's trust prompt. A silent launch failure is possible with `Terminal=false`; therefore owner Firefox screenshot and controlled shutdown evidence are still required in a separately authorized qualification.

## Qualification already obtained

- AP-248 on the real Ubuntu host: Firefox page render and matching terminal safe-stop screenshot, **PASS**.
- AP-249: 8/8 hosted process/browser-mock tests, **PASS**. Owner Ubuntu use **NOT tested**.
- AP-250: 12/12 GitHub-hosted shortcut tests using isolated temporary fake home and Desktop directories, **PASS**.
  - [AP-250 hosted workflow](https://github.com/fawakhry/TrendOs/actions/runs/38260453777) / run `38260453777`, job `114849293996`.
  - No owner's actual desktop, Firefox, print job, repository working tree, Cloudflare or customer files were touched in those hosted tests.

## Owner approval checkpoint

Before requesting any actual installation: explicitly ask for permission to update Ubuntu project files to a pinned reviewed GitHub commit (no `pull`, `reset`, `checkout`, `merge`; use owner-operated guarded fetch and fast-forward only with separate authorization), then separately obtain approval for creating the single Desktop file. Give the owner **one Ubuntu command at a time**, wait for a screenshot, then ask permission for a one-time test activation of the icon.

Never interpret GitHub-only staging as an Ubuntu deployment. PR #95 must remain Draft and unmerged without owner approval.
