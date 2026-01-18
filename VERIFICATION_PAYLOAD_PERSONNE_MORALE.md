# 🔍 Vérification du Payload - Personne Morale

## 📊 Ce qui est envoyé

### Étape 1: Création du compte Auth ✅
```json
{
  "email": "naarateam21.0@gmail.com",
  "password": "123456",
  "data": {
    "role": "prestataire",
    "full_name": "SARL NAARA"
  }
}
```
**C'est normal** - Juste pour créer le compte utilisateur

### Étape 2: Création du profil prestataire ✅
```json
{
  // Champs communs
  "user_id": "uuid-généré",
  "type_prestataire": "morale",
  "full_name": "SARL NAARA",
  "email": "naarateam21.0@gmail.com",
  "profession": "Maçon",
  "bio": "Description...",
  "experience_years": 10,
  "rating": 0,
  "verified": false,
  "documents_verified": false,
  "id_document_url": "https://...",
  "qualification_url": "https://...",
  
  // Champs personne morale
  "raison_sociale": "SARL NAARA",
  "forme_juridique": "SARL",
  "numero_rccm": "CD/KIN/RCCM/123",
  "numero_impot": "A1234567Z",
  "numero_id_nat": "ID-NAT-123",
  "representant_legal_nom": "Nom du représentant",
  "representant_legal_prenom": "Prénom du représentant",
  "representant_legal_fonction": "Gérant",
  "adresse_siege": "123 Avenue...",
  "ville_siege": "Kinshasa",
  "pays_siege": "RDC"
}
```

## 🧪 Comment vérifier

### 1. Ouvrir la console du navigateur
- Appuyer sur **F12**
- Aller dans l'onglet **Console**

### 2. Faire une inscription
- Remplir le formulaire personne morale
- Soumettre

### 3. Chercher le message
```
📤 Données prestataire à envoyer: {
  user_id: "...",
  type_prestataire: "morale",
  raison_sociale: "SARL NAARA",
  ...
}
```

### 4. Vérifier que tous les champs sont présents
- ✅ raison_sociale
- ✅ forme_juridique
- ✅ numero_rccm
- ✅ numero_impot
- ✅ numero_id_nat
- ✅ representant_legal_nom
- ✅ representant_legal_prenom
- ✅ representant_legal_fonction
- ✅ adresse_siege
- ✅ ville_siege
- ✅ pays_siege

## 🔍 Vérifier dans Supabase

### 1. Aller dans Supabase
- Table Editor → prestataires

### 2. Trouver le prestataire
- Chercher par email: naarateam21.0@gmail.com

### 3. Vérifier les colonnes
- Cliquer sur la ligne
- Vérifier que tous les champs personne morale sont remplis

## ⚠️ Si des champs manquent

### Problème: Champs NULL dans la base
**Cause**: Les champs n'ont pas été remplis dans le formulaire

**Solution**: Vérifier que tu as bien rempli:
1. Raison sociale
2. Représentant légal (au minimum le nom)
3. Les autres champs sont optionnels

### Problème: Erreur "column does not exist"
**Cause**: Les scripts SQL n'ont pas été exécutés

**Solution**: Exécuter dans l'ordre:
1. `sql/add_personne_physique_morale_sans_contraintes.sql`
2. `sql/add_phone_column.sql`

### Problème: Payload ne contient pas les champs
**Cause**: Erreur dans le code

**Solution**: Vérifier que le code contient bien:
```typescript
if (typePrestataire === 'morale') {
  prestataireData.raison_sociale = formData.raisonSociale;
  prestataireData.forme_juridique = formData.formeJuridique || null;
  // ... etc
}
```

## 📝 Exemple complet

### Formulaire rempli
```
Type: 🏢 Personne Morale
Raison sociale: SARL NAARA
Forme juridique: SARL
Numéro RCCM: CD/KIN/RCCM/2024/001
Numéro fiscal: A1234567Z
Numéro ID Nat: ID-NAT-123456
Représentant: Jean Mukendi
Fonction: Gérant
Adresse siège: 123 Avenue de la Paix
Ville siège: Kinshasa
Email: naarateam21.0@gmail.com
Mot de passe: 123456
Service: Maçon
Ville: Kinshasa
Expérience: 10 ans
```

### Payload envoyé (visible dans console)
```javascript
{
  user_id: "550e8400-e29b-41d4-a716-446655440000",
  type_prestataire: "morale",
  full_name: "SARL NAARA",
  email: "naarateam21.0@gmail.com",
  profession: "Maçon",
  bio: "Prestataire Maçon avec 10 ans d'expérience à Kinshasa",
  experience_years: 10,
  rating: 0,
  verified: false,
  documents_verified: false,
  id_document_url: "https://xxx.supabase.co/storage/v1/object/public/...",
  qualification_url: "https://xxx.supabase.co/storage/v1/object/public/...",
  raison_sociale: "SARL NAARA",
  forme_juridique: "SARL",
  numero_rccm: "CD/KIN/RCCM/2024/001",
  numero_impot: "A1234567Z",
  numero_id_nat: "ID-NAT-123456",
  representant_legal_nom: "Mukendi",
  representant_legal_prenom: "Jean",
  representant_legal_fonction: "Gérant",
  adresse_siege: "123 Avenue de la Paix",
  ville_siege: "Kinshasa",
  pays_siege: "RDC"
}
```

### Résultat dans Supabase
Tous ces champs doivent être visibles dans la table `prestataires`

## ✅ Checklist de vérification

- [ ] Console du navigateur ouverte (F12)
- [ ] Message `📤 Données prestataire à envoyer:` visible
- [ ] Tous les champs personne morale présents dans le payload
- [ ] Inscription réussie
- [ ] Données visibles dans Supabase Table Editor
- [ ] Tous les champs remplis dans la base de données

## 🎯 Conclusion

Le payload que tu as vu (`{"email": "...", "password": "..."}`) est **normal**.

C'est juste la **première étape** pour créer le compte Auth.

La **deuxième étape** envoie TOUTES les informations de la personne morale dans la table `prestataires`.

Pour le vérifier, regarde la console du navigateur avec le message `📤 Données prestataire à envoyer:`.
