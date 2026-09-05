/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly GOOGLE_SHEETS_WEBHOOK_URL: string;
  readonly ADMIN_WHATSAPP_PHONE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
