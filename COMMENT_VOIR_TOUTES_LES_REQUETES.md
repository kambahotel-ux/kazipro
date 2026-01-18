# 🔍 Comment voir TOUTES les requêtes

## 📊 Il y a 2 requêtes lors de l'inscription

### Requête 1: Création du compte Auth
```
POST https://xxx.supabase.co/auth/v1/signup

Payload:
{
  "email": "naarateam22.0@gmail.com",
  "password": "123456",
  "data": {
    "role": "prestataire",
    "full_name": "SARL NAARA"
  }
}
```
☝️ **C'est celle que tu vois** - C'est normal qu'elle soit simple

### Requête 2: Création du profil prestataire
```
POST https://xxx.supabase.co/rest/v1/prestataires

Payload:
{
  "user_id": "...",
  "type_prestataire": "morale",
  "raison_sociale": "SARL NAARA",
  "forme_juridique": "SARL",
  "numero_rccm": "...",
  "representant_legal_nom": "...",
  ... (TOUTES les infos)
}
```
☝️ **C'est celle-ci qui contient tout** - Il faut la trouver

## 🔍 Comment voir la requête 2

### Méthode 1: Console du navigateur (PLUS FACILE)

1. **Ouvrir la console**
   - Appuyer sur **F12**
   - Aller dans l'onglet **Console**

2. **Faire l'inscription**
   - Remplir le formulaire
   - Soumettre

3. **Chercher le message**
   ```
   📤 Données prestataire à envoyer: {
     user_id: "...",
     type_prestataire: "morale",
     raison_sociale: "SARL NAARA",
     ...
   }
   ```

4. **Cliquer sur l'objet pour l'ouvrir**
   - Tu verras TOUS les champs

### Méthode 2: Onglet Network (Réseau)

1. **Ouvrir les DevTools**
   - Appuyer sur **F12**
   - Aller dans l'onglet **Network** (Réseau)

2. **Activer le filtre**
   - Cliquer sur **XHR** ou **Fetch/XHR**

3. **Faire l'inscription**
   - Remplir le formulaire
   - Soumettre

4. **Chercher la requête vers "prestataires"**
   - Dans la liste, chercher une ligne qui contient `prestataires`
   - Cliquer dessus

5. **Voir le payload**
   - Aller dans l'onglet **Payload** ou **Request**
   - Tu verras TOUTES les données envoyées

### Méthode 3: Vérifier directement dans Supabase

1. **Aller sur Supabase**
   - https://supabase.com
   - Ton projet

2. **Table Editor**
   - Cliquer sur **Table Editor** dans le menu
   - Sélectionner la table **prestataires**

3. **Trouver ton inscription**
   - Chercher l'email: `naarateam22.0@gmail.com`
   - Cliquer sur la ligne

4. **Vérifier les colonnes**
   - Scroller vers la droite
   - Tu devrais voir:
     - `type_prestataire`: "morale"
     - `raison_sociale`: "SARL NAARA"
     - `forme_juridique`: "SARL"
     - `numero_rccm`: "..."
     - `representant_legal_nom`: "..."
     - `adresse_siege`: "..."
     - etc.

## 🎯 Ce que tu dois voir

### Dans la console (Méthode 1)
```javascript
📤 Données prestataire à envoyer: 
{
  user_id: "550e8400-e29b-41d4-a716-446655440000",
  type_prestataire: "morale",
  full_name: "SARL NAARA",
  profession: "Maçon",
  bio: "Prestataire Maçon avec 10 ans d'expérience à Kinshasa",
  email: "naarateam22.0@gmail.com",
  rating: 0,
  verified: false,
  documents_verified: false,
  id_document_url: "https://...",
  qualification_url: "https://...",
  experience_years: 10,
  raison_sociale: "SARL NAARA",
  forme_juridique: "SARL",
  numero_rccm: "CD/KIN/RCCM/123",
  numero_impot: "A1234567Z",
  numero_id_nat: "ID-NAT-123",
  representant_legal_nom: "Mukendi",
  representant_legal_prenom: "Jean",
  representant_legal_fonction: "Gérant",
  adresse_siege: "123 Avenue de la Paix",
  ville_siege: "Kinshasa",
  pays_siege: "RDC"
}
```

### Dans Network (Méthode 2)
```
Name: prestataires
Method: POST
Status: 201 Created

Request Payload:
{
  "user_id": "...",
  "type_prestataire": "morale",
  "raison_sociale": "SARL NAARA",
  ... (tous les champs)
}
```

### Dans Supabase (Méthode 3)
```
Table: prestataires
Row: naarateam22.0@gmail.com

Colonnes visibles:
- id: 123
- user_id: 550e8400-...
- type_prestataire: morale
- full_name: SARL NAARA
- raison_sociale: SARL NAARA
- forme_juridique: SARL
- numero_rccm: CD/KIN/RCCM/123
- representant_legal_nom: Mukendi
- adresse_siege: 123 Avenue de la Paix
- ville_siege: Kinshasa
... etc
```

## ⚠️ Si tu ne vois pas la requête 2

### Problème possible 1: Erreur avant l'envoi
**Symptôme**: Pas de message dans la console, pas de requête vers prestataires

**Solution**: Vérifier s'il y a des erreurs dans la console

### Problème possible 2: Erreur lors de l'envoi
**Symptôme**: Message dans la console, mais erreur après

**Solution**: Vérifier les scripts SQL ont été exécutés

### Problème possible 3: Tu regardes la mauvaise requête
**Symptôme**: Tu vois seulement la requête auth/signup

**Solution**: Scroller dans l'onglet Network pour trouver la requête "prestataires"

## 📸 Captures d'écran à faire

Pour que je puisse t'aider, fais des captures de:

1. **Console** (F12 → Console)
   - Tout ce qui s'affiche après la soumission

2. **Network** (F12 → Network → XHR)
   - La liste des requêtes
   - Le détail de la requête "prestataires" si elle existe

3. **Supabase Table Editor**
   - La ligne avec ton email
   - Les colonnes personne morale

## 🎯 Question importante

**Est-ce que l'inscription se termine avec succès ?**
- ✅ Oui → Message "Inscription réussie" + Redirection
- ❌ Non → Message d'erreur

Si oui, alors les données SONT envoyées, il faut juste les trouver dans Supabase.
