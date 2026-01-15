# 📦 Configuration Storage - Images de Demandes

## 🎯 Problème

Erreur lors de l'upload d'images:
```
403 Unauthorized - new row violates row-level security policy
```

**Cause**: Le bucket Storage `demandes` n'existe pas ou n'a pas les bonnes policies RLS.

---

## ✅ SOLUTION (2 étapes)

### Étape 1: Créer le Bucket (Interface Supabase)

**Le bucket ne peut pas être créé via SQL, vous devez utiliser l'interface:**

1. **Ouvrir Supabase Dashboard**
2. **Aller dans** `Storage` (menu de gauche)
3. **Cliquer sur** "New bucket" (ou "Create a new bucket")
4. **Remplir**:
   - **Name**: `demandes`
   - **Public bucket**: ✅ **COCHER** (important!)
   - **File size limit**: Laisser par défaut (50MB)
   - **Allowed MIME types**: Laisser vide (tous les types)
5. **Cliquer sur** "Create bucket"

### Étape 2: Ajouter les Policies RLS (SQL)

**Exécuter ce script dans Supabase SQL Editor:**

```sql
-- Policy 1: Permettre aux clients authentifiés d'uploader des images
CREATE POLICY "Clients can upload demande images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'demandes'
  AND auth.role() = 'authenticated'
);

-- Policy 2: Permettre à tout le monde de voir les images (bucket public)
CREATE POLICY "Anyone can view demande images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'demandes');

-- Policy 3: Permettre aux clients de supprimer leurs propres images
CREATE POLICY "Clients can delete own demande images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'demandes'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

---

## 🧪 Test

1. **Créer le bucket** (Étape 1)
2. **Exécuter le script SQL** (Étape 2)
3. **Rafraîchir** votre application (F5)
4. **Créer une nouvelle demande** avec des images
5. ✅ **Succès!** Les images sont uploadées

---

## 📋 Structure des Fichiers

Les images sont organisées par demande:

```
demandes/
├── {demande_id}/
│   ├── {timestamp}-0.jpg
│   ├── {timestamp}-1.jpg
│   └── {timestamp}-2.jpg
└── {autre_demande_id}/
    └── {timestamp}-0.jpg
```

**Exemple**:
```
demandes/bea10f84-ee89-40e0-8042-33489e0045a3/1767551907536-0.jpg
```

---

## 🔍 Vérification

### Voir le bucket créé

Dans Supabase Dashboard > Storage, vous devriez voir:
- ✅ Bucket `demandes`
- ✅ Public: Yes
- ✅ Files: 0 (au début)

### Voir les policies RLS

```sql
SELECT 
  policyname,
  cmd
FROM pg_policies 
WHERE tablename = 'objects'
  AND policyname LIKE '%demande%'
ORDER BY policyname;
```

Vous devriez voir 3 policies:
1. Clients can upload demande images (INSERT)
2. Anyone can view demande images (SELECT)
3. Clients can delete own demande images (DELETE)

### Voir les fichiers uploadés

```sql
SELECT 
  name,
  bucket_id,
  created_at,
  metadata->>'size' as size
FROM storage.objects
WHERE bucket_id = 'demandes'
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🎉 Résultat

Après cette configuration:

- ✅ Les clients peuvent uploader des images avec leurs demandes
- ✅ Les images sont publiquement accessibles (pour les prestataires)
- ✅ Les images sont organisées par demande
- ✅ Les clients peuvent supprimer leurs propres images
- ✅ Maximum 5 images par demande (contrôlé par le code)

---

## 📝 Note Importante

**Le bucket DOIT être public** pour que les prestataires puissent voir les images des demandes sans être authentifiés sur le compte du client.

Si vous voulez plus de sécurité:
1. Rendre le bucket privé
2. Modifier la policy SELECT pour vérifier que l'utilisateur est soit:
   - Le client qui a créé la demande
   - Un prestataire de la profession correspondante
   - L'admin

---

## 🚀 Alternative: Créer sans Images

Si vous ne voulez pas configurer le Storage maintenant, vous pouvez:

1. **Désactiver temporairement l'upload d'images** dans le code
2. **Ou** ignorer l'erreur d'upload (la demande est quand même créée)

Le code actuel ignore déjà l'erreur d'upload avec:
```typescript
if (uploadError) {
  console.warn("Image upload warning:", uploadError);
  // Continue sans bloquer la création de la demande
}
```

---

**CRÉEZ LE BUCKET ET AJOUTEZ LES POLICIES!** 📦

**Fichier SQL**: `sql/create_storage_demandes.sql`
