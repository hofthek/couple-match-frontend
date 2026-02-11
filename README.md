# CoupleMatch – Frontend (React)

Application React pour les utilisateurs de CoupleMatch : page d’accueil publique, inscription/connexion, tableau de bord, questionnaire de compatibilité, résultats et historique.

> **Backend :** l’API Laravel se trouve dans **`backend/`** (même projet CoupleMatch). Elle doit être lancée (ex. `cd backend && php artisan serve` sur le port 8000) pour que le frontend fonctionne.

## Prérequis

- Node.js 18+
- npm ou yarn

## Installation

```bash
npm install
cp .env.example .env
```

Dans `.env`, configurez l’URL de l’API si besoin (défaut : `http://localhost:8000/api/v1`) :

```
VITE_API_URL=http://localhost:8000/api/v1
```

## Lancer en développement

```bash
npm run dev
```

Ouvrir http://localhost:5173. L’API backend doit être disponible sur l’URL indiquée dans `VITE_API_URL`.

## Build production

```bash
npm run build
```

Les fichiers sont générés dans `dist/`. Déployez ce dossier sur votre hébergeur statique ou servez-le via un reverse proxy vers la même origine que l’API si besoin.

## Structure des routes

| Route        | Description                    |
|-------------|--------------------------------|
| `/`         | Page d’accueil (publique)      |
| `/login`    | Connexion                      |
| `/register` | Inscription                    |
| `/app`      | Tableau de bord (authentifié)  |
| `/app/questionnaire` | Questionnaire          |
| `/app/result/:id`    | Résultat d’un test     |
| `/app/history`       | Historique des tests   |
