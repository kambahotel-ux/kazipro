# 🧪 Test Rapide - Bouton Vérifier

## 🚀 Action Immédiate

### 1. Exécutez ce SQL (30 secondes)

Ouvrez **Supabase Dashboard** → **SQL Editor** et exécutez:

```sql
-- Créer les policies UPDATE pour l'admin
DROP POLICY IF EXISTS "prestataires_update_own" ON public.prestataires;
DROP POLICY IF EXISTS "Admin can update all prestataires" ON public.prestataires;

CREATE POLICY "prestataires_update_own"
  ON public.prestataires
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can update all prestataires"
  ON public.prestataires
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'admin@kazipro.com'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'admin@kazipro.com'
    )
  );
```

### 2. Testez (1 minute)

1. Rechargez: http://localhost:8080/dashboard/admin/prestataires
2. Ouvrez la console (F12)
3. Cliquez sur "Vérifier" pour Justin Akonkwa
4. Regardez la console - vous devriez voir:
   ```
   🔄 Tentative de vérification du prestataire: 65ae32e5-c808-42db-acff-2f3dd554c434
   ✅ Prestataire vérifié: [...]
   ```
5. Justin devrait passer dans l'onglet "Vérifiés"

---

## 🔍 Que Regarder dans la Console

### ✅ Succès:
```javascript
🔄 Tentative de vérification du prestataire: 65ae32e5-c808-42db-acff-2f3dd554c434
✅ Prestataire vérifié: [{
  id: "65ae32e5-c808-42db-acff-2f3dd554c434",
  verified: true,
  documents_verified: true,
  ...
}]
```

### ❌ Erreur de Permission:
```javascript
❌ Erreur vérification: {
  code: "42501",
  message: "new row violates row-level security policy"
}
```
→ **Solution:** Réexécutez le script SQL

### ❌ Erreur d'Authentification:
```javascript
❌ Erreur vérification: {
  code: "PGRST301",
  message: "JWT expired"
}
```
→ **Solution:** Reconnectez-vous en tant qu'admin

---

## ✅ Vérification Rapide

Après avoir cliqué sur "Vérifier", exécutez ce SQL:

```sql
SELECT 
  full_name,
  profession,
  verified,
  documents_verified
FROM public.prestataires
WHERE id = '65ae32e5-c808-42db-acff-2f3dd554c434';
```

**Résultat attendu:**
```
full_name: "Justin Akonkwa"
profession: "Informatique"
verified: true          ← Devrait être true
documents_verified: true ← Devrait être true
```

---

## 📝 Résumé

1. ✅ Exécutez le script SQL pour créer les policies UPDATE
2. ✅ Rechargez la page admin
3. ✅ Ouvrez la console (F12)
4. ✅ Cliquez sur "Vérifier"
5. ✅ Vérifiez les logs dans la console
6. ✅ Confirmez que le prestataire est vérifié

**C'est tout! Le bouton devrait maintenant fonctionner.** 🎉
