# ✅ Inscription Prestataire - Guide Final

## 🎯 Résumé des Modifications

L'inscription des prestataires fonctionne maintenant **directement sans OTP** avec création automatique du profil.

---

## 📋 Checklist de Configuration

### 1. ✅ Désactiver la Confirmation Email (OBLIGATOIRE)

**Dans Supabase Dashboard:**
1. **Authentication** → **Settings** (ou **Providers**)
2. Trouvez **"Email confirmations"** ou **"Confirm email"**
3. **Désactivez** cette option (toggle OFF)
4. Cliquez sur **Save**

**OU via SQL:**
```sql
-- Confirmer tous les utilisateurs existants
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;
```

### 2. ✅ Vérifier les Policies RLS

**Exécutez ce SQL pour vérifier:**
```sql
SELECT policyname, cmd, with_check
FROM pg_policies
WHERE tablename = 'prestataires' AND cmd = 'INSERT';
```

**Résultat attendu:** Au moins une policy avec `(auth.uid() = user_id)`

**Si aucune policy n'existe, exécutez:**
```sql
CREATE POLICY "Users can create their own prestataire profile"
  ON public.prestataires
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### 3. ✅ Vérifier la Structure de la Table

**Colonnes requises dans `prestataires`:**
- `id` (UUID, PRIMARY KEY)
- `user_id` (UUID, REFERENCES auth.users)
- `full_name` (TEXT)
- `profession` (TEXT)
- `bio` (TEXT)
- `rating` (DECIMAL)
- `verified` (BOOLEAN)
- `documents_verified` (BOOLEAN)
- `created_at` (TIMESTAMPTZ)

**Vérifier:**
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'prestataires'
ORDER BY ordinal_position;
```

---

## 🚀 Test de l'Inscription

### Étape 1: Préparer

1. Assurez-vous que le serveur est lancé:
```bash
npm run dev
```

2. Ouvrez http://localhost:8080/inscription/prestataire

### Étape 2: Remplir le Formulaire

- **Nom complet:** Test Prestataire
- **Email:** test.prestataire@example.com
- **Profession:** Électricien
- **Ville:** Kinshasa
- **Expérience:** 5
- **Mot de passe:** Test123456
- **Confirmer mot de passe:** Test123456

### Étape 3: S'inscrire

1. Cliquez sur **"S'inscrire"**
2. Attendez le message "Compte créé avec succès !"
3. Vous devriez être redirigé vers `/prestataire/en-attente`

### Étape 4: Vérifier dans Supabase

**Vérifier l'utilisateur:**
1. **Authentication** → **Users**
2. Trouvez `test.prestataire@example.com`
3. Vérifiez que `Email Confirmed` = ✅

**Vérifier le profil:**
1. **Table Editor** → **prestataires**
2. Trouvez le profil avec le même `user_id`
3. Vérifiez:
   - `full_name` = "Test Prestataire"
   - `profession` = "Électricien"
   - `verified` = false
   - `bio` contient "5 ans d'expérience"

---

## 🔧 Dépannage

### Problème 1: "Email not confirmed"

**Solution:**
```sql
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email = 'test.prestataire@example.com';
```

### Problème 2: "Row violates RLS policy"

**Solution A - Vérifier la session:**
Le code attend maintenant 500ms après `signUp` pour s'assurer que la session est établie.

**Solution B - Vérifier les policies:**
```sql
-- Supprimer les policies en conflit
DROP POLICY IF EXISTS "prestataires_insert_own" ON public.prestataires;

-- Recréer la policy
CREATE POLICY "Users can create their own prestataire profile"
  ON public.prestataires
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

**Solution C - Désactiver temporairement RLS (DÉVELOPPEMENT SEULEMENT):**
```sql
ALTER TABLE public.prestataires DISABLE ROW LEVEL SECURITY;
```
⚠️ **NE PAS FAIRE EN PRODUCTION!**

### Problème 3: "Could not find column 'email'"

**Solution:** La colonne `email` a été retirée du code. Si l'erreur persiste, videz le cache du navigateur.

### Problème 4: Profil non créé mais compte créé

**Symptôme:** L'utilisateur existe dans Authentication mais pas dans `prestataires`

**Solution:** Le code affiche maintenant un message spécifique et redirige quand même. L'admin peut créer le profil manuellement:

```sql
INSERT INTO public.prestataires (
  user_id,
  full_name,
  profession,
  bio,
  rating,
  verified,
  documents_verified
) VALUES (
  'USER_ID_FROM_AUTH',
  'Nom Complet',
  'Profession',
  'Bio du prestataire',
  0,
  false,
  false
);
```

---

## 📊 Workflow Complet

```
1. Utilisateur remplit formulaire
   ↓
2. Code appelle supabase.auth.signUp()
   ↓
3. Compte créé dans auth.users
   ↓
4. Attente 500ms (établir session)
   ↓
5. Code appelle supabase.from('prestataires').insert()
   ↓
6. Policy RLS vérifie: auth.uid() = user_id
   ↓
7a. ✅ Si OK → Profil créé
7b. ❌ Si erreur → Message + redirection quand même
   ↓
8. Redirection vers /prestataire/en-attente
   ↓
9. Affichage "En attente de vérification"
   ↓
10. Admin approuve dans /dashboard/admin/prestataires
   ↓
11. Prestataire peut se connecter et accéder au dashboard
```

---

## 🔐 Sécurité

### Points de Sécurité Maintenus

1. ✅ **Approbation Admin Obligatoire**
   - `verified` = false par défaut
   - Accès au dashboard bloqué jusqu'à approbation

2. ✅ **RLS Policies Actives**
   - Les prestataires ne peuvent créer que leur propre profil
   - Les prestataires ne peuvent modifier que leur propre profil

3. ✅ **Validation des Données**
   - Validation côté client (formulaire)
   - Validation côté serveur (Supabase)

### Points à Améliorer (Production)

1. ⚠️ **Réactiver la Confirmation Email**
   - Plus sécurisé
   - Vérifie que l'email existe

2. ⚠️ **Ajouter Rate Limiting**
   - Limiter les inscriptions par IP
   - Éviter le spam

3. ⚠️ **Ajouter Captcha**
   - reCAPTCHA ou hCaptcha
   - Éviter les bots

---

## ✅ Checklist Finale

- [ ] Confirmation email désactivée dans Supabase
- [ ] Policies RLS vérifiées et actives
- [ ] Structure de table correcte
- [ ] Test d'inscription réussi
- [ ] Compte créé dans auth.users
- [ ] Profil créé dans prestataires
- [ ] Redirection vers page d'attente fonctionne
- [ ] Page d'attente affiche le bon message
- [ ] Admin peut voir le prestataire en attente
- [ ] Admin peut approuver le prestataire
- [ ] Prestataire peut se connecter après approbation

---

## 📞 Support

Si vous rencontrez toujours des problèmes:

1. Vérifiez la console du navigateur (F12)
2. Vérifiez les logs Supabase
3. Vérifiez que toutes les étapes de configuration sont complètes
4. Consultez les guides:
   - `FIX_RLS_PRESTATAIRES.md`
   - `FIX_EMAIL_CONFIRMATION.md`
   - `INSCRIPTION_DIRECTE_GUIDE.md`

---

**L'inscription des prestataires est maintenant opérationnelle! 🎉**
