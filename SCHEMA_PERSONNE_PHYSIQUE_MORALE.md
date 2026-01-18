# 📊 Schémas : Personne Physique / Personne Morale

## 🗂️ Structure de la base de données

```
┌─────────────────────────────────────────────────────────────┐
│                    TABLE: prestataires                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  CHAMPS COMMUNS                                             │
│  ├─ id (UUID)                                               │
│  ├─ user_id (UUID)                                          │
│  ├─ type_prestataire ('physique' | 'morale') ⭐ NOUVEAU    │
│  ├─ profession                                              │
│  ├─ bio                                                     │
│  ├─ phone                                                   │
│  ├─ email                                                   │
│  ├─ rating                                                  │
│  ├─ verified                                                │
│  └─ documents_verified                                      │
│                                                             │
│  PERSONNE PHYSIQUE (👤)                    ⭐ NOUVEAU       │
│  ├─ nom                                                     │
│  ├─ prenom                                                  │
│  ├─ date_naissance                                          │
│  ├─ numero_cni                                              │
│  └─ photo_cni                                               │
│                                                             │
│  PERSONNE MORALE (🏢)                      ⭐ NOUVEAU       │
│  ├─ raison_sociale                                          │
│  ├─ forme_juridique                                         │
│  ├─ numero_rccm                                             │
│  ├─ numero_impot                                            │
│  ├─ numero_id_nat                                           │
│  ├─ representant_legal_nom                                  │
│  ├─ representant_legal_prenom                               │
│  ├─ representant_legal_fonction                             │
│  ├─ adresse_siege                                           │
│  ├─ ville_siege                                             │
│  ├─ pays_siege                                              │
│  ├─ document_rccm                                           │
│  ├─ document_id_nat                                         │
│  └─ document_statuts                                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 🔀 Flux d'inscription

```
                    INSCRIPTION PRESTATAIRE
                            │
                            ▼
        ┌───────────────────────────────────────┐
        │   Quel type de prestataire ?          │
        └───────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
                ▼                       ▼
    ┌─────────────────────┐   ┌─────────────────────┐
    │  👤 PERSONNE        │   │  🏢 PERSONNE        │
    │     PHYSIQUE        │   │     MORALE          │
    └─────────────────────┘   └─────────────────────┘
                │                       │
                ▼                       ▼
    ┌─────────────────────┐   ┌─────────────────────┐
    │ Champs requis:      │   │ Champs requis:      │
    │ • Nom               │   │ • Raison sociale    │
    │ • Prénom            │   │ • Forme juridique   │
    │ • Profession        │   │ • N° RCCM           │
    │ • Téléphone         │   │ • Représentant      │
    │ • Email             │   │ • Profession        │
    │                     │   │ • Téléphone         │
    │ Optionnel:          │   │ • Email             │
    │ • Date naissance    │   │                     │
    │ • N° CNI            │   │ Optionnel:          │
    │ • Photo CNI         │   │ • N° Impôt          │
    └─────────────────────┘   │ • Adresse siège     │
                │             │ • Documents         │
                │             └─────────────────────┘
                │                       │
                └───────────┬───────────┘
                            ▼
                ┌───────────────────────┐
                │  Création du compte   │
                │  dans Supabase        │
                └───────────────────────┘
                            │
                            ▼
                ┌───────────────────────┐
                │  En attente de        │
                │  vérification         │
                └───────────────────────┘
```

## 📋 Comparaison des champs

```
┌──────────────────────┬──────────────────────┬──────────────────────┐
│     CHAMP            │  PERSONNE PHYSIQUE   │  PERSONNE MORALE     │
├──────────────────────┼──────────────────────┼──────────────────────┤
│ Identité             │ Nom + Prénom         │ Raison sociale       │
│ Document principal   │ CNI / Passeport      │ RCCM                 │
│ Numéro ID            │ N° CNI               │ N° RCCM + ID Nat     │
│ Représentation       │ Soi-même             │ Représentant légal   │
│ Adresse              │ Personnelle          │ Siège social         │
│ Forme juridique      │ -                    │ SARL, SA, etc.       │
│ Documents requis     │ 1 (CNI)              │ 3 (RCCM, ID, Statuts)│
│ Icône                │ 👤                   │ 🏢                   │
│ Badge couleur        │ Bleu (default)       │ Gris (secondary)     │
└──────────────────────┴──────────────────────┴──────────────────────┘
```

## 🎨 Interface utilisateur

### Formulaire d'inscription

```
┌─────────────────────────────────────────────────────────────┐
│                  INSCRIPTION PRESTATAIRE                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Type de prestataire:                                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ○ 👤 Personne Physique (Individu)                   │   │
│  │ ○ 🏢 Personne Morale (Entreprise)                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  SI PERSONNE PHYSIQUE:                              │   │
│  │  ┌──────────────┐  ┌──────────────┐                │   │
│  │  │ Prénom *     │  │ Nom *        │                │   │
│  │  └──────────────┘  └──────────────┘                │   │
│  │  ┌──────────────────────────────────┐              │   │
│  │  │ Date de naissance                │              │   │
│  │  └──────────────────────────────────┘              │   │
│  │  ┌──────────────────────────────────┐              │   │
│  │  │ Numéro CNI                       │              │   │
│  │  └──────────────────────────────────┘              │   │
│  │  ┌──────────────────────────────────┐              │   │
│  │  │ 📄 Télécharger photo CNI         │              │   │
│  │  └──────────────────────────────────┘              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  SI PERSONNE MORALE:                                │   │
│  │  ┌──────────────────────────────────┐              │   │
│  │  │ Raison sociale *                 │              │   │
│  │  └──────────────────────────────────┘              │   │
│  │  ┌──────────────────────────────────┐              │   │
│  │  │ Forme juridique ▼                │              │   │
│  │  │ • SARL                           │              │   │
│  │  │ • SA                             │              │   │
│  │  │ • SUARL                          │              │   │
│  │  └──────────────────────────────────┘              │   │
│  │  ┌──────────────────────────────────┐              │   │
│  │  │ Numéro RCCM                      │              │   │
│  │  └──────────────────────────────────┘              │   │
│  │  ┌──────────────────────────────────┐              │   │
│  │  │ Représentant légal *             │              │   │
│  │  └──────────────────────────────────┘              │   │
│  │  ┌──────────────────────────────────┐              │   │
│  │  │ 📄 Documents (RCCM, ID Nat)      │              │   │
│  │  └──────────────────────────────────┘              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  CHAMPS COMMUNS:                                    │   │
│  │  ┌──────────────────────────────────┐              │   │
│  │  │ Profession *                     │              │   │
│  │  └──────────────────────────────────┘              │   │
│  │  ┌──────────────────────────────────┐              │   │
│  │  │ Description                      │              │   │
│  │  │                                  │              │   │
│  │  └──────────────────────────────────┘              │   │
│  │  ┌──────────────────────────────────┐              │   │
│  │  │ Téléphone *                      │              │   │
│  │  └──────────────────────────────────┘              │   │
│  │  ┌──────────────────────────────────┐              │   │
│  │  │ Email *                          │              │   │
│  │  └──────────────────────────────────┘              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              [ S'INSCRIRE ]                         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Affichage dans la liste

```
┌─────────────────────────────────────────────────────────────┐
│                    LISTE DES PRESTATAIRES                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ 👤 Jean Kabongo                    ⭐ 4.5  [Vérifié] │ │
│  │ Plombier                                              │ │
│  │ [Badge: Personne Physique]                            │ │
│  │ 📞 +243 123 456 789                                   │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ 🏢 SARL BATIMENT PLUS              ⭐ 4.8  [Vérifié] │ │
│  │ Construction - SARL                                   │ │
│  │ [Badge: Personne Morale]                              │ │
│  │ Représenté par Pierre Mukendi                         │ │
│  │ 📞 +243 987 654 321                                   │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ 👤 Marie Tshala                    ⭐ 4.7  [Vérifié] │ │
│  │ Électricienne                                         │ │
│  │ [Badge: Personne Physique]                            │ │
│  │ 📞 +243 111 222 333                                   │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Profil détaillé - Personne Physique

```
┌─────────────────────────────────────────────────────────────┐
│                    PROFIL PRESTATAIRE                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Jean Kabongo                    [Badge: 👤 Personne Physique]│
│  Plombier                                    ⭐ 4.5 (23 avis)│
│  [✓ Vérifié]                                                │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  📝 Description                                             │
│  Plombier professionnel avec 10 ans d'expérience.          │
│  Spécialisé dans les installations résidentielles.         │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  📞 Contact                                                 │
│  Téléphone: +243 123 456 789                                │
│  Email: jean@example.com                                    │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  👤 Informations personnelles                               │
│  Nom complet: Jean Kabongo                                  │
│  Date de naissance: 15/05/1990                              │
│  N° CNI: 1234567890                                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Profil détaillé - Personne Morale

```
┌─────────────────────────────────────────────────────────────┐
│                    PROFIL PRESTATAIRE                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  SARL BATIMENT PLUS              [Badge: 🏢 Personne Morale]│
│  Construction - SARL                         ⭐ 4.8 (45 avis)│
│  [✓ Vérifié]                                                │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  📝 Description                                             │
│  Entreprise de construction générale. Tous travaux de      │
│  bâtiment, rénovation et aménagement.                       │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  📞 Contact                                                 │
│  Téléphone: +243 987 654 321                                │
│  Email: contact@batimentplus.cd                             │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  🏢 Informations entreprise                                 │
│  Raison sociale: SARL BATIMENT PLUS                         │
│  Forme juridique: SARL                                      │
│  N° RCCM: CD/KIN/RCCM/12-A-12345                           │
│  N° Fiscal: A1234567Z                                       │
│  N° ID Nationale: ID-NAT-123456                             │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  👤 Représentant légal                                      │
│  Nom: Pierre Mukendi                                        │
│  Fonction: Gérant                                           │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  📍 Siège social                                            │
│  Adresse: 123 Avenue de la Paix                             │
│  Ville: Kinshasa, RDC                                       │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  📄 Documents                                               │
│  [RCCM] [ID Nationale] [Statuts]                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 📊 Dashboard Admin - Statistiques

```
┌─────────────────────────────────────────────────────────────┐
│                  STATISTIQUES PRESTATAIRES                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────┐  ┌──────────────────────────┐│
│  │ 👤 PERSONNES PHYSIQUES   │  │ 🏢 PERSONNES MORALES     ││
│  │                          │  │                          ││
│  │        156               │  │         43               ││
│  │                          │  │                          ││
│  │  ✓ 142 vérifiés          │  │  ✓ 38 vérifiées          ││
│  │  ⏳ 14 en attente         │  │  ⏳ 5 en attente          ││
│  └──────────────────────────┘  └──────────────────────────┘│
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ RÉPARTITION PAR TYPE                                 │  │
│  │                                                      │  │
│  │  Personnes Physiques  ████████████████░░  78%       │  │
│  │  Personnes Morales    ████░░░░░░░░░░░░░  22%       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ FORMES JURIDIQUES (Personnes Morales)               │  │
│  │                                                      │  │
│  │  SARL                 ████████░░░░░░░░░  45%        │  │
│  │  SA                   ████░░░░░░░░░░░░░  23%        │  │
│  │  SUARL                ███░░░░░░░░░░░░░░  18%        │  │
│  │  Autres               ██░░░░░░░░░░░░░░░  14%        │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 Workflow de vérification

```
        NOUVEAU PRESTATAIRE INSCRIT
                    │
                    ▼
        ┌───────────────────────┐
        │  Type: Physique ou    │
        │  Morale ?             │
        └───────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
┌───────────────┐       ┌───────────────┐
│ PHYSIQUE      │       │ MORALE        │
│               │       │               │
│ Vérifier:     │       │ Vérifier:     │
│ • CNI         │       │ • RCCM        │
│ • Profession  │       │ • ID Nat      │
│ • Téléphone   │       │ • Statuts     │
└───────────────┘       │ • Représentant│
        │               └───────────────┘
        │                       │
        └───────────┬───────────┘
                    ▼
        ┌───────────────────────┐
        │  Documents OK ?       │
        └───────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
    ┌───────┐             ┌───────┐
    │  OUI  │             │  NON  │
    └───────┘             └───────┘
        │                       │
        ▼                       ▼
┌───────────────┐       ┌───────────────┐
│ ✓ VÉRIFIÉ     │       │ ✗ REJETÉ      │
│ verified=true │       │ Demander      │
│               │       │ corrections   │
└───────────────┘       └───────────────┘
```

---

## 📝 Légende

- ⭐ NOUVEAU : Champ ajouté par ce système
- * : Champ requis
- 👤 : Personne Physique
- 🏢 : Personne Morale
- ✓ : Vérifié
- ⏳ : En attente
- ✗ : Rejeté
