// Script para pegar en Google Apps Script (Extensiones → Apps Script) del Google Sheet destino.
// Después de pegarlo: Implementar → Nueva implementación → tipo "Aplicación web",
// ejecutar como "Yo", acceso "Cualquiera", y copiar la URL /exec como GOOGLE_SHEETS_WEBHOOK_URL.

// Deben coincidir con FIELD_NAMES en contenido.ts.
const COLUMNS = [
  "nombre",
  "whatsapp",
  "location",
  "motivacion",
  "disponibilidad",
  "esquema_pago",
  "autorizacion_datos"
];

function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = JSON.parse(e.postData.contents);

  const row = [new Date(), ...COLUMNS.map((column) => data[column] || "")];
  sheet.appendRow(row);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
