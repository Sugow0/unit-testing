# unit-testing

![CI](https://github.com/Sugow0/unit-testing/actions/workflows/ci.yml/badge.svg?branch=main)
[![Coverage](https://codecov.io/gh/Sugow0/unit-testing/branch/main/graph/badge.svg)](https://codecov.io/gh/Sugow0/unit-testing)
[![Maintainability](https://api.codeclimate.com/v1/badges/VOTRE_ID/maintainability)](https://codeclimate.com/github/Sugow0/unit-testing)

Projet de TP CI/CD — Ynov M1. Implémentation d'une suite de tests unitaires et d'intégration sur un moteur de tarification de livraison, exposé via une API REST.

---

## Stack

- **Runtime** : [Bun](https://bun.sh)
- **Framework API** : [Elysia](https://elysiajs.com)
- **Tests** : `bun test` (intégré)
- **Linter / Formatter** : [Biome](https://biomejs.dev)
- **CI** : GitHub Actions

---

## Structure du projet

```
src/
├── app.ts          # Application Elysia (routes API)
├── index.ts        # Point d'entrée (démarrage serveur)
├── pricing.ts      # Moteur de tarification (B1)
├── utils.ts        # Fonctions utilitaires (A1, A4, A5, A6, A7)
└── validators.ts   # Fonctions de validation (A2)

tests/
├── api.test.ts     # Tests d'intégration des routes (B2)
├── pricing.test.ts # Tests unitaires du moteur de prix (B1)
├── utils.test.ts   # Tests unitaires des utilitaires (A1, A4–A7)
└── validators.test.ts # Tests unitaires des validateurs (A2)

.github/
└── workflows/
    └── ci.yml      # Pipeline CI (lint → tests + couverture → vérification)
```

---

## Installation

```bash
bun install
```

## Lancer le serveur

```bash
bun run dev     # mode watch (développement)
bun run start   # production
```

Le serveur démarre sur `http://localhost:3000`.

---

## Scripts disponibles

| Commande | Description |
|---|---|
| `bun run test` | Lance tous les tests |
| `bun run test:watch` | Tests en mode watch |
| `bun run test:coverage` | Tests + rapport de couverture (seuil 80%) |
| `bun run lint` | Lint + auto-correction (développement) |
| `bun run lint:ci` | Lint sans modification (CI) |

---

## API

### `POST /orders/simulate`

Calcule le prix d'une commande sans la persister.

```json
{
  "items": [{ "name": "Pizza", "price": 12.50, "quantity": 2 }],
  "distance": 5,
  "weight": 2,
  "promoCode": "BIENVENUE20",
  "hour": 15,
  "dayOfWeek": 2
}
```

Réponse `200` :

```json
{
  "subtotal": 25,
  "discount": 5,
  "deliveryFee": 3,
  "surge": 1.0,
  "total": 23
}
```

### `POST /orders`

Même corps que `/orders/simulate`. Persiste la commande en mémoire et retourne un `id`. Statut `201`.

### `GET /orders/:id`

Récupère une commande sauvegardée. Retourne `404` si introuvable.

### `POST /promo/validate`

Vérifie un code promo sans créer de commande.

```json
{ "promoCode": "BIENVENUE20", "amount": 50 }
```

---

## Codes promo disponibles

| Code | Type | Valeur | Minimum | Expiration |
|---|---|---|---|---|
| `BIENVENUE20` | percentage | 20% | 15 € | 2026-12-31 |
| `REDUC5` | fixed | 5 € | 20 € | 2026-12-31 |
| `TOTAL100` | percentage | 100% | 0 € | 2026-12-31 |
| `EXPIRED` | percentage | 10% | 0 € | 2024-01-01 |

---

## Pipeline CI

Le pipeline GitHub Actions s'exécute à chaque push et pull request sur `main` :

```
lint ──► test & coverage ──► verify
         (seuil 80%)
```

1. **Lint** — `biome check` (zéro erreur requis)
2. **Tests & Couverture** — `bun test --coverage` avec seuil à 80% (`bunfig.toml`)
3. **Vérification** — confirmation finale si les deux étapes précédentes passent

---

## Couverture actuelle

| Fichier | Fonctions | Lignes |
|---|---|---|
| `src/app.ts` | 100% | 100% |
| `src/pricing.ts` | 100% | 96.85% |
| `src/utils.ts` | 100% | 98.59% |
| `src/validators.ts` | 100% | 100% |
| **Total** | **100%** | **98.86%** |
