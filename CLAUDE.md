# Vasseur & Vasseur Investment

Application web personnelle de suivi de patrimoine. Usage strictement privé,
un seul utilisateur. Dépôt : `dashboard`, déployé sur GitHub Pages.

---

## 1. Contraintes non négociables

### Machine de développement
Chromebook sous Crostini, **4 Go de RAM**, processeur MediaTek Kompanio 820.

- Aucun fichier source ne dépasse **300 lignes**. Si un fichier grossit, il est découpé.
- Aucune dépendance lourde sans justification explicite. Pas de framework UI complet,
  pas de bibliothèque de composants, pas de state manager externe.
- Le serveur de dev doit rester léger. Si `npm run dev` sature la mémoire, c'est un bug
  à corriger, pas une fatalité à accepter.

### Dépôt public
Le dépôt est public. Par conséquent, **jamais dans le code, jamais dans un commit** :

- clé d'API, jeton, secret de quelque nature que ce soit
- IBAN, numéro de compte, numéro de carte
- montant réel, solde, quantité de titres détenue
- nom de fichier d'export bancaire

Les jeux de données de démonstration utilisent des valeurs manifestement fictives.
`.gitignore` couvre `.env*`, `*.csv`, `*.xlsx`, `/data/`.

### Lecture seule
L'application n'exécute **aucune** opération bancaire ou boursière. Elle ne détient
aucun identifiant bancaire. Elle affiche, elle calcule, elle ne fait rien d'autre.

---

## 2. Stack

- **Vite** + **React 18** (JavaScript, pas TypeScript)
- **CSS Modules** ou CSS simple. Pas de Tailwind, pas de CSS-in-JS.
- **lightweight-charts** pour les graphiques financiers (léger, ~45 ko)
- **PWA** : manifest + service worker, installable sur iOS et Android
- `base: '/dashboard/'` dans `vite.config.js` (contrainte GitHub Pages)
- Routing par **hash** (`/dashboard/#/comptes`), sans dépendance : le fragment n'est
  jamais envoyé au serveur, donc aucune 404 possible sur Pages
- Déploiement par GitHub Actions, avec les actions officielles Pages
  (`upload-pages-artifact` + `deploy-pages`), sans branche `gh-pages`.
  Le dépôt doit être réglé sur *Settings → Pages → Source = GitHub Actions*.

Cible d'affichage : **téléphone d'abord**. Le desktop est secondaire.
Toute vue est conçue en portrait, largeur 390 px, avant d'être élargie.

---

## 3. Modèle de données

Devise de référence : **EUR**. Tous les totaux consolidés sont exprimés en euros.

### Devises en présence
| Devise | Où | Conversion |
|---|---|---|
| XPF | Comptes BCI | Taux **fixe** : 1 EUR = 119,3317 XPF (1000 XPF = 8,38 EUR) |
| EUR | Boursobank, Caisse d'Épargne, PEA | Référence |
| USD | Compte IBKR (devise de base) | Taux variable, à récupérer et horodater |

Le taux XPF/EUR est une constante, pas un appel réseau. Le taux USD/EUR est stocké
avec chaque valorisation, pour que l'historique reste juste rétroactivement.

### Entités

L'état est un objet unique, sérialisé sous une clé unique `vv.state` dans `localStorage` :

```
Institution   { id, nom, couleur }
Account       { id, institutionId, libelle, type, devise }
balances      { [accountId]: { montant, date } }         // solde courant, une map par compte
Position      { id, accountId, ticker, isin, quantite, pru, devise }
Watchlist     { id, ticker, libelle, conviction, horizon, zoneAchatMin,
                zoneAchatMax, alertePrix, these, risques, favori }        // idée de suivi
quotes        { [ticker]: { prix, devise, horodatage } }  // indexé par ticker, jamais commité
FxRate        { paire, taux, horodatage }
historique    [{ date, totalEur, tauxUsd }]               // instantanés, ajout seul, jamais réécrit
```

`Account.type` ∈ `courant` | `epargne` | `pea` | `cto` — Livret A et LDD sont des comptes
`epargne` comme les autres, distingués seulement par leur `libelle`.

`balances` est une map par compte, pas une entité `CashBalance` historisée : la phase 2
n'a pas d'historique par compte, un solde courant horodaté suffit. Écart assumé par
rapport à une conception qui garderait chaque solde comme événement daté ; à revoir si
un historique par compte devient nécessaire.

`Watchlist` est une racine à part, et une idée de suivi, pas un titre allégé : ni
`accountId`, ni `quantite`, ni `pru`, ni `devise`, ni cours stocké sur l'entité elle-même.
`consolider()` (`src/lib/portfolio.js`) ne reçoit jamais l'état complet, seulement
`{ institutions, accounts, balances, positions, quotes, fx }` — `watchlist` n'est
structurellement jamais dans son champ de vision, elle ne peut pas entrer dans le total.
Le prix courant d'une idée de suivi se lit dans le cache `quotes` (indexé par ticker
seul, partagé avec les positions), jamais écrit depuis la watchlist. Promouvoir une idée
en position ouvre le formulaire de position pré-rempli du ticker : quantité, PRU et
devise se saisissent là.

`historique` ne se remplit que via une action explicite (« Enregistrer un instantané »),
jamais automatiquement : une courbe de patrimoine ne se reconstruit pas après coup.

### Structure réelle des comptes

| Institution | Comptes | Devise | Contenu |
|---|---|---|---|
| BCI | courant, épargne | XPF | espèces |
| Boursobank | courant, PEA | EUR | espèces / positions ETF |
| Caisse d'Épargne | courant, Livret A, LDD | EUR | espèces |
| IBKR | CTO | USD | espèces + positions (dont IBIT) |

### Règle de saisie
- **Comptes espèces** : le solde est saisi ou importé. Il n'est pas calculé.
- **PEA et CTO** : les positions (ticker, quantité, PRU) sont saisies à la main.
  Elles ne changent que lors d'un ordre, quelques fois par an. La **valorisation**
  est recalculée à partir des cours, jamais saisie.

---

## 4. Le cas Bitcoin

Il n'y a **aucune crypto en détention directe**. L'exposition passe uniquement par
**IBIT**, un ETF détenu sur le CTO IBKR, qui est une `Position` ordinaire comme
une autre.

Le cours du **BTC** est suivi comme *indicateur de marché*, parce qu'IBIT en suit
le prix. Il n'est **jamais** compté dans le patrimoine. Toute vue « crypto » de
l'application affiche le cours du BTC en référence et la position IBIT réelle
à côté — les deux ne sont pas additionnés.

---

## 5. Sources de données

- **Cours actions / ETF** : Yahoo Finance, via un Worker Cloudflare servant de proxy
  (l'appel direct depuis le navigateur est bloqué par CORS). Ne pas utiliser de proxy
  CORS public : ils tombent régulièrement.
- **Cours BTC** : CoinGecko, API publique gratuite.
- **Taux USD/EUR** : à décider en phase 3.

Toute réponse réseau est mise en cache avec un horodatage. L'application doit rester
utilisable hors ligne, en affichant les dernières valeurs connues et leur âge.

---

## 6. Feuille de route

| Phase | Contenu | Cloudflare requis |
|---|---|---|
| 1 | Squelette : Vite, React, routing, PWA, déploiement Pages | non |
| 2 | Modèle de données + saisie manuelle, tout en `localStorage` | non |
| 3 | Cours en direct via Worker proxy, conversion de devises | **oui** |
| 4 | Synchronisation cloud (Workers KV) + jeton d'authentification | oui |
| 5 | Import des exports bancaires (CSV / XLSX) | oui |
| 6 | Graphiques, historique, watchlists, analyse | oui |

Une phase se termine par un commit fonctionnel. On ne commence pas la suivante
avant que la précédente tourne sur le téléphone.

---

## 7. Sécurité (à partir de la phase 4)

Le code étant public et l'URL devinable, un code PIN vérifié côté client ne protège
rien. Quand la synchronisation cloud arrivera :

- le Worker vérifie un **jeton d'authentification** avant toute lecture ou écriture ;
- le jeton n'est jamais dans le dépôt ; il est saisi une fois dans l'application et
  conservé localement ;
- les données sont chiffrées côté client avant envoi vers KV.

---

## 8. Conventions de travail

- Toujours proposer un plan avant d'écrire du code.
- Commits en français, à l'impératif : `ajoute le modèle de comptes`.
- Pas de refactorisation spontanée hors du périmètre demandé.
- Pas de dépendance ajoutée sans le dire explicitement et en justifier le poids.
- En cas de doute sur une règle métier (devise, périmètre, calcul), demander plutôt
  que supposer.
