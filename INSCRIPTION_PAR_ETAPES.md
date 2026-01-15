# ✅ Inscription Prestataire par Étapes

## 🎯 Nouvelle Fonctionnalité

L'inscription des prestataires se fait maintenant en **3 étapes** pour une meilleure expérience utilisateur.

---

## 📋 Les 3 Étapes

### Étape 1: Informations Personnelles
- Nom complet
- Email
- Mot de passe (+ confirmation)
- Profession (sélection)
- Ville
- Années d'expérience
- Bio (optionnel)

### Étape 2: Documents
- **Carte d'identité** (obligatoire)
- Certificats professionnels (optionnel)
- Portfolio / Photos de travaux (optionnel)

**Formats acceptés:** PDF, JPG, PNG (max 5MB par fichier)

### Étape 3: Révision et Soumission
- Vérification de toutes les informations
- Liste des documents uploadés
- Bouton de soumission finale

---

## 🎨 Fonctionnalités

### Barre de Progression
- Indicateur visuel de l'étape actuelle
- Affichage "Étape X sur 3"
- Barre de progression animée

### Navigation
- Bouton "Suivant" pour avancer
- Bouton "Retour" pour revenir en arrière
- Validation à chaque étape

### Upload de Documents
- Zone de drag & drop visuelle
- Aperçu du fichier uploadé
- Icône de validation (✓) quand uploadé
- Limite de taille (5MB)
- Formats acceptés clairement indiqués

### Validation
- Validation en temps réel
- Messages d'erreur clairs
- Champs obligatoires marqués avec *

---

## 🚀 Accès

### Nouvelle URL:
http://localhost:8080/inscription/prestataire

### Ancienne URL (simple):
http://localhost:8080/inscription/prestataire/simple

---

## 📁 Fichiers Créés

1. **src/pages/auth/RegisterProviderSteps.tsx**
   - Nouveau composant avec 3 étapes
   - Gestion de l'état pour chaque étape
   - Upload de fichiers
   - Validation complète

2. **src/App.tsx**
   - Route mise à jour vers RegisterProviderSteps
   - Ancienne route conservée en `/simple`

---

## 🎯 Workflow Complet

```
1. Utilisateur arrive sur /inscription/prestataire
   ↓
2. ÉTAPE 1: Remplit ses informations
   - Validation des champs
   - Clic sur "Suivant"
   ↓
3. ÉTAPE 2: Upload des documents
   - Upload carte d'identité (obligatoire)
   - Upload certificats (optionnel)
   - Upload portfolio (optionnel)
   - Clic sur "Suivant"
   ↓
4. ÉTAPE 3: Révision
   - Affichage de toutes les infos
   - Liste des documents
   - Message d'information sur la vérification
   - Clic sur "Soumettre mon inscription"
   ↓
5. Création du compte
   - Compte Supabase Auth créé
   - Profil prestataire créé
   - Documents enregistrés (TODO: upload vers Storage)
   ↓
6. Redirection vers /prestataire/en-attente
   - Message "En attente de vérification"
   - Email de confirmation envoyé
```

---

## 🔧 TODO: Upload vers Supabase Storage

Actuellement, les fichiers sont sélectionnés mais pas encore uploadés vers Supabase Storage.

### À implémenter:

```typescript
// 1. Créer un bucket dans Supabase Storage
// Dashboard → Storage → Create bucket: "provider-documents"

// 2. Uploader les fichiers
const uploadDocument = async (file: File, userId: string, docType: string) => {
  const fileName = `${userId}/${docType}-${Date.now()}.${file.name.split('.').pop()}`;
  
  const { data, error } = await supabase.storage
    .from('provider-documents')
    .upload(fileName, file);
    
  if (error) throw error;
  
  // Récupérer l'URL publique
  const { data: { publicUrl } } = supabase.storage
    .from('provider-documents')
    .getPublicUrl(fileName);
    
  return publicUrl;
};

// 3. Sauvegarder les URLs dans la table prestataires
// Ajouter des colonnes: id_card_url, certificate_url, portfolio_url
```

---

## ✅ Avantages

### Pour l'Utilisateur:
- ✅ Processus clair et guidé
- ✅ Pas de surcharge d'informations
- ✅ Validation progressive
- ✅ Possibilité de revenir en arrière
- ✅ Aperçu avant soumission

### Pour l'Admin:
- ✅ Documents organisés
- ✅ Informations complètes
- ✅ Meilleure vérification possible
- ✅ Moins d'erreurs de saisie

---

## 🧪 Test

1. Allez sur http://localhost:8080/inscription/prestataire
2. Remplissez l'étape 1 et cliquez "Suivant"
3. Uploadez au moins la carte d'identité
4. Cliquez "Suivant"
5. Vérifiez les informations
6. Cliquez "Soumettre mon inscription"
7. Vous devriez être redirigé vers la page d'attente

---

## 📝 Notes Importantes

1. **Email Column**: Assurez-vous d'avoir exécuté `sql/setup_email_column_complete.sql`
2. **RLS Policies**: Assurez-vous d'avoir exécuté `sql/fix_admin_update_simple.sql`
3. **Email Confirmation**: Doit être désactivée dans Supabase Settings

---

## 🎨 Design

- Interface moderne et épurée
- Barre de progression visuelle
- Zones d'upload intuitives
- Responsive (mobile-friendly)
- Dark mode compatible
- Animations fluides

---

**L'inscription par étapes est maintenant active!** 🎉

Pour tester: http://localhost:8080/inscription/prestataire
