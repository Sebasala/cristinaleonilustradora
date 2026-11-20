# Cristina León — Sitio artístico

Sitio web de la artista visual e ilustradora Cristina León. Incluye su
portafolio, biografía, talleres, calendario ilustrado y captura de clientes
potenciales.

## Tecnologías

- [Astro](https://docs.astro.build/) para las páginas y componentes
- MDX para contenido de páginas
- SCSS para estilos
- Nanostores para el estado del catálogo y el checkout
- Netlify Functions para el endpoint de captación de leads

## Requisitos

- Node.js 22
- pnpm 10 o posterior

## Instalación y desarrollo

```sh
corepack enable
corepack pnpm install --frozen-lockfile
corepack pnpm dev
```

El servidor local usa por defecto `http://localhost:4321`.

Para ejecutar el sitio junto con las funciones de Netlify:

```sh
corepack pnpm netlify:dev
```

## Comandos

| Comando | Acción |
| :--- | :--- |
| `corepack pnpm dev` | Inicia el servidor de desarrollo |
| `corepack pnpm start` | Alias de `pnpm dev` |
| `corepack pnpm build` | Genera la versión de producción en `dist/` |
| `corepack pnpm preview` | Previsualiza la compilación local |
| `corepack pnpm astro ...` | Ejecuta comandos de la CLI de Astro |
| `corepack pnpm netlify:dev` | Ejecuta Astro y las funciones con Netlify Dev |

La validación principal del sitio es:

```sh
corepack pnpm build
```

## Captura de leads y variables de entorno

El formulario del Taller de Ilustración Poética, disponible en
`/talleres/ilustracion-poetica/`, envía los datos a `POST /api/lead`.
La función `netlify/functions/lead.ts` recibe el objeto JSON y reenvía sus
campos de tipo texto a `GOOGLE_SHEETS_WEBHOOK_URL`.

| Variable | Uso |
| :--- | :--- |
| `GOOGLE_SHEETS_WEBHOOK_URL` | URL del webhook que recibe los datos capturados |
| `ADMIN_WHATSAPP_PHONE` | Número opcional devuelto al frontend después de registrar un lead |

Configúralas en el entorno local de Netlify o en las variables de entorno del
sitio desplegado. Nunca agregues secretos al repositorio.

## Estructura

```text
src/
├── components/   Componentes Astro reutilizables
├── content/      Contenido MDX
├── data/         Catálogos y datos de calendario, talleres y territorio
├── layouts/      Plantillas generales y privadas
├── pages/        Rutas públicas y página de privacidad
├── scripts/      Captura y distribución de leads
├── stores/       Estado reactivo del carrito y el checkout
├── styles/       Estilos globales y módulos SCSS
└── utils/        Utilidades compartidas

netlify/functions/   Funciones serverless desplegadas por Netlify
public/              Archivos estáticos, imágenes y redirecciones
apps-script/         Integraciones auxiliares de Google Apps Script
```

## Rutas principales

- `/` — Portafolio principal
- `/biografia/` — Información sobre la artista
- `/calendario/` — Catálogo y checkout del calendario
- `/talleres/` — Talleres disponibles
- `/talleres/ilustracion-poetica/` — Taller y formulario de captación de leads
- `/politica-de-privacidad/` — Política de privacidad

## Checkout: validación de dirección

`$shippingAddress` y `$shippingAddressValidity` se exportan desde
`src/stores/orderStore.ts`. Los valores de dirección se normalizan al escribir y
se guardan en `sessionStorage` junto con el resto del checkout.

Para mostrar los errores de los campos obligatorios antes de continuar,
`CAL-05C` puede emitir el evento síncrono
`window.dispatchEvent(new Event('checkout:validate-all'))` y buscar el primer
campo inválido con
`document.querySelector('[data-shipping-address] [aria-invalid="true"]')`.
Los wrappers identifican los campos mediante `data-field`. El consumidor se
encarga del desplazamiento y del control de avance.
