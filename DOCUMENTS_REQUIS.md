# 📋 Documents Requis - Inscription Prestataire

## ✅ Mise à Jour

L'étape 2 de l'inscription demande maintenant les **bons documents**:

---

## 📄 Documents Obligatoires

### 1. Document d'Identité *
**Carte d'électeur OU Passeport**

- Format: PDF, JPG, PNG
- Taille max: 5MB
- Le document doit être lisible et à jour

### 2. Document de Qualification *
**Attestation, Diplôme OU Certificat**

- Format: PDF, JPG, PNG
- Taille max: 5MB
- Preuve de vos compétences professionnelles
- Peut être:
  - Attestation de formation
  - Diplôme technique
  - Certificat professionnel
  - Attestation d'expérience

---

## 🎯 Interface Mise à Jour

### Étape 2 - Documents

**Zone 1:**
```
1. Carte d'électeur OU Passeport *
   (PDF, JPG, PNG - Max 5MB)
   
   [Zone d'upload]
   Cliquez pour uploader votre carte d'électeur ou passeport
   Document d'identité officiel requis
```

**Zone 2:**
```
2. Document de qualification *
   (Attestation, Diplôme ou Certificat)
   
   [Zone d'upload]
   Cliquez pour uploader votre attestation, diplôme ou certificat
   Preuve de vos compétences professionnelles
```

**Messages d'information:**
- 📋 En haut: "Documents requis: Vous devez fournir 2 documents obligatoires..."
- ⚠️ En bas: "Important: Les deux documents sont obligatoires..."

---

## ✅ Validation

### Messages d'erreur:
- Si document d'identité manquant: "La carte d'électeur ou le passeport est requis"
- Si qualification manquante: "Un document prouvant votre qualification est requis (attestation, diplôme ou certificat)"

### Étape 3 - Révision:
```
Documents uploadés:
✓ Carte d'électeur/Passeport: [nom_fichier]
✓ Document de qualification: [nom_fichier]
```

---

## 🧪 Test

1. Allez sur http://localhost:8080/inscription/prestataire
2. Remplissez l'étape 1
3. À l'étape 2:
   - Uploadez une carte d'électeur OU un passeport
   - Uploadez un document de qualification
   - Cliquez "Suivant"
4. À l'étape 3:
   - Vérifiez que les 2 documents sont listés
   - Soumettez

---

## 📝 Changements Effectués

### Code:
- ✅ `documents.idCard` → `documents.idDocument`
- ✅ `documents.certificate` → `documents.qualification`
- ✅ `documents.portfolio` → Supprimé (non requis)
- ✅ Labels mis à jour avec les bons noms
- ✅ Messages d'aide plus clairs
- ✅ Validation stricte des 2 documents

### Interface:
- ✅ 2 zones d'upload au lieu de 3
- ✅ Messages d'information ajoutés
- ✅ Descriptions claires pour chaque document
- ✅ Avertissement sur l'obligation des documents

---

## 🎨 Design

### Zone d'upload:
- Bordure en pointillés
- Icône Upload ou FileText
- Nom du fichier affiché avec ✓ quand uploadé
- Hover effect (bordure devient secondary)

### Messages:
- 📋 Bleu: Information sur les documents requis
- ⚠️ Ambre: Avertissement sur l'obligation

---

## 🔧 TODO: Upload vers Storage

Quand l'upload sera implémenté, les documents seront sauvegardés comme:
- `id_document_url` - Carte d'électeur ou Passeport
- `qualification_url` - Attestation, Diplôme ou Certificat

---

**Les bons documents sont maintenant demandés!** ✅

Testez: http://localhost:8080/inscription/prestataire
