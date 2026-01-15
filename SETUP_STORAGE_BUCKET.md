# 📦 Setup Supabase Storage pour Documents

## 🎯 Créer le Bucket

### Étape 1: Aller dans Storage

1. Ouvrez **Supabase Dashboard**
2. Cliquez sur **Storage** dans le menu de gauche
3. Cliquez sur **New bucket**

### Étape 2: Configurer le Bucket

**Nom du bucket:** `provider-documents`

**Options:**
- ✅ **Public bucket** (coché) - Pour que l'admin puisse voir les documents
- File size limit: 5 MB (par défaut)
- Allowed MIME types: Laisser vide (accepte tous les types)

Cliquez sur **Create bucket**

### Étape 3: Configurer les Policies

Le bucket doit permettre:
- ✅ Les prestataires peuvent **uploader** leurs propres documents
- ✅ L'admin peut **voir** tous les documents
- ✅ Les prestataires peuvent **voir** leurs propres documents

**Policies à créer:**

1. **Upload Policy** (INSERT):
```sql
-- Les utilisateurs authentifiés peuvent uploader
CREATE POLICY "Users can upload their documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'provider-documents');
```

2. **View Policy** (SELECT):
```sql
-- Tout le monde peut voir les documents (bucket public)
CREATE POLICY "Public can view documents"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'provider-documents');
```

3. **Delete Policy** (DELETE) - Optionnel:
```sql
-- Les utilisateurs peuvent supprimer leurs propres documents
CREATE POLICY "Users can delete their documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'provider-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
```

---

## ✅ Vérification

### Dans Supabase Dashboard:

1. **Storage** → **provider-documents**
2. Le bucket devrait être créé et vide
3. Cliquez sur **Policies** pour voir les policies

### Test rapide:

Essayez d'uploader un fichier manuellement:
1. Cliquez sur **Upload file**
2. Sélectionnez une image
3. Si ça fonctionne, le bucket est bien configuré!

---

## 📝 Structure des Fichiers

Les documents seront organisés comme:
```
provider-documents/
  ├── {user_id}/
  │   ├── id-document-{timestamp}.pdf
  │   └── qualification-{timestamp}.pdf
```

Exemple:
```
provider-documents/
  ├── 9e39b0c1-c5d6-4ae7-b6a2-34b7976bd7ae/
  │   ├── id-document-1704380000000.pdf
  │   └── qualification-1704380000000.pdf
```

---

## 🔧 Alternative: Créer via SQL

Si vous préférez créer le bucket via SQL:

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

**Le bucket est maintenant prêt pour recevoir les documents!** 📦
