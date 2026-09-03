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
| `ADMIN_EMAILS` | serveur | e-mails admin séparés par des virgules ; requis si le rôle Supabase n’est pas `admin` |
| `ALERT_EMAIL` | serveur | *(optionnel)* destinataire des alertes d’erreur serveur via Resend |
| `NEXT_PUBLIC_SITE_URL` | client/serveur | *(optionnel)* URL publique utilisée dans les confirmations |
| `CLOUDINARY_CLOUD_NAME` | serveur | Cloud name Cloudinary (stockage images) |
| `CLOUDINARY_API_KEY` | serveur | Clé API Cloudinary |
| `CLOUDINARY_API_SECRET` | serveur | **Secret** API Cloudinary (upload signé) |
| `UPSTASH_REDIS_REST_URL` | serveur | URL REST de la base Redis Upstash (rate limiting distribué) |
| `UPSTASH_REDIS_REST_TOKEN` | serveur | Token REST Upstash (**secret**) |
| `NEXT_PUBLIC_META_PIXEL_ID` | client | *(optionnel)* Pixel Meta — Events Manager |
| `META_DATASET_ID` | serveur | *(optionnel)* Dataset Conversions API, si différent du Pixel ID |
| `META_CONVERSIONS_API_ACCESS_TOKEN` | serveur | *(optionnel)* Token Conversions API (**secret**) |
| `NEXT_PUBLIC_TIKTOK_PIXEL_ID` | client | *(optionnel)* Pixel TikTok — Events Manager |
| `TIKTOK_EVENTS_API_ACCESS_TOKEN` | serveur | *(optionnel)* Token TikTok Events API (**secret**) |
| `NEXT_PUBLIC_ADS_CURRENCY` | client/serveur | Devise envoyée aux régies (défaut `EUR`) |
| `NEXT_PUBLIC_TIKTOK_PURCHASE_EVENT` | client/serveur | Nom TikTok de l’achat (défaut `CompletePayment`) — **à confirmer dans TikTok Events Manager** |

> ⚠️ `SUPABASE_SERVICE_ROLE_KEY` est **secret** : jamais de préfixe `NEXT_PUBLIC`, jamais exposée au navigateur.
> ⚠️ `UPSTASH_REDIS_REST_TOKEN` est **secret** : ajoute les deux variables dans Vercel → Settings → Environment Variables, jamais dans GitHub.
> ⚠️ `META_CONVERSIONS_API_ACCESS_TOKEN` et `TIKTOK_EVENTS_API_ACCESS_TOKEN` sont **secrets** : jamais de préfixe `NEXT_PUBLIC`, jamais dans GitHub ni dans une capture d’écran.

### Suivi publicitaire Meta & TikTok

Tant qu’aucun Pixel ID n’est renseigné, toute la couche publicitaire est **inerte** : aucun script tiers n’est chargé, aucun événement n’est émis, la bannière de consentement ne s’affiche pas. Renseigner les variables suffit à l’activer, sans modification de code.

**Consentement.** Aucun traceur Meta/TikTok n’est déposé avant acceptation explicite (`lib/consent.ts`). Le refus est persistant et modifiable depuis `/confidentialite`. La mesure d’audience interne (`/api/analytics`) reste indépendante : anonymisée, sans IP, sans transfert tiers.

**Événements.** Un point d’entrée unique, `trackMarketingEvent` (`lib/marketing.ts`), alimente les deux régies : `PageView`, `ViewContent`, `AddToCart`, `InitiateCheckout`, `Purchase`, `Contact`. Aucun événement n’est émis sur `/admin` ni `/login`.

**Déduplication.** `Purchase` part deux fois — depuis le navigateur et depuis `/api/orders` (`lib/marketing-server.ts`) — avec `event_id = order.id` de part et d’autre. Le montant serveur provient de Postgres, jamais du panier client. L’idempotence de `create_order` garantit un seul `order.id` par commande, donc un seul achat comptabilisé même en cas de double-clic.

> ⚠️ **CSP.** Les domaines Meta et TikTok sont déclarés dans `next.config.ts`. Un domaine manquant fait échouer le chargement d’un pixel **en silence**, sans erreur JS et sans rien dans Events Manager. En cas d’événements absents, vérifier d’abord la console du navigateur (« Refused to load / Refused to connect ») avant de suspecter la configuration Meta ou TikTok.

### Rate limiting distribué Upstash

La création de commande est limitée à 8 tentatives par adresse IP sur 10 minutes avec `@upstash/ratelimit` et Redis Upstash. En production, renseigne `UPSTASH_REDIS_REST_URL` et `UPSTASH_REDIS_REST_TOKEN` dans Vercel, puis redéploie le projet. Si ces variables sont absentes en local, le projet utilise automatiquement un limiter mémoire de secours pour permettre le développement.

## Démarrer en local

```bash
npm install --legacy-peer-deps   # next 15 / react 19 : peer deps
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000).

## Installer le panel sur l’écran d’accueil

Le panel possède maintenant un manifest PWA et des icônes dédiées. Après connexion à `/admin`, utilise le bouton **Installer l’app** affiché dans l’en-tête. Sur Android, le navigateur proposera l’installation. Sur iPhone, le bouton rappelle le chemin **Partager → Sur l’écran d’accueil → Ajouter** dans Safari. Une fois installée, l’icône ouvre directement Emmaashop Studio en mode application.

L’installation doit être faite sur le domaine HTTPS de production, pas sur une adresse HTTP locale. La session Supabase est conservée par le navigateur ; il faut donc rester connecté au moment de l’installation.

## Sauvegardes et restauration

Supabase doit être configuré avec ses sauvegardes automatiques selon le plan utilisé. Pour disposer d’un dump indépendant, installe `pg_dump`, renseigne `SUPABASE_DB_URL` dans un environnement privé, puis lance `npm run backup:db`. Le fichier est créé dans `backups/`, dossier ignoré par Git ; copie-le ensuite vers un stockage privé et teste régulièrement une restauration sur une base séparée.

Ne place jamais `SUPABASE_DB_URL`, la clé `service_role` ou un dump dans une variable `NEXT_PUBLIC_*`.

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
- `0004_order_hardening.sql` — corrige les stocks négatifs existants, ajoute l’idempotence, le lien client non-admin, les statuts formels, l’historique et les transitions atomiques. **Requise** avant le nouveau checkout.
- `0005_product_variants.sql` — ajoute les variantes taille/couleur/SKU et le stock par déclinaison. **Requise** pour utiliser l’éditeur de variantes.
- `0006_operational_logs.sql` — table `app_logs`. **Requise** : `reportError` y écrit les erreurs serveur.
- `0007_site_analytics.sql` — table `site_activities` et fonction `get_site_analytics`. **Requise** pour `/admin/analytics` et pour la mesure du tunnel (`add_to_cart`, `checkout_started`, `order_created`).

À exécuter dans l'ordre avant tout déploiement qui utilise le catalogue multi-images, les variantes et le nouveau flux de commande. Les migrations 0004 et 0005 sont conçues pour être rejouées, mais il est recommandé de faire une sauvegarde Supabase avant application.

## Déploiement (Vercel)

1. **Root Directory** = racine du repo (`./`).
2. Renseigne les variables d'environnement (voir tableau ci-dessus).
3. Build : `npm run build` — install : `npm install --legacy-peer-deps`.
4. Le cron s'enregistre automatiquement au déploiement.
5. Configure `ADMIN_EMAILS` (ou attribue `app_metadata.role = admin` dans Supabase) pour chaque compte autorisé à l’administration.
6. Configure `ALERT_EMAIL` et `RESEND_API_KEY` pour recevoir les erreurs serveur critiques ; les logs structurés restent également disponibles dans les logs Vercel.

## Contrôles livrés

Le checkout utilise une clé d’idempotence conservée pendant la tentative : un double-clic ou une réponse réseau perdue ne crée pas une seconde commande. Les lignes identiques sont agrégées avant le verrouillage et la décrémentation du stock. Les changements de statut passent par une transition SQL atomique et sont inscrits dans `order_status_events`. Une annulation restaure le stock une seule fois. L’espace client ne reçoit plus de lien vers `/admin`.
