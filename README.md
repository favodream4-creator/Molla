# MOLLA — starter

Point de départ Next.js + TypeScript + Tailwind, avec les couleurs et la police
de MOLLA déjà configurées, et l'écran Home converti depuis le prototype.

## Logiciels à installer sur ton ordinateur

- **Node.js** (version 20 ou plus) — https://nodejs.org — installe aussi `npm`
- **Un éditeur de code** — VS Code recommandé — https://code.visualstudio.com
- **Git** — https://git-scm.com — pour versionner ton code
- **Un compte GitHub** — https://github.com — pour héberger le repo
- **Un compte Vercel** — https://vercel.com — pour déployer gratuitement (connecte-toi avec GitHub)
- **Un compte Supabase** — https://supabase.com — pour l'auth et la base de données (à brancher à l'étape suivante)
- **Une clé API Claude ou OpenAI** — pour la vraie logique de MOLLA AI (pas nécessaire pour l'instant, le composant Home n'en a pas besoin)

Tout le reste (Next.js, Tailwind, React) s'installe via `npm install`, pas besoin de les installer à la main.

## Démarrer

```bash
# Dézippe le dossier, puis dans un terminal :
cd molla-starter
npm install
npm run dev
```

Ouvre http://localhost:3000 — tu dois voir l'écran Home avec la même mise en page
que dans le prototype.

## Structure

```
app/
  layout.tsx        → structure globale (police, largeur mobile centrée)
  page.tsx           → Home (écran principal)
  onboarding/page.tsx
  plan/page.tsx       → plan 30 jours personnalisé
  focus/page.tsx      → session de focus avec minuteur
  ai/page.tsx         → chat MOLLA AI
  create/page.tsx
  project/page.tsx    → détail du projet en cours
  connect/page.tsx
  opportunities/page.tsx
  profile/page.tsx
  globals.css         → import de la police + Tailwind
components/
  Home.tsx, Onboarding.tsx, Plan.tsx, Focus.tsx, MollaAI.tsx,
  Create.tsx, ProjectDetail.tsx, Connect.tsx, Opportunities.tsx,
  Profile.tsx, BottomNav.tsx
lib/
  store.ts            → état partagé (localStorage) : réponses d'onboarding,
                         streak, progression du projet, prochaine action
tailwind.config.ts    → couleurs de marque (molla-black, molla-yellow, molla-blue, molla-gray)
```

Tous les écrans du prototype sont maintenant convertis en React/Next.js avec
une vraie navigation par routes. L'état (onboarding, progression, streak) est
stocké en `localStorage` via `lib/store.ts` — pratique pour ce prototype, mais
à remplacer par Supabase une fois l'auth branchée (voir plus bas).

## Tester le parcours

1. `npm run dev`, ouvre http://localhost:3000
2. Tu es redirigé vers `/onboarding` tant que tu n'as pas répondu aux 4 questions
3. Une fois terminé → `/plan` (personnalisé selon tes réponses) → Home
4. Depuis Home : "Start move" ouvre une session de focus avec minuteur ;
   la terminer met à jour la progression du projet et le streak
5. "Ask MOLLA" ouvre le chat avec des réponses simulées mais actionnables
6. La barre du bas navigue entre Home / Create / Connect / Opportunities / Profile

## Brancher Supabase

1. Crée un projet sur supabase.com, récupère **Project URL** et **anon public key**
   dans Settings → API.
2. Copie `.env.local.example` en `.env.local` et colle-y ces deux valeurs.
3. Dans Supabase → SQL Editor, colle et exécute **dans l'ordre** :
   - `supabase/migration.sql` (table `molla_state`)
   - `supabase/migration_connect_opportunities.sql` (`collaborators`, `opportunities`, requêtes/candidatures)
   - `supabase/migration_feed.sql` (`profiles`, `posts`, `post_likes`, `post_comments`, et le bucket
     de stockage `post-images` pour les photos)
4. `npm install` puis `npm run dev`. Tu es redirigé vers `/login` : entre ton email,
   Supabase t'envoie un lien magique, clique dessus pour te connecter.

L'auth (lien magique par email), la protection des routes (middleware.ts) et
la progression (onboarding, streak, avancement du projet) sont maintenant
gérées par Supabase au lieu du localStorage — chaque artiste a ses propres
données grâce à la sécurité au niveau ligne (RLS).

6. En haut de Home, un vrai fil d'actualité : poste un texte et/ou une photo, like et
   commente les posts (y compris les tiens) — tout est sauvegardé dans Supabase.

## Prochaines étapes

1. Ajoute `app/api/molla-ai/route.ts` qui appelle l'API Claude ou OpenAI avec le
   contexte réel de l'artiste, au lieu des réponses simulées dans `MollaAI.tsx`.
2. Connect et Opportunities lisent déjà `collaborators` / `opportunities` dans Supabase,
   et enregistrent les clics sur "Connect" / "Apply" dans `connection_requests` /
   `opportunity_applications`. Ajoute une interface admin (ou fais-le à la main dans
   Table Editor) pour gérer ces listes au fil du temps.
3. Le nom affiché sur chaque post vient de `profiles.display_name`, rempli automatiquement
   avec la partie avant le @ de l'email à l'inscription. Ajoute un champ dans Profile.tsx
   pour le personnaliser.
4. Pousse sur GitHub, connecte le repo à Vercel, et ajoute les mêmes variables
   d'environnement Supabase dans les Settings du projet Vercel.
