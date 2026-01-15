# ⚡ Exécutez Ces 2 Scripts SQL

## 🎯 Actions Requises (2 Minutes)

Ouvrez **Supabase Dashboard** → **SQL Editor** et exécutez ces 2 scripts:

---

## 1️⃣ Script 1: Colonne Email + Trigger

```sql
-- =====================================================
-- AJOUTER LA COLONNE EMAIL ET LE TRIGGER
-- =====================================================

-- 1. Ajouter la colonne email
ALTER TABLE public.prestataires 
ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Remplir les emails existants depuis auth.users
UPDATE public.prestataires p
SET email = u.email
FROM auth.users u
WHERE p.user_id = u.id
  AND (p.email IS NULL OR p.email = '');

-- 3. Créer une fonction pour auto-remplir l'email
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

-- 4. Créer le trigger
DROP TRIGGER IF EXISTS trigger_auto_fill_prestataire_email ON public.prestataires;

CREATE TRIGGER trigger_auto_fill_prestataire_email
  BEFORE INSERT OR UPDATE ON public.prestataires
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_fill_prestataire_email();

-- 5. Vérifier
SELECT 
  id,
  full_name,
  email,
  profession,
  verified
FROM public.prestataires
ORDER BY created_at DESC
LIMIT 10;
```

**Résultat attendu:** Tous les prestataires ont maintenant un email.

---

## 2️⃣ Script 2: Permissions Admin (UPDATE)

```sql
-- =====================================================
-- FIX PERMISSIONS ADMIN POUR UPDATE
-- =====================================================

-- 1. Supprimer les anciennes policies
DROP POLICY IF EXISTS "prestataires_update_own" ON public.prestataires;
DROP POLICY IF EXISTS "Admin can update all prestataires" ON public.prestataires;
DROP POLICY IF EXISTS "admin_update_all_prestataires" ON public.prestataires;

-- 2. Policy pour les prestataires (modifier leur propre profil)
CREATE POLICY "prestataires_update_own"
  ON public.prestataires
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Policy pour l'admin (modifier tous les profils)
-- IMPORTANT: Utilise auth.jwt() au lieu de auth.users
CREATE POLICY "admin_update_all_prestataires"
  ON public.prestataires
  FOR UPDATE
  USING ((auth.jwt() ->> 'email') = 'admin@kazipro.com')
  WITH CHECK ((auth.jwt() ->> 'email') = 'admin@kazipro.com');

-- 4. Vérifier les policies
SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'prestataires' AND cmd = 'UPDATE'
ORDER BY policyname;
```

**Résultat attendu:** 2 policies UPDATE créées.

---

## ✅ Vérification

### Après Script 1:
```sql
-- Tous les prestataires doivent avoir un email
SELECT COUNT(*) as total, COUNT(email) as avec_email
FROM public.prestataires;
```

### Après Script 2:
```sql
-- 2 policies UPDATE doivent exister
SELECT COUNT(*) FROM pg_policies 
WHERE tablename = 'prestataires' AND cmd = 'UPDATE';
-- Résultat attendu: 2
```

---

## 🧪 Tests

### Test 1: Inscription Prestataire
1. http://localhost:8080/inscription/prestataire
2. Remplir les 3 étapes
3. Soumettre
4. Vérifier que l'email est automatiquement rempli:
```sql
SELECT * FROM prestataires ORDER BY created_at DESC LIMIT 1;
```

### Test 2: Bouton Vérifier (Admin)
1. Se connecter: admin@kazipro.com / Admin@123456
2. http://localhost:8080/dashboard/admin/prestataires
3. Ouvrir la console (F12)
4. Cliquer sur "Vérifier"
5. Vérifier les logs:
```
🔄 Tentative de vérification du prestataire: ...
✅ Prestataire vérifié: [...]
```

---

## 🎉 C'est Tout!

Après avoir exécuté ces 2 scripts:
- ✅ Les emails s'affichent dans l'interface admin
- ✅ Le bouton "Vérifier" fonctionne
- ✅ L'inscription par étapes fonctionne
- ✅ Les nouveaux prestataires ont automatiquement leur email

**Exécutez les scripts et testez!** 🚀
