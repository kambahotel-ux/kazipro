# 🎯 Rendre les Paramètres Entièrement Fonctionnels

## État Actuel

### ✅ Fonctionnel
- **Entreprise:** Logo, signature, infos → Sauvegarde OK
- **Disponibilité:** Toggle disponibilité, horaires → Sauvegarde OK

### ⚠️ À Compléter
- **Notifications:** UI seulement, pas de sauvegarde
- **Sécurité:** Changement mot de passe, 2FA → Pas implémenté
- **Préférences:** Langue, fuseau horaire → Pas de sauvegarde

### ❌ À Ignorer
- **Paiements:** Comme demandé par l'utilisateur

---

## Plan d'Action

### 1. Créer Table `prestataire_settings`
```sql
CREATE TABLE prestataire_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prestataire_id UUID REFERENCES prestataires(id) ON DELETE CASCADE,
  
  -- Notifications
  notif_nouvelles_missions BOOLEAN DEFAULT true,
  notif_messages_clients BOOLEAN DEFAULT true,
  notif_maj_missions BOOLEAN DEFAULT true,
  notif_rappels_rdv BOOLEAN DEFAULT false,
  notif_promotions BOOLEAN DEFAULT false,
  
  email_resume_hebdo BOOLEAN DEFAULT true,
  email_nouvelles_missions BOOLEAN DEFAULT false,
  email_paiements BOOLEAN DEFAULT true,
  
  sms_missions_urgentes BOOLEAN DEFAULT true,
  sms_codes_verification BOOLEAN DEFAULT true,
  
  -- Préférences
  langue VARCHAR(10) DEFAULT 'fr',
  fuseau_horaire VARCHAR(50) DEFAULT 'Africa/Kinshasa',
  
  -- Disponibilité
  mode_vacances BOOLEAN DEFAULT false,
  accepter_urgences BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(prestataire_id)
);
```

### 2. Implémenter Sauvegarde Notifications
- Charger les préférences depuis `prestataire_settings`
- Sauvegarder à chaque changement de Switch

### 3. Implémenter Changement Mot de Passe
- Utiliser `supabase.auth.updateUser()`
- Validation du mot de passe actuel
- Confirmation du nouveau mot de passe

### 4. Implémenter Préférences
- Sauvegarder langue et fuseau horaire
- Appliquer les changements à l'interface

---

## Fichiers à Modifier

1. `sql/create_prestataire_settings.sql` - Nouvelle table
2. `src/pages/dashboard/prestataire/ParametresPage.tsx` - Logique de sauvegarde
3. Ajouter RLS policies pour `prestataire_settings`

---

Je vais maintenant implémenter ces fonctionnalités.
