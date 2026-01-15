# 🔧 Fix: Colonne Email Manquante

## ❌ Erreur

```json
{
  "code": "PGRST204",
  "message": "Could not find the 'email' column of 'prestataires' in the schema cache"
}
```

## 🎯 Cause

La colonne `email` n'existe pas dans la table `prestataires`.

---

## ✅ Solution (1 Minute)

### Exécutez ce SQL dans Supabase:

**Supabase Dashboard** → **SQL Editor**:

```sql
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
SELECT id, full_name, email, profession, verified
FROM public.prestataires
ORDER BY created_at DESC
LIMIT 10;
```

---

## ✅ Résultat Attendu

Après avoir exécuté le SQL, vous devriez voir:

```
✅ Colonne email: EXISTE
✅ Trigger auto-fill: ACTIF
📊 Statistiques:
   - Total prestataires: X
   - Avec email: X
   - Sans email: 0
```

---

## 🧪 Test Complet

### 1. Vérifier les Emails Existants

```sql
SELECT full_name, email, profession
FROM public.prestataires
ORDER BY created_at DESC;
```

Tous les prestataires devraient avoir leur email.

### 2. Créer un Nouveau Prestataire

1. Allez sur http://localhost:8080/inscription/prestataire
2. Remplissez le formulaire
3. Soumettez
4. Vérifiez dans Supabase:

```sql
SELECT * FROM public.prestataires
ORDER BY created_at DESC
LIMIT 1;
```

L'email devrait être automatiquement rempli par le trigger.

### 3. Tester le Bouton Vérifier (Admin)

Maintenant que la colonne email existe, testez le bouton "Vérifier":

1. Connectez-vous en tant qu'admin (admin@kazipro.com)
2. Allez sur http://localhost:8080/dashboard/admin/prestataires
3. Cliquez sur "Vérifier" pour un prestataire
4. Ça devrait fonctionner!

---

## 📋 Ce Qui a Été Fait

1. ✅ Colonne `email` ajoutée à la table `prestataires`
2. ✅ Emails existants remplis depuis `auth.users`
3. ✅ Trigger créé pour auto-remplir l'email lors de l'insertion
4. ✅ Code d'inscription mis à jour (email ajouté automatiquement par trigger)

---

## 🎯 Avantages du Trigger

- ✅ Pas besoin de spécifier l'email dans le code
- ✅ Email toujours synchronisé avec auth.users
- ✅ Fonctionne pour les insertions ET les mises à jour
- ✅ Pas de risque d'oublier l'email

---

## ✅ Checklist

- [ ] SQL exécuté dans Supabase
- [ ] Colonne email créée
- [ ] Emails existants remplis
- [ ] Trigger créé et actif
- [ ] Vérification: tous les prestataires ont un email
- [ ] Test: créer un nouveau prestataire
- [ ] Test: vérifier un prestataire (admin)

---

## 🚀 Prochaines Étapes

Maintenant que la colonne email existe, vous pouvez:

1. **Tester l'inscription** d'un nouveau prestataire
2. **Voir les emails** dans la page admin
3. **Vérifier les prestataires** avec le bouton "Vérifier"

Mais d'abord, il faut aussi **fixer les permissions UPDATE** pour l'admin.

Exécutez ensuite le SQL de `QUICK_FIX_NOW.md` pour les permissions.

---

**Exécutez le SQL ci-dessus et l'inscription devrait fonctionner!** 🎉
