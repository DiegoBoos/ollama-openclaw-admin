# Ollama OpenClaw Admin

Panel de administración de agentes OpenClaw desplegados con Ollama.

## Arquitectura

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   Backend API     │────▶│   Ollama        │
│   (Angular)     │     │   (NestJS)        │     │   (instances)  │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌──────────────────┐
                        │   siriscloud     │
                        │   services       │
                        │ (auth, portal,   │
                        │  integrations)   │
                        └──────────────────┘
```

## Tech Stack

- **Frontend**: Angular + TailwindCSS
- **Backend**: NestJS (TypeScript)
- **DB**: PostgreSQL (compatible con siriscloud)
- **AI**: Ollama + OpenClaw CLI

## Getting Started

```bash
# Clone
git clone https://github.com/DiegoBoos/ollama-openclaw-admin.git
cd ollama-openclaw-admin

# Setup frontend
cd apps/web
npm install

# Setup backend
cd ../api
npm install

# Run
ng serve           # frontend
npm run start:dev  # backend
```

## Ambiente

Configura las variables de entorno:

```env
# API
API_URL=http://localhost:3000

# Ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_API_KEY=your-key

# OpenClaw
OPENCLAW_CLI_PATH=/usr/local/bin/openclaw

# siriscloud (conexión a servicios existentes)
SIRISCLOUD_AUTH_URL=http://localhost:3001
SIRISCLOUD_PORTAL_URL=http://localhost:3002
SIRISCLOUD_INTEGRATIONS_URL=http://localhost:3003
```

## Roadmap

- [ ] Setup proyecto Angular + NestJS
- [ ] Integración con Ollama API
- [ ] Conexión con OpenClaw CLI (`openclaw launch`)
- [ ] Panel de gestión de agentes
- [ ] Integración con siriscloud-auth
- [ ] Integración con siriscloud-portal
- [ ] Integración con siriscloud-integrations-service

## Licencia

MIT