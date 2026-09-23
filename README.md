# Fleet Monitoring

Dashboard de supervision applicative pour **Fleet Management** (https://fleetmanagement.idrental.mg).

## Aperçu

Application web de monitoring permettant de visualiser :

- **Vue d'ensemble** : statut global, KPIs (HTTP, temps de réponse, DNS, port 443, SSL, disponibilité), graphique de temps de réponse et derniers incidents
- **Performance** : temps de réponse (actuel, moyen, min, max), graphique temporel avec sélection de période (24h / 7j / 30j)
- **Incidents** : tableau des incidents avec badges de niveau (INFO / ALERTE / CRITIQUE), filtres par statut (OPEN / RESOLVED)
- **SSL** : surveillance du certificat avec indicateurs visuels selon les seuils (vert > 30j, orange 7-30j, rouge < 7j, rouge critique = expiré)
- **Historique** : table complète des contrôles avec recherche, filtres par statut/niveau et pagination

## Stack technique

- React + TypeScript
- Vite
- Tailwind CSS + shadcn/ui
- Lucide React (icônes)
- Recharts (graphiques)
- React Router (navigation)
- Supabase (authentification + future base de données)

## Installation

```bash
npm install
```

## Lancement local

```bash
npm run dev
```

L'application est accessible sur http://localhost:5173

## Variables d'environnement

Copiez `.env.example` en `.env` et renseignez les valeurs :

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | URL du projet Supabase |
| `VITE_SUPABASE_ANON_KEY` | Clé publique (anon) de Supabase |

**Important** : N'utilisez jamais la `service_role` key dans le frontend. Seules les variables préfixées `VITE_` sont exposées au navigateur.

## Build

```bash
npm run build
```

Les fichiers de production sont générés dans `dist/`.

## Déploiement Netlify

1. Connectez votre dépôt à Netlify
2. Configuration automatique via `netlify.toml` :
   - Build command : `npm run build`
   - Publish directory : `dist`
3. Ajoutez les variables d'environnement dans Netlify (Settings → Environment variables)
4. Déployez

Le fichier `netlify.toml` inclut une redirection SPA pour que les routes React fonctionnent correctement.

## Connexion à Supabase

### Authentification

L'authentification est déjà configurée via Supabase Auth (email / mot de passe).

1. Dans Supabase, allez dans **Authentication → Users** pour créer des utilisateurs
2. Configurez les variables `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`
3. La page de login utilise `supabase.auth.signInWithPassword()`

### Base de données

Les tables suivantes sont prévues dans Supabase :

- `applications` — applications supervisées
- `monitoring_checks` — résultats des contrôles de monitoring
- `incidents` — incidents détectés

Le service d'abstraction de données se trouve dans `src/services/monitoringService.ts`. Pour connecter Supabase, remplacez les fonctions mockées par des requêtes Supabase.

#### Schéma SQL (à créer dans Supabase)

```sql
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  environment TEXT NOT NULL DEFAULT 'PRODUCTION',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE monitoring_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id),
  timestamp TIMESTAMPTZ DEFAULT now(),
  site TEXT,
  url TEXT,
  internet BOOLEAN,
  dns BOOLEAN,
  ip TEXT,
  port_443 BOOLEAN,
  http_code INTEGER,
  response_time_ms INTEGER,
  ssl_valid BOOLEAN,
  ssl_expiration TIMESTAMPTZ,
  ssl_days_remaining INTEGER,
  status TEXT,
  level TEXT
);

CREATE TABLE incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  status TEXT DEFAULT 'OPEN',
  level TEXT,
  http_code INTEGER,
  description TEXT
);
```

## Architecture

```
src/
  components/
    layout/          — Sidebar, Topbar
    layouts/         — DashboardLayout
    shared/          — KpiCard, StatusBadges, SslIndicator
    ui/              — Composants shadcn/ui
  hooks/
    useAuth.tsx      — Context d'authentification Supabase
    useMonitoring.ts — Hooks de données (abstraction)
  lib/
    supabase.ts      — Client Supabase
    utils.ts         — Utilitaires (cn)
  pages/
    LoginPage.tsx
    OverviewPage.tsx
    PerformancePage.tsx
    IncidentsPage.tsx
    SslPage.tsx
    HistoryPage.tsx
  services/
    mockData.ts          — Données mockées réalistes
    monitoringService.ts — Couche d'abstraction de données
  types/
    index.ts         — Types TypeScript (Application, MonitoringCheck, Incident)
```

## Évolutions futures

- Connexion PowerShell → Supabase pour alimenter les données en temps réel
- Support multi-applications (l'architecture est prête)
- Alertes en temps réel via Supabase Realtime
- Notifications email/webhook
