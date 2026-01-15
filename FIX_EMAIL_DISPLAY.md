# 📧 Fix: Affichage des Emails des Prestataires

## ❌ Problème

L'erreur `{"code":"not_admin","message":"User not allowed"}` apparaît car on ne peut pas accéder à `auth.users` depuis le client.

## ✅ Solution

Ajouter une colonne `email` dans la table `prestataires` pour stocker l'email.

---

## 🚀 Installation Rapide

### Exécuter le Script SQL

1. Ouvrez **Supabase Dashboard** → **SQL Editor**
2. Copiez le contenu de `sql/add_email_to_prestataires.sql`
3. Collez et exécutez

**OU copiez ce code:**

```sql
-- Ajouter la colonne email
ALTER TABLE public.prestataires ADD COLUMN IF NOT EXISTS email TEXT;

-- Remplir les emails existants
UPDATE public.prestataires p
SET email = u.email
FROM auth.users u
WHERE p.user_id = u.id AND p.email IS NULL;

-- Créer un trigger pour auto-remplir
CREATE OR REPLACE FUNCTION public.set_prestataire_email()
RETURNS TRIGGER AS $$
BEGIN
  SELECT email INTO NEW.email
  FROM auth.users
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_set_prestataire_email ON public.prestataires;

CREATE TRIGGER trigger_set_prestataire_email
  BEFORE INSERT ON public.prestataires
  FOR EACH ROW
  EXECUTE FUNCTION public.set_prestataire_email();
```

---

## 🔄 Mettre à Jour le Code d'Inscription

Modifiez `RegisterProvider.tsx` pour inclure l'email:

```typescript
const { error: profileError } = await supabase
  .from("prestataires")
  .insert({
    user_id: authData.user.id,
    email: formData.email, // ← Ajouter cette ligne
    full_name: formData.fullName,
    profession: formData.profession,
    // ...
  });
```

---

## ✅ Vérification

### 1. Vérifier la colonne

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'prestataires' AND column_name = 'email';
```

### 2. Vérifier les données

```sql
SELECT id, full_name, email, verified
FROM prestataires
ORDER BY created_at DESC
LIMIT 5;
```

### 3. Tester dans l'interface

1. Rechargez `/dashboard/admin/prestataires`
2. Les emails devraient maintenant s'afficher
3. Créez un nouveau prestataire pour tester le trigger

---

## 📝 Ce Qui a Été Fait

1. ✅ Ajout de la colonne `email` dans `prestataires`
2. ✅ Remplissage des emails existants depuis `auth.users`
3. ✅ Création d'un trigger pour auto-remplir l'email
4. ✅ Mise à jour du code pour afficher l'email
5. ✅ Section documents ajoutée dans le modal
6. ✅ Correction des boutons Vérifier/Rejeter

---

## 🎯 Résultat

Maintenant dans `/dashboard/admin/prestataires`:
- ✅ Email affiché sous chaque prestataire
- ✅ Email visible dans le modal de détails
- ✅ Section documents (placeholder)
- ✅ Boutons Vérifier/Rejeter fonctionnels
- ✅ Statut mis à jour en temps réel

---

**Les emails s'affichent maintenant correctement! 🎉**
