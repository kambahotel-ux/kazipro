# Fix: Table Messages Manquante 💬

## ❌ Erreur
```
PGRST205: Could not find the table 'public.messages' in the schema cache
```

## ✅ Solution

La table `messages` n'existe pas dans votre base de données. Je viens de créer le script SQL complet pour la créer.

### 📝 Étapes à Suivre

1. **Ouvrir Supabase Dashboard**
   - Allez sur https://supabase.com
   - Sélectionnez votre projet KaziPro

2. **Exécuter le Script SQL**
   - Cliquez sur "SQL Editor" dans le menu de gauche
   - Cliquez sur "New Query"
   - Copiez tout le contenu du fichier `sql/create_messages_table.sql`
   - Collez-le dans l'éditeur
   - Cliquez sur "Run" ou appuyez sur `Ctrl+Enter`

3. **Vérifier la Création**
   - Allez dans "Table Editor"
   - Vous devriez voir la table `messages` dans la liste

## 📊 Structure de la Table Messages

### Colonnes Principales
- `id` - UUID unique du message
- `sender_id` - ID de l'expéditeur (référence auth.users)
- `receiver_id` - ID du destinataire (référence auth.users)
- `content` - Contenu du message (TEXT)
- `demande_id` - Lien optionnel vers une demande
- `devis_id` - Lien optionnel vers un devis
- `read` - Message lu ou non (BOOLEAN)
- `read_at` - Date de lecture
- `created_at` - Date de création
- `updated_at` - Date de modification

### 🔒 Sécurité RLS

**Politiques configurées :**
1. ✅ Les utilisateurs peuvent voir leurs messages (envoyés ou reçus)
2. ✅ Les utilisateurs peuvent envoyer des messages
3. ✅ Les utilisateurs peuvent marquer leurs messages reçus comme lus
4. ✅ Les admins peuvent voir tous les messages

### 🚀 Fonctionnalités Incluses

#### 1. Fonction: Marquer comme lu
```sql
SELECT mark_message_as_read('message-uuid-here');
```

#### 2. Fonction: Compter les messages non lus
```sql
SELECT get_unread_message_count();
```

#### 3. Vue: Conversations
La vue `conversations` liste toutes les conversations uniques avec:
- L'autre utilisateur
- Le dernier message
- La date du dernier message
- Le nombre de messages non lus

### 📈 Index pour Performance

Le script crée automatiquement des index sur:
- `sender_id` - Recherche rapide par expéditeur
- `receiver_id` - Recherche rapide par destinataire
- `demande_id` - Messages liés à une demande
- `devis_id` - Messages liés à un devis
- `created_at` - Tri chronologique
- Combinaison `sender_id + receiver_id` - Conversations

## 🎯 Utilisation dans l'Application

### Envoyer un Message
```typescript
const { data, error } = await supabase
  .from('messages')
  .insert({
    sender_id: currentUserId,
    receiver_id: otherUserId,
    content: 'Bonjour, j\'ai une question...',
    demande_id: demandeId // optionnel
  });
```

### Récupérer les Messages d'une Conversation
```typescript
const { data, error } = await supabase
  .from('messages')
  .select('*')
  .or(`and(sender_id.eq.${userId1},receiver_id.eq.${userId2}),and(sender_id.eq.${userId2},receiver_id.eq.${userId1})`)
  .order('created_at', { ascending: true });
```

### Marquer comme Lu
```typescript
const { error } = await supabase
  .rpc('mark_message_as_read', { message_id: messageId });
```

### Compter les Non Lus
```typescript
const { data, error } = await supabase
  .rpc('get_unread_message_count');
```

### Lister les Conversations
```typescript
const { data, error } = await supabase
  .from('conversations')
  .select('*')
  .order('last_message_at', { ascending: false });
```

## 🔄 Après l'Exécution

Une fois le script exécuté:
1. ✅ La table `messages` sera créée
2. ✅ Les politiques RLS seront actives
3. ✅ Les index seront créés
4. ✅ Les fonctions helper seront disponibles
5. ✅ La vue `conversations` sera accessible
6. ✅ L'erreur PGRST205 disparaîtra

## 📱 Pages Concernées

Les pages suivantes utilisent la table messages:
- `/dashboard/client/messages` - Messages du client
- `/dashboard/prestataire/messages` - Messages du prestataire
- `/dashboard/admin/*` - Vue admin des messages

## ⚠️ Important

- Les messages sont liés aux utilisateurs via `auth.users`
- La suppression d'un utilisateur supprime ses messages (CASCADE)
- Les messages peuvent être liés à une demande ou un devis (optionnel)
- Les admins ont accès à tous les messages pour modération

## 🎉 Résultat

Après avoir exécuté ce script, votre système de messagerie sera complètement fonctionnel avec:
- ✅ Envoi et réception de messages
- ✅ Marquage des messages comme lus
- ✅ Compteur de messages non lus
- ✅ Liste des conversations
- ✅ Sécurité RLS complète
- ✅ Performance optimisée avec index

---

**Fichier SQL :** `sql/create_messages_table.sql`
