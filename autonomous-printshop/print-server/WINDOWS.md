# Windows Portable Build

The Windows package is produced by .github/workflows/autonomous-printshop-print-server-windows-package.yml.

Output artifact: TrendOS-Print-Server-Windows-Portable.zip

The ZIP contains a self-contained TrendOS-Print-Server.exe, bundled Pillow/ezdxf preview engines, editable config/local.json, and local data directories. Python is not required on the print-shop PC.

Runtime layout:

TrendOS-Print-Server/
  TrendOS-Print-Server.exe
  Start-Print-Server.bat
  README-WINDOWS.txt
  config/local.json
  data/orders/
  data/ready/
  data/state/

The EXE opens the local Arabic UI automatically. Use --no-browser for diagnostics/automation.

The current build is portable; it does not install a Windows Service, write Registry startup entries, or change TrendOS Production authority.
