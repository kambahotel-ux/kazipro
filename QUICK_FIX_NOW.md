# ⚡ FIX RAPIDE - 30 Secondes

## 🚀 Copiez et Exécutez ce SQL:

Ouvrez **Supabase Dashboard** → **SQL Editor** et exécutez:

```sql
DROP POLICY IF EXISTS "prestataires_update_own" ON public.prestataires;
DROP POLICY IF EXISTS "Admin can update all prestataires" ON public.prestataires;
DROP POLICY IF EXISTS "admin_update_all_prestataires" ON public.prestataires;

CREATE POLICY "prestataires_update_own"
  ON public.prestataires
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "admin_update_all_prestataires"
  ON public.prestataires
  FOR UPDATE
  USING ((auth.jwt() ->> 'email') = 'admin@kazipro.com')
  WITH CHECK ((auth.jwt() ->> 'email') = 'admin@kazipro.com');
```

## ✅ Puis Testez:

1. Rechargez http://localhost:8080/dashboard/admin/prestataires
2. Ouvrez la console (F12)
3. Cliquez sur "Vérifier"
4. Ça devrait marcher! 🎉

---

## 🔍 Dans la Console Vous Verrez:

```
🔄 Tentative de vérification du prestataire: 65ae32e5-...
✅ Prestataire vérifié: [{verified: true, documents_verified: true, ...}]
```

---

**C'est tout! Le problème était que les policies ne peuvent pas accéder à `auth.users`, on utilise maintenant `auth.jwt()`.** 🚀
