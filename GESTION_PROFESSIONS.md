# ✅ Gestion des Professions par l'Admin

## 🎯 Fonctionnalité Implémentée

Les professions sont maintenant **gérées par l'admin** via une interface dédiée, et chargées dynamiquement depuis la base de données lors de l'inscription.

---

## 📋 Setup (2 Minutes)

### Exécuter le Script SQL

**Supabase Dashboard** → **SQL Editor**:

Copiez et exécutez le contenu de `sql/create_professions_table.sql`

Ou copiez ce SQL:

```sql
-- Créer la table professions
CREATE TABLE IF NOT EXISTS public.professions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL UNIQUE,
  description TEXT,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ajouter des professions par défaut
INSERT INTO public.professions (nom, description) VALUES
  ('Électricien', 'Installation et réparation électrique'),
  ('Plombier', 'Installation et réparation de plomberie'),
  ('Menuisier', 'Travaux de menuiserie et ébénisterie'),
  ('Peintre', 'Peinture intérieure et extérieure'),
  ('Maçon', 'Travaux de maçonnerie et construction'),
  ('Carreleur', 'Pose de carrelage et faïence'),
  ('Climatisation', 'Installation et maintenance de climatisation'),
  ('Mécanique automobile', 'Réparation et entretien de véhicules'),
  ('Informatique', 'Dépannage et maintenance informatique'),
  ('Jardinage', 'Entretien d''espaces verts'),
  ('Nettoyage', 'Services de nettoyage professionnel'),
  ('Sécurité', 'Services de gardiennage et sécurité')
ON CONFLICT (nom) DO NOTHING;

-- RLS Policies
ALTER TABLE public.professions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active professions"
  ON public.professions FOR SELECT
  USING (actif = true);

CREATE POLICY "Admin can insert professions"
  ON public.professions FOR INSERT
  WITH CHECK ((auth.jwt() ->> 'email') = 'admin@kazipro.com');

CREATE POLICY "Admin can update professions"
  ON public.professions FOR UPDATE
  USING ((auth.jwt() ->> 'email') = 'admin@kazipro.com')
  WITH CHECK ((auth.jwt() ->> 'email') = 'admin@kazipro.com');

CREATE POLICY "Admin can delete professions"
  ON public.professions FOR DELETE
  USING ((auth.jwt() ->> 'email') = 'admin@kazipro.com');
```

---

## 🎨 Interface Admin

### URL:
http://localhost:8080/dashboard/admin/professions

### Fonctionnalités:

**1. Vue d'ensemble:**
- Total professions
- Professions actives
- Professions désactivées

**2. Liste des professions:**
- Nom de la profession
- Description
- Badge Actif/Inactif
- Actions: Activer/Désactiver, Modifier, Supprimer

**3. Ajouter une profession:**
- Bouton "+ Ajouter une profession"
- Modal avec formulaire:
  - Nom (requis)
  - Description (optionnel)

**4. Modifier une profession:**
- Bouton "Modifier" (icône crayon)
- Modal avec formulaire pré-rempli

**5. Activer/Désactiver:**
- Bouton avec icône ✓ ou ✗
- Toggle instantané

**6. Supprimer:**
- Bouton rouge avec icône poubelle
- Confirmation avant suppression

---

## 🔄 Workflow

### Côté Admin:

1. Va sur `/dashboard/admin/professions`
2. Voit toutes les professions
3. Peut:
   - Ajouter une nouvelle profession
   - Modifier une profession existante
   - Activer/Désactiver une profession
   - Supprimer une profession

### Côté Prestataire (Inscription):

1. Va sur `/inscription/prestataire`
2. À l'étape 1, sélectionne sa profession
3. Le dropdown charge automatiquement les professions **actives** depuis la BD
4. Si erreur de chargement, fallback sur une liste par défaut

---

## 📊 Structure de la Table

```sql
CREATE TABLE professions (
  id UUID PRIMARY KEY,
  nom TEXT NOT NULL UNIQUE,
  description TEXT,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

**Colonnes:**
- `id`: Identifiant unique
- `nom`: Nom de la profession (unique)
- `description`: Description optionnelle
- `actif`: Si la profession est disponible pour les prestataires
- `created_at`: Date de création
- `updated_at`: Date de dernière modification

---

## 🔒 Sécurité (RLS)

### Policies:

**SELECT (Lecture):**
- Tout le monde peut voir les professions **actives**
- Les professions inactives sont invisibles pour les utilisateurs

**INSERT/UPDATE/DELETE:**
- Seul l'admin (`admin@kazipro.com`) peut modifier les professions

---

## 🧪 Test Complet

### 1. Test Admin - Ajouter

1. Connectez-vous: admin@kazipro.com / Admin@123456
2. Allez sur http://localhost:8080/dashboard/admin/professions
3. Cliquez sur "+ Ajouter une profession"
4. Remplissez:
   - Nom: "Coiffure"
   - Description: "Services de coiffure à domicile"
5. Cliquez sur "Ajouter"
6. La profession devrait apparaître dans la liste

### 2. Test Admin - Modifier

1. Cliquez sur le bouton "Modifier" (crayon)
2. Changez la description
3. Cliquez sur "Modifier"
4. La profession devrait être mise à jour

### 3. Test Admin - Désactiver

1. Cliquez sur le bouton avec ✓
2. Le badge devrait passer à "Inactif"
3. La profession ne sera plus visible pour les prestataires

### 4. Test Prestataire - Inscription

1. Allez sur http://localhost:8080/inscription/prestataire
2. À l'étape 1, ouvrez le dropdown "Profession"
3. Vous devriez voir toutes les professions actives
4. Les professions désactivées ne sont pas visibles

### 5. Vérification BD

```sql
-- Voir toutes les professions
SELECT * FROM professions ORDER BY nom;

-- Voir seulement les actives
SELECT * FROM professions WHERE actif = true ORDER BY nom;
```

---

## ✅ Checklist

- [ ] SQL exécuté (table professions créée)
- [ ] 12 professions par défaut insérées
- [ ] RLS policies créées
- [ ] Page admin accessible: `/dashboard/admin/professions`
- [ ] Test ajout d'une profession
- [ ] Test modification d'une profession
- [ ] Test activation/désactivation
- [ ] Test suppression
- [ ] Inscription prestataire charge les professions depuis la BD

---

## 📝 Fichiers Créés/Modifiés

1. **sql/create_professions_table.sql**
   - Script pour créer la table et les policies

2. **src/pages/dashboard/admin/ProfessionsPage.tsx**
   - Page admin pour gérer les professions

3. **src/pages/auth/RegisterProviderSteps.tsx**
   - Charge les professions depuis la BD au lieu du tableau en dur

4. **src/App.tsx**
   - Route ajoutée: `/dashboard/admin/professions`

---

## 🎉 Résultat

- ✅ L'admin gère les professions via une interface dédiée
- ✅ Les prestataires voient uniquement les professions actives
- ✅ Ajout/Modification/Suppression en temps réel
- ✅ Activation/Désactivation instantanée
- ✅ Fallback sur liste par défaut si erreur

---

**Exécutez le SQL et testez la gestion des professions!** 🚀

**URLs:**
- Admin: http://localhost:8080/dashboard/admin/professions
- Inscription: http://localhost:8080/inscription/prestataire
