// Trend Master V1931 panelized read-only backend candidate.
// IMPORTANT: this file performs reads only. Sheets / Apps Script remain authoritative.
// No production deployment is implied by committing this file to GitHub.

function trendMasterPanelPermissionsV1931_(user) {
  const role = roleFromArabic_(user && user.role, user && user.department);
  const admin = role === "admin" || searchKey_(user && user.username).indexOf("ضياء") !== -1;
  const canDebt = canManageDebtRestrictionsV1931_(user);
  return {
    canManageArchive: canManageArchiveV1931_(user),
    canManageDebtRestrictions: canDebt,
    canRunAutomation: admin,
    canInstallAutomation: admin,
    canCloseDay: admin,
    canManageStock: admin
  };
}

function trendMasterPanelBaseV1931_(panel, user) {
  return {
    success: true,
    panel: panel,
    generatedAt: new Date().toISOString(),
    permissions: trendMasterPanelPermissionsV1931_(user),
    version: "V1931_TREND_MASTER_PANEL_READ_V1"
  };
}

function trendMasterLineReadV1931_() {
  const sheet = ss_().getSheetByName(SHEET_NAME_LINES);
  if (!sheet || sheet.getLastRow() < 2) return { sheet: sheet, headers: sheet ? headersMap_(sheet) : {}, rows: [] };
  return {
    sheet: sheet,
    headers: headersMap_(sheet),
    rows: sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues()
  };
}

function trendMasterAutomationQueueReadOnlyV1931_(limit) {
  const sheet = ss_().getSheetByName(SHEET_NAME_AUTOMATION_QUEUE_V1931);
  if (!sheet || sheet.getLastRow() < 2) return [];
  return accSheetRows_(sheet).reverse().filter(function(row) {
    return normalize_(row["حالة الإرسال"]) !== "تم الإرسال";
  }).slice(0, Math.min(Number(limit || 50), 100)).map(function(row) {
    return {
      rowNumber: row.rowNumber,
      id: normalize_(row["ID"]),
      type: normalize_(row["نوع التنبيه"]),
      orderId: normalize_(row["رقم الأوردر"]),
      lineId: normalize_(row["رقم البند"]),
      customer: normalize_(row["العميل"]),
      phone: cleanPhone_(row["الهاتف"]),
      department: normalize_(row["القسم"]),
      assignedTo: normalize_(row["المستلم"]),
      status: normalize_(row["الحالة"]),
      message: normalize_(row["الرسالة"]),
      whatsappUrl: normalize_(row["رابط واتساب"]),
      sendStatus: normalize_(row["حالة الإرسال"])
    };
  });
}

function trendMasterDebtControlReadOnlyV1931_() {
  const customersSheet = ss_().getSheetByName(SHEET_NAME_CUSTOMERS);
  const restrictionsSheet = ss_().getSheetByName(SHEET_NAME_DEBT_DELIVERY_RESTRICTIONS_V1931);
  const restrictions = {};
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  if (restrictionsSheet && restrictionsSheet.getLastRow() >= 2) {
    accSheetRows_(restrictionsSheet).forEach(function(row) {
      const customer = normalize_(row["اسم العميل"]);
      const key = searchKey_(customer);
      if (!key) return;
      const activeRaw = normalize_(row["منع فعال؟"] || "نعم") === "نعم";
      const untilRaw = row["صالح حتى"];
      const until = parseDateValue_(untilRaw);
      const expired = !!(until && until.getTime() < today);
      restrictions[key] = {
        id: normalize_(row["ID"]),
        customer: customer,
        phone: cleanPhone_(row["رقم العميل"]),
        active: activeRaw && !expired,
        expired: expired,
        reason: normalize_(row["سبب المنع"]),
        validUntil: dateText_(untilRaw) || normalize_(untilRaw),
        createdBy: normalize_(row["أضيف بواسطة"]),
        updatedBy: normalize_(row["آخر تحديث بواسطة"]),
        rowNumber: row.rowNumber
      };
    });
  }

  const customers = [];
  if (customersSheet && customersSheet.getLastRow() >= 2) {
    const c = customerCols_(customersSheet);
    const values = customersSheet.getRange(2, 1, customersSheet.getLastRow() - 1, customersSheet.getLastColumn()).getValues();
    values.forEach(function(row) {
      const name = normalize_(valueAt_(row, c.name));
      const key = searchKey_(name);
      if (!key) return;
      const debtAmount = parseDebtAmount_(valueAt_(row, c.debt));
      if (debtAmount <= 0 && !restrictions[key]) return;
      customers.push({
        name: name,
        phone: cleanPhone_(valueAt_(row, c.phone)) || cleanPhone_(valueAt_(row, c.extra)),
        debtAmount: debtAmount,
        debtNotes: normalize_(valueAt_(row, c.debtNotes)),
        restriction: restrictions[key] || null
      });
    });
  }
  customers.sort(function(a, b) { return b.debtAmount - a.debtAmount || a.name.localeCompare(b.name); });
  return {
    customers: customers,
    restrictions: Object.keys(restrictions).map(function(key) { return restrictions[key]; }).sort(function(a, b) {
      return Number(b.rowNumber || 0) - Number(a.rowNumber || 0);
    })
  };
}

function trendMasterPanelReadV1931_(e) {
  const p = (e && e.parameter) || {};
  const auth = authorize_(p.username, p.token);
  if (!auth.ok) return { success: false, message: auth.message };

  const panel = normalize_(p.panel || "summary").toLowerCase();
  const base = trendMasterPanelBaseV1931_(panel, auth.user);
  const permissions = base.permissions;

  try {
    if (panel === "summary") {
      const lines = ss_().getSheetByName(SHEET_NAME_LINES);
      const archive = ss_().getSheetByName(SHEET_NAME_ARCHIVE_LINES_V1926);
      base.system = {
        activeLines: Math.max(0, lines ? lines.getLastRow() - 1 : 0),
        archivedLines: Math.max(0, archive ? archive.getLastRow() - 1 : 0),
        dataVersion: trendosDataVersionV1931_(),
        pagingEnabled: true,
        deliveryPolicy: "التسليم مفتوح للجميع؛ المنع فقط لعملاء قائمة ضياء عند وجود مديونية",
        invoicePaymentRequired: false,
        stockAutoDeduct: "عند اعتماد فاتورة القسم"
      };
      return base;
    }

    if (panel === "archive") {
      if (!permissions.canManageArchive) {
        base.archive = { success: false, rows: [], pagination: { page: 1, pageSize: 10, totalRows: 0, totalPages: 1 } };
        return base;
      }
      base.archive = getArchiveRowsV1931_({ parameter: Object.assign({}, p, {
        page: p.archivePage || p.page || 1,
        pageSize: 10,
        query: p.archiveQuery || p.query || ""
      }) });
      return base;
    }

    if (panel === "messages") {
      base.messageQueue = trendMasterAutomationQueueReadOnlyV1931_(50);
      return base;
    }

    if (panel === "stock") {
      base.stockAlerts = lowStockAlertsV1931_();
      return base;
    }

    if (panel === "employee") {
      const linesData = trendMasterLineReadV1931_();
      base.employeePerformance = employeeKpisV1931_(linesData.rows, linesData.headers);
      return base;
    }

    if (panel === "debt") {
      base.debtControl = permissions.canManageDebtRestrictions ? trendMasterDebtControlReadOnlyV1931_() : { customers: [], restrictions: [] };
      return base;
    }

    if (panel === "dayclose") {
      if (!permissions.canCloseDay) {
        base.dayClose = null;
        return base;
      }
      try {
        base.dayClose = accountingAutomationPreviewDataV1921_(accountingDateKeyV1920_(new Date()));
      } catch (err) {
        return { success: false, panel: panel, message: err && err.message ? err.message : String(err) };
      }
      return base;
    }

    return { success: false, panel: panel, message: "قسم Trend Master غير معروف." };
  } catch (err) {
    return { success: false, panel: panel, message: err && err.message ? err.message : String(err) };
  }
}
