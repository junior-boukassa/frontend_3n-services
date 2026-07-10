# 3N Services — Frontend React

Interface React/TypeScript de la plateforme 3N Services, connectée à l’API Django REST réelle.

## Prérequis et installation

- Node.js 20+
- API disponible sur `http://127.0.0.1:8001/api` ou l’URL configurée

```bash
npm install
cp .env.example .env
npm run dev
```

Variable disponible :

```env
VITE_API_BASE_URL=http://127.0.0.1:8001/api
```

N’ajoutez jamais de secret backend dans une variable `VITE_*` : ces valeurs sont intégrées au bundle public.

## Commandes

```bash
npm run dev
npm run lint
npm run build
npm run preview
```

## Architecture

- `src/api` : client Axios, tokens et intercepteurs
- `src/services` : endpoints centralisés par domaine
- `src/contexts` : session et utilisateur courant
- `src/layouts` : shell responsive de l’application
- `src/pages` : routes chargées avec `React.lazy`
- `src/components` : composants UI, loaders et `ErrorBoundary`
- `src/types` : contrats TypeScript correspondant aux serializers DRF

Les pages métier, d’administration et le dashboard sont chargés à la demande. Recharts n’est téléchargé qu’à l’ouverture du dashboard. Une erreur de chunk ou de rendu affiche un écran de récupération avec rechargement.

## Authentification et rôles

Axios ajoute l’access token JWT et tente une seule rotation avec le refresh token en cas de HTTP 401. Les requêtes concurrentes partagent la même tentative de refresh. Un refresh invalide vide la session et renvoie vers la connexion.

Rôles exacts :

- `CLIENT` : catalogue, réservations, paiements, avis et profil
- `AGENCY` : flotte propre, réservations et paiements associés
- `ADMIN` : vues globales, utilisateurs et journal d’activités

Routes principales : `/login`, `/register`, `/app/dashboard`, `/app/vehicles`, `/app/bookings`, `/app/payments`, `/app/reviews`, `/app/profile`, `/app/settings`, `/app/users` et `/app/logs`.

La partie publique utilise `/`, `/vehicles`, `/vehicles/:id`, `/about`, `/contact`, `/faq`, `/terms`, `/privacy` et `/agencies`. Le tunnel client utilise `/vehicles/:id/book`, `/bookings/:id`, `/bookings/:id/payment` et `/payments/:id`. Les anciennes routes privées `/app/*` restent compatibles.

## Limitations

Le backend ne fournit pas encore de récupération de mot de passe par e-mail, notifications, tickets support, abonnement SaaS, factures ou paiement externe réel. Ces fonctions restent masquées ou sont présentées explicitement comme indisponibles. Leur ajout nécessite des modèles, endpoints, services externes et variables serveur dédiés ; aucune clé externe ne doit être placée dans le frontend.

L’annuaire public consomme `GET /api/agencies/` et `GET /api/agencies/:id/`. Le formulaire utilise `POST /api/contact/`; les administrateurs traitent les demandes via `/admin/contact-messages`. Un flux de paiement réel nécessitera encore un fournisseur, des webhooks signés et un modèle de transactions idempotent.
