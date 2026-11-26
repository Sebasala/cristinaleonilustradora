// Vincular este script al archivo de Google Sheets que contiene la hoja "Pedidos".
const ORDER_SHEET_NAME = "Pedidos";
const ORDER_COLUMNS = [
  "ID Orden",
  "Fecha",
  "Estado",
  "Formato",
  "Cantidad",
  "Subtotal",
  "Envío",
  "Total",
  "Nombre",
  "Cédula",
  "Celular",
  "Email",
  "Departamento",
  "Municipio",
  "Dirección",
  "Barrio",
  "Complemento",
  "Notas",
  "# Guía",
];
const ORDER_FORMATS = { "desk-2027": "Escritorio", "wall-2027": "Pared" };

function orderResponse(result) {
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

function safeOrderText(value) {
  return /^[\s\u0000-\u001f]*[=+\-@]/.test(value) ? "'" + value : value;
}

function isValidOrder(data) {
  if (!data || typeof data !== "object" || !data.shipping || !data.customer)
    return false;
  const amounts = [
    data.unitPrice,
    data.subtotal,
    data.shippingCost,
    data.total,
  ];
  const shippingFields = [
    "department",
    "city",
    "address",
    "neighborhood",
    "complement",
    "deliveryNotes",
  ];
  const customerFields = ["fullName", "phone", "email", "documentId"];
  return (
    typeof data.orderId === "string" &&
    /^CL27-[A-HJ-NP-Z2-9]{10}$/.test(data.orderId) &&
    typeof data.createdAt === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(data.createdAt) &&
    !isNaN(Date.parse(data.createdAt)) &&
    Object.prototype.hasOwnProperty.call(ORDER_FORMATS, data.variant) &&
    Number.isInteger(data.quantity) &&
    data.quantity >= 1 &&
    data.quantity <= 10 &&
    amounts.every((value) => Number.isSafeInteger(value) && value >= 0) &&
    data.subtotal === data.unitPrice * data.quantity &&
    data.total === data.subtotal + data.shippingCost &&
    shippingFields.every((field) => typeof data.shipping[field] === "string") &&
    customerFields.every((field) => typeof data.customer[field] === "string")
  );
}

function orderRow(data) {
  const shipping = data.shipping;
  const customer = data.customer;
  return [
    data.orderId,
    new Date(data.createdAt),
    "Pendiente de pago",
    ORDER_FORMATS[data.variant],
    data.quantity,
    data.subtotal,
    data.shippingCost,
    data.total,
    safeOrderText(customer.fullName),
    safeOrderText(customer.documentId),
    safeOrderText(customer.phone),
    safeOrderText(customer.email),
    safeOrderText(shipping.department),
    safeOrderText(shipping.city),
    safeOrderText(shipping.address),
    safeOrderText(shipping.neighborhood),
    safeOrderText(shipping.complement),
    safeOrderText(shipping.deliveryNotes),
    "",
  ];
}

function sameOrderRow(existing, expected) {
  return expected.every((value, index) => {
    if (index === 2 || index === 18) return true;
    const stored = existing[index];
    if (index === 1 && value instanceof Date) {
      const storedDate =
        stored instanceof Date
          ? stored
          : typeof stored === "string"
            ? new Date(stored)
            : null;
      return (
        storedDate instanceof Date &&
        !isNaN(storedDate.getTime()) &&
        storedDate.getTime() === value.getTime()
      );
    }
    if (typeof value !== "string") return stored === value;
    return (
      String(stored) === value ||
      (value.startsWith("'") && String(stored) === value.slice(1))
    );
  });
}

function doPost(e) {
  let locked = false;
  const lock = LockService.getScriptLock();
  try {
    const data = JSON.parse(e.postData.contents);
    if (!isValidOrder(data))
      return orderResponse({ ok: false, error: "INVALID_ORDER" });
    if (!lock.tryLock(7000))
      return orderResponse({ ok: false, error: "LOCK_TIMEOUT" });
    locked = true;

    const sheet =
      SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ORDER_SHEET_NAME);
    if (
      !sheet ||
      sheet.getLastColumn() !== ORDER_COLUMNS.length ||
      sheet
        .getRange(1, 1, 1, ORDER_COLUMNS.length)
        .getValues()[0]
        .some((value, index) => value !== ORDER_COLUMNS[index])
    ) {
      return orderResponse({ ok: false, error: "INVALID_SHEET" });
    }

    const row = orderRow(data);
    const rowCount = sheet.getLastRow() - 1;
    if (rowCount > 0) {
      const ids = sheet.getRange(2, 1, rowCount, 1).getValues();
      const index = ids.findIndex((entry) => entry[0] === data.orderId);
      if (index !== -1) {
        const existing = sheet
          .getRange(index + 2, 1, 1, ORDER_COLUMNS.length)
          .getValues()[0];
        if (!sameOrderRow(existing, row)) {
          return orderResponse({ ok: false, error: "ORDER_ID_CONFLICT" });
        }
        return orderResponse({
          ok: true,
          orderId: data.orderId,
          duplicate: true,
        });
      }
    }

    const nextRow = sheet.getLastRow() + 1;
    sheet.getRange(nextRow, 1).setNumberFormat("@");
    sheet.getRange(nextRow, 2).setNumberFormat("yyyy/MM/dd HH:mm");
    sheet.getRange(nextRow, 9, 1, 10).setNumberFormat("@");
    sheet.getRange(nextRow, 1, 1, ORDER_COLUMNS.length).setValues([row]);
    SpreadsheetApp.flush();
    return orderResponse({ ok: true, orderId: data.orderId });
  } catch (error) {
    console.error(
      "Could not register order.",
      error instanceof SyntaxError ? "INVALID_JSON" : "SCRIPT_ERROR",
    );
    return orderResponse({ ok: false, error: "SCRIPT_ERROR" });
  } finally {
    if (locked) lock.releaseLock();
  }
}
