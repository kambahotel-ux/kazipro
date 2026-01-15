# ⚡ Scripts SQL Finaux - À Exécuter

Ouvrez **Supabase Dashboard** → **SQL Editor** et exécutez ces 4 scripts dans l'ordre:

---

## 1️⃣ Colonne Email + Trigger

```sql
-- Ajouter la colonne email
ALTER TABLE public.prestataires 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Remplir les emails existants
UPDATE public.prestataires p
SET email = u.email
FROM auth.users u
WHERE p.user_id = u.id
  AND (p.email IS NULL OR p.email = '');

-- Fonction pour auto-remplir l'email
CREATE OR REPLACE FUNCTION public.auto_fill_prestataire_email()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email IS NULL OR NEW.email = '' THEN
    SELECT email INTO NEW.email
    FROM auth.users
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
DROP TRIGGER IF EXISTS trigger_auto_fill_prestataire_email ON public.prestataires;

CREATE TRIGGER trigger_auto_fill_prestataire_email
  BEFORE INSERT OR UPDATE ON public.prestataires
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_fill_prestataire_email();
```

---

## 2️⃣ Permissions Admin (UPDATE)

```sql
-- Supprimer les anciennes policies
DROP POLICY IF EXISTS "prestataires_update_own" ON public.prestataires;
DROP POLICY IF EXISTS "Admin can update all prestataires" ON public.prestataires;
DROP POLICY IF EXISTS "admin_update_all_prestataires" ON public.prestataires;

-- Policy pour les prestataires
CREATE POLICY "prestataires_update_own"
  ON public.prestataires
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy pour l'admin
CREATE POLICY "admin_update_all_prestataires"
  ON public.prestataires
  FOR UPDATE
  USING ((auth.jwt() ->> 'email') = 'admin@kazipro.com')
  WITH CHECK ((auth.jwt() ->> 'email') = 'admin@kazipro.com');
```

---

## 3️⃣ Colonnes pour Documents

```sql
-- Ajouter les colonnes pour les URLs des documents
ALTER TABLE public.prestataires 
ADD COLUMN IF NOT EXISTS id_document_url TEXT,
ADD COLUMN IF NOT EXISTS qualification_url TEXT;

-- Vérifier
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'prestataires'
  AND column_name IN ('email', 'id_document_url', 'qualification_url');
```

---

## 4️⃣ Bucket Storage + Policies

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

-- Vérifier le bucket
SELECT * FROM storage.buckets WHERE id = 'provider-documents';
```

---

## ✅ Vérification Finale

```sql
-- Vérifier toutes les colonnes
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'prestataires'
  AND column_name IN ('email', 'id_document_url', 'qualification_url')
ORDER BY column_name;

-- Vérifier les policies UPDATE
SELECT 
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'prestataires' AND cmd = 'UPDATE';

-- Vérifier le bucket
SELECT id, name, public FROM storage.buckets WHERE id = 'provider-documents';

-- Vérifier les policies Storage
SELECT 
  policyname,
  action
FROM storage.policies
WHERE bucket_id = 'provider-documents';
```

**Résultat attendu:**
- ✅ 3 colonnes dans prestataires (email, id_document_url, qualification_url)
- ✅ 2 policies UPDATE (prestataires_update_own, admin_update_all_prestataires)
- ✅ 1 bucket (provider-documents, public = true)
- ✅ 2 policies Storage (upload, view)

---

## 🧪 Test Rapide

### 1. Test Inscription:
http://localhost:8080/inscription/prestataire

### 2. Test Admin:
http://localhost:8080/dashboard/admin/prestataires
(admin@kazipro.com / Admin@123456)

---

**Exécutez les 4 scripts et testez!** 🚀
