# International Virtus La Rábida

Sistema de gestión de concursos de vinos y aceites de oliva con flujo de inscripción público bilingüe (ES/EN) y dashboards de administración y catador.

## 🚀 Stack Tecnológico

- **Frontend**: React + TypeScript + Vite
- **Base de datos**: Supabase (PostgreSQL)
- **Estilos**: Tailwind CSS
- **Despliegue**: Vercel (serverless functions)
- **Email**: Brevo API
- **Pagos**: PayPal

## 📋 Configuración Inicial

### 1. Clonar el Repositorio

```bash
git clone https://github.com/jrsepul2020/virtusoftrabida.git
cd virtusoftrabida
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Variables de Entorno

Copia el archivo de ejemplo y completa las credenciales:

```bash
cp .env.local.example .env.local
```

Edita `.env.local` con tus credenciales:

- **Supabase**: Obtén credenciales en [Supabase Dashboard](https://supabase.com/dashboard)
- **Brevo**: API key de [Brevo](https://app.brevo.com/)
- **PayPal**: Client ID de [PayPal Developer](https://developer.paypal.com/)

### 4. Configurar Claude Code (Opcional)

Si usas Claude Code u otras herramientas de IA para desarrollo:

```bash
# Añade tu API key a .env.local
ANTHROPIC_API_KEY=sk-ant-api03-tu-clave-aqui
```

Ver documentación completa: [CLAUDE_CODE_SETUP.md](./CLAUDE_CODE_SETUP.md)

### 5. Iniciar Servidor de Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000` (o el siguiente puerto disponible).

## 📚 Documentación

- [Configuración de Claude Code](./CLAUDE_CODE_SETUP.md) - Setup de IA para desarrollo
- [Configuración de Vercel](./CONFIGURAR_VERCEL.md) - Despliegue y variables de entorno
- [Setup de PayPal](./PAYPAL_SETUP.md) - Integración de pagos
- [Guía de Consultas Supabase](./GUIA_SUPABASE_QUERIES.md) - Patrones de queries
- [Sistema de Puntuaciones](./SISTEMA_PUNTUACIONES.md) - Lógica de catas
- [Instrucciones RLS](./INSTRUCCIONES_RLS.md) - Seguridad de base de datos

## 🛠️ Scripts Disponibles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build para producción
npm run preview      # Preview del build
npm run typecheck    # Validación de TypeScript
npm test             # Tests con Vitest
npm run lint         # Linter (si configurado)
```

## 🏗️ Arquitectura

### Flujo de Inscripción Dual
- **Público**: `UnifiedInscriptionForm` - Wizard de 3 pasos con autoguardado en localStorage
- **Admin**: Mismo componente con `isAdmin={true}` - Permite asignación manual de códigos

### Roles y Autenticación
- Supabase Auth para admin/catador
- Jerarquía: `Administrador` > `Presidente` > `Supervisor` > `Catador`
- Acceso admin: Magic link o hash `#admin` en dev

### Internacionalización (i18n)
- Provider personalizado en `src/lib/i18n.tsx`
- Admin/catador: Solo español
- Público (inscripción, landing): Bilingüe ES/EN

## 🔒 Seguridad

⚠️ **IMPORTANTE**:
- Nunca subas archivos `.env` o `.env.local` a Git
- Las credenciales están en `.gitignore`
- RLS (Row Level Security) habilitado en Supabase
- Service Role Key solo para funciones serverless

## 🧪 Testing

```bash
npm test              # Ejecutar tests
npm run test:coverage # Con cobertura
```

Los tests usan Vitest + React Testing Library.

## 🚀 Despliegue

El proyecto se despliega automáticamente en Vercel desde la rama `main`.

Variables de entorno requeridas en Vercel:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `BREVO_API_KEY`
- `SENDER_EMAIL`
- `ADMIN_ACCESS_SECRET`
- `VITE_PAYPAL_CLIENT_ID`

Ver: [CONFIGURAR_VERCEL.md](./CONFIGURAR_VERCEL.md)

## 📧 Sistema de Email

- **Producción**: Brevo API
- **Desarrollo**: Mock server (`dev-email-server.js`)

Sender email: `info@internationalvirtus.es` (verificado en Brevo)

## 💳 Integración PayPal

- Sandbox para desarrollo
- Live para producción
- Ver setup completo: [PAYPAL_SETUP.md](./PAYPAL_SETUP.md)

## 🤝 Contribuir

1. Crea una rama para tu feature: `git checkout -b feature/nueva-funcionalidad`
2. Commit tus cambios: `git commit -m 'Add nueva funcionalidad'`
3. Push a la rama: `git push origin feature/nueva-funcionalidad`
4. Abre un Pull Request

## 📞 Soporte

Para problemas o preguntas:
1. Revisa la documentación en la carpeta raíz (archivos `.md`)
2. Verifica los logs en Supabase Dashboard o Vercel
3. Contacta al equipo de desarrollo

## 📄 Licencia

Este proyecto es propietario de International Virtus La Rábida.

