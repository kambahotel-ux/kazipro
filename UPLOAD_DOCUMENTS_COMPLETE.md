# ✅ Upload et Visualisation des Documents - Complet

## 🎯 Fonctionnalité Implémentée

Les prestataires peuvent maintenant **uploader leurs documents** lors de l'inscription, et l'admin peut **les voir** lors de l'approbation.

---

## 📋 Setup Requis (5 Minutes)

### 1. Exécuter le SQL pour les Colonnes

**Supabase Dashboard** → **SQL Editor**:

```sql
-- Ajouter les colonnes pour stocker les URLs des documents
ALTER TABLE public.prestataires 
ADD COLUMN IF NOT EXISTS id_document_url TEXT,
ADD COLUMN IF NOT EXISTS qualification_url TEXT;
```

### 2. Créer le Bucket Storage

**Option A - Via Interface:**

1. **Supabase Dashboard** → **Storage**
2. Cliquez sur **New bucket**
3. Nom: `provider-documents`
4. ✅ Cochez **Public bucket**
5. Cliquez sur **Create bucket**

**Option B - Via SQL:**

```sql
-- Créer le bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('provider-documents', 'provider-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Policy pour upload
CREATE POLICY "Users can upload their documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'provider-documents');

-- Policy pour voir
CREATE POLICY "Public can view documents"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'provider-documents');
```

---

## 🚀 Comment Ça Marche

### Côté Prestataire (Inscription):

1. **Étape 1**: Remplit ses informations
2. **Étape 2**: Upload 2 documents:
   - Carte d'électeur / Passeport
   - Document de qualification
3. **Étape 3**: Révision et soumission
4. **Soumission**: 
   - Documents uploadés vers `provider-documents/{user_id}/`
   - URLs sauvegardées dans la table `prestataires`
   - Profil créé avec `verified: false`

### Côté Admin (Approbation):

1. Va sur `/dashboard/admin/prestataires`
2. Voit les prestataires en attente
3. Clique sur **"Détails"**
4. **Section Documents** affiche:
   - 📄 Carte d'électeur / Passeport (lien + aperçu si image)
   - 🎓 Document de qualification (lien + aperçu si image)
5. Peut cliquer sur les liens pour voir en plein écran
6. Clique sur **"Vérifier"** pour approuver

---

## 📁 Structure des Fichiers

```
provider-documents/
  ├── {user_id_1}/
  │   ├── id-document-1704380000000.pdf
  │   └── qualification-1704380000000.jpg
  ├── {user_id_2}/
  │   ├── id-document-1704380100000.png
  │   └── qualification-1704380100000.pdf
```

**Exemple:**
```
provider-documents/
  ├── 9e39b0c1-c5d6-4ae7-b6a2-34b7976bd7ae/
  │   ├── id-document-1704380520000.pdf
  │   └── qualification-1704380520000.jpg
```

---

## 🎨 Interface Admin

### Modal de Détails:

```
┌─────────────────────────────────────┐
│ Justin Akonkwa                      │
├─────────────────────────────────────┤
│ Nom: Justin Akonkwa                 │
│ Email: justin@example.com           │
│ Profession: Informatique            │
│ ...                                 │
│                                     │
│ Documents soumis:                   │
│ ┌─────────────────────────────────┐ │
│ │ 📄 Carte d'électeur / Passeport │ │
│ │ Voir le document →              │ │
│ │ [Aperçu de l'image si JPG/PNG]  │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ 🎓 Document de qualification    │ │
│ │ Voir le document →              │ │
│ │ [Aperçu de l'image si JPG/PNG]  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Fermer] [Vérifier] [Rejeter]      │
└─────────────────────────────────────┘
```

### Fonctionnalités:

- ✅ Lien cliquable pour ouvrir le document en plein écran
- ✅ Aperçu automatique si c'est une image (JPG, PNG, GIF)
- ✅ Message si aucun document n'est soumis
- ✅ Icônes pour identifier le type de document

---

## 🧪 Test Complet

### 1. Test Upload (Prestataire)

1. Allez sur http://localhost:8080/inscription/prestataire
2. Remplissez l'étape 1
3. À l'étape 2:
   - Uploadez une carte d'électeur (PDF ou image)
   - Uploadez un diplôme (PDF ou image)
4. À l'étape 3, vérifiez que les documents sont listés
5. Soumettez
6. Vérifiez dans **Supabase Storage** → **provider-documents**:
   - Un dossier avec votre `user_id` devrait exister
   - Les 2 fichiers devraient être présents

### 2. Test Visualisation (Admin)

1. Connectez-vous: admin@kazipro.com / Admin@123456
2. Allez sur http://localhost:8080/dashboard/admin/prestataires
3. Cliquez sur **"Détails"** pour le prestataire
4. Vérifiez la section **"Documents soumis"**:
   - Les 2 documents devraient être affichés
   - Les liens devraient fonctionner
   - Les aperçus devraient s'afficher si ce sont des images
5. Cliquez sur **"Voir le document →"** pour ouvrir en plein écran
6. Cliquez sur **"Vérifier"** pour approuver

### 3. Vérification Base de Données

```sql
SELECT 
  full_name,
  email,
  profession,
  verified,
  id_document_url,
  qualification_url
FROM public.prestataires
ORDER BY created_at DESC
LIMIT 5;
```

Les URLs devraient ressembler à:
```
https://qbasvwwerkpmsbzfrydj.supabase.co/storage/v1/object/public/provider-documents/9e39b0c1.../id-document-1704380520000.pdf
```

---

## ✅ Checklist

- [ ] SQL exécuté (colonnes ajoutées)
- [ ] Bucket `provider-documents` créé
- [ ] Bucket configuré en **public**
- [ ] Policies créées (upload + view)
- [ ] Test inscription avec upload de documents
- [ ] Documents visibles dans Storage
- [ ] Documents visibles dans l'interface admin
- [ ] Liens fonctionnels
- [ ] Aperçus d'images fonctionnels
- [ ] Bouton "Vérifier" fonctionne

---

## 🔧 Dépannage

### Erreur: "Bucket not found"
→ Le bucket n'existe pas. Créez-le dans Storage.

### Erreur: "Permission denied"
→ Les policies ne sont pas configurées. Exécutez les policies SQL.

### Documents ne s'affichent pas
→ Vérifiez que les colonnes `id_document_url` et `qualification_url` existent.

### Aperçu ne s'affiche pas
→ Normal si c'est un PDF. Seules les images (JPG, PNG, GIF) ont un aperçu.

---

## 📝 Fichiers Modifiés

1. **src/pages/auth/RegisterProviderSteps.tsx**
   - Upload vers Supabase Storage implémenté
   - URLs sauvegardées dans la base de données

2. **src/pages/dashboard/admin/ProvidersPage.tsx**
   - Section documents mise à jour
   - Affichage des liens et aperçus
   - Support des images et PDFs

3. **sql/add_documents_columns.sql**
   - Script pour ajouter les colonnes

4. **SETUP_STORAGE_BUCKET.md**
   - Guide pour créer le bucket

---

## 🎉 Résultat

- ✅ Les prestataires uploadent leurs documents lors de l'inscription
- ✅ Les documents sont stockés dans Supabase Storage
- ✅ L'admin peut voir et vérifier les documents
- ✅ Aperçu automatique pour les images
- ✅ Liens pour ouvrir en plein écran
- ✅ Workflow complet d'approbation

---

**Tout est prêt! Créez le bucket et testez l'upload.** 🚀
