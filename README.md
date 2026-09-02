# Ecommerce Tante (Emma-Shop)

Boutique e-commerce **full Next.js 15** (App Router) — front **et** API dans une seule app,
avec **Supabase** pour la base de données et l'authentification. Déployée sur **Vercel**.

> Avant, le projet était scindé en `backend/` (Express) + `frontend/` (Next.js).
> Tout est désormais unifié dans **une seule app Next.js à la racine** : l'API Express
> a été réécrite en **Route Handlers** (`app/api/**`). Plus de backend séparé, plus de CORS.

## Architecture

```
ecommerce-tante/
├─ app/
│  ├─ page.tsx              Accueil (catalogue)
│  ├─ cart/                 Panier + commande
│  ├─ admin/                Espace admin (produits, commandes)
│  ├─ login/                Connexion admin (Supabase Auth)
│  └─ api/                  ← API (remplace l'ancien backend Express)
│     ├─ products/route.ts        GET (public) · POST (admin)
│     ├─ products/[id]/route.ts   PATCH · DELETE (admin)
│     ├─ orders/route.ts          POST (public) · GET (admin)
│     ├─ health/route.ts          Healthcheck
│     └─ ping/route.ts            Cible du cron anti-pause Supabase
├─ lib/
│  ├─ supabase.ts           Client navigateur (clé anon)
│  ├─ supabase-admin.ts     Client serveur (service_role) — API only
│  ├─ auth.ts               Vérif du token admin (ex-middleware Express)
│  ├─ api.ts                Helper d'appel API (same-origin)
│  └─ store.ts              État du panier (Zustand)
├─ components/
├─ public/
└─ vercel.json             Vercel Cron → /api/ping (anti-pause)
```

## Endpoints API

| Méthode | Route | Accès | Rôle |
|---|---|---|---|
| GET | `/api/products` | public | Liste des produits |
| POST | `/api/products` | admin | Créer un produit |
| PATCH | `/api/products/:id` | admin | Modifier un produit |
| DELETE | `/api/products/:id` | admin | Supprimer un produit |
| POST | `/api/orders` | public | Passer commande (total recalculé serveur) |
| GET | `/api/orders` | admin | Liste des commandes |
| GET | `/api/health` | public | État de l'API |
| GET | `/api/ping` | cron | Réveille la base Supabase |

Les routes `admin` exigent un header `Authorization: Bearer <token Supabase>`.

## Variables d'environnement

Copie `.env.local` en local, et reproduis ces variables sur **Vercel → Settings → Environment Variables**.

| Variable | Côté | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | client | URL du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client | Clé anon (publique) |
| `SUPABASE_URL` | serveur | URL du projet Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | serveur | Clé **service_role** (secret — Supabase → Settings → API) |
| `CRON_SECRET` | serveur | *(optionnel)* protège `/api/ping` |
| `NEXT_PUBLIC_SHOP_WHATSAPP` | client | *(optionnel)* n° WhatsApp boutique (format `225XXXXXXXXXX`) → bouton « Confirmer sur WhatsApp » |
| `RESEND_API_KEY` | serveur | *(optionnel)* e-mail de commande à la boutique via [Resend](https://resend.com) |
| `RESEND_FROM` | serveur | *(optionnel)* expéditeur vérifié Resend |
| `SHOP_EMAIL` | serveur | *(optionnel)* e-mail destinataire (la boutique) |
| `CLOUDINARY_CLOUD_NAME` | serveur | Cloud name Cloudinary (stockage images) |
| `CLOUDINARY_API_KEY` | serveur | Clé API Cloudinary |
| `CLOUDINARY_API_SECRET` | serveur | **Secret** API Cloudinary (upload signé) |

> ⚠️ `SUPABASE_SERVICE_ROLE_KEY` est **secret** : jamais de préfixe `NEXT_PUBLIC`, jamais exposée au navigateur.

## Démarrer en local

```bash
npm install --legacy-peer-deps   # next 15 / react 19 : peer deps
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000).

## Anti-pause Supabase

Le plan gratuit Supabase met le projet **en pause après ~7 jours d'inactivité**.
Un **Vercel Cron** (`vercel.json`) appelle `/api/ping` **chaque jour à 6h UTC**, ce qui
effectue une requête légère et garde la base active. Aucune action manuelle nécessaire une
fois déployé.

## Base de données (migrations)

Les fonctions SQL vivent dans `supabase/migrations/`. À appliquer dans **Supabase → SQL Editor** (copier-coller le contenu du fichier) ou via la CLI `supabase db push` :

- `0001_create_order_atomic.sql` — fonction `create_order` : création de commande **atomique** (vérif stock + verrou de ligne + décrément + prix recalculés serveur). **Requise** : `/api/orders` l'appelle.
- `0002_products_gallery.sql` — ajoute `products.gallery`, le tableau contenant les images supplémentaires d'un produit. **Requise** pour ajouter plusieurs images depuis `/admin/products`.
- `0003_customer_email.sql` — ajoute l'e-mail client aux commandes et met à jour `create_order`. **Requise** pour les confirmations e-mail client.

À exécuter dans l'ordre avant tout déploiement qui utilise le catalogue multi-images et le nouveau flux de commande.

## Déploiement (Vercel)

1. **Root Directory** = racine du repo (`./`).
2. Renseigne les variables d'environnement (voir tableau ci-dessus).
3. Build : `npm run build` — install : `npm install --legacy-peer-deps`.
4. Le cron s'enregistre automatiquement au déploiement.
