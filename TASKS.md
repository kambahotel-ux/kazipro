# ✅ Liste de Tâches Détaillée - KaziPro

## 🔴 PRIORITÉ 1 - CRITIQUE (Jour 1-2)

### Jour 1 : Configuration Backend

#### T1.1 - Créer et configurer Supabase
**Objectif:** Mettre en place la base de données et l'authentification
**Durée estimée:** 1-2h

- [ ] Créer compte Supabase (supabase.com)
- [ ] Créer nouveau projet
- [ ] Récupérer les clés d'API (SUPABASE_URL, SUPABASE_ANON_KEY)
- [ ] Créer fichier `.env.local` avec les clés
- [ ] Tester la connexion

**Fichier à créer:** `.env.local`
```
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key
```

---

#### T1.2 - Créer les tables Supabase
**Objectif:** Structurer la base de données
**Durée estimée:** 2-3h

**Tables à créer (dans Supabase SQL Editor):**

1. **users** (gérée par Supabase Auth)
   - id (UUID, primary key)
   - email (text, unique)
   - phone (text, unique)
   - role (enum: 'client', 'prestataire', 'admin')
   - created_at (timestamp)

2. **clients**
   - id (UUID, primary key)
   - user_id (UUID, foreign key → users.id)
   - full_name (text)
   - address (text)
   - city (text)
   - verified (boolean, default: false)
   - created_at (timestamp)

3. **prestataires**
   - id (UUID, primary key)
   - user_id (UUID, foreign key → users.id)
   - full_name (text)
   - profession (text)
   - bio (text)
   - rating (numeric, default: 0)
   - verified (boolean, default: false)
   - documents_verified (boolean, default: false)
   - created_at (timestamp)

4. **demandes**
   - id (UUID, primary key)
   - client_id (UUID, foreign key → clients.id)
   - title (text)
   - description (text)
   - service (text)
   - location (text)
   - budget_min (numeric)
   - budget_max (numeric)
   - status (enum: 'active', 'completed', 'cancelled')
   - created_at (timestamp)
   - updated_at (timestamp)

5. **devis**
   - id (UUID, primary key)
   - demande_id (UUID, foreign key → demandes.id)
   - prestataire_id (UUID, foreign key → prestataires.id)
   - amount (numeric)
   - description (text)
   - status (enum: 'pending', 'accepted', 'rejected')
   - created_at (timestamp)

6. **missions**
   - id (UUID, primary key)
   - devis_id (UUID, foreign key → devis.id)
   - client_id (UUID, foreign key → clients.id)
   - prestataire_id (UUID, foreign key → prestataires.id)
   - status (enum: 'pending', 'in_progress', 'completed', 'cancelled')
   - start_date (timestamp)
   - end_date (timestamp)
   - created_at (timestamp)

7. **paiements**
   - id (UUID, primary key)
   - mission_id (UUID, foreign key → missions.id)
   - amount (numeric)
   - method (enum: 'mpesa', 'airtel', 'orange')
   - status (enum: 'pending', 'completed', 'failed')
   - created_at (timestamp)

8. **avis**
   - id (UUID, primary key)
   - mission_id (UUID, foreign key → missions.id)
   - from_user_id (UUID, foreign key → users.id)
   - to_user_id (UUID, foreign key → users.id)
   - rating (integer, 1-5)
   - comment (text)
   - created_at (timestamp)

9. **messages**
   - id (UUID, primary key)
   - sender_id (UUID, foreign key → users.id)
   - receiver_id (UUID, foreign key → users.id)
   - content (text)
   - read (boolean, default: false)
   - created_at (timestamp)

**Ressource:** [SQL pour créer les tables](./sql/init_tables.sql)

---

#### T1.3 - Configurer Row Level Security (RLS)
**Objectif:** Sécuriser l'accès aux données
**Durée estimée:** 1h

- [ ] Activer RLS sur toutes les tables
- [ ] Créer policies pour chaque table
- [ ] Tester les permissions

**Exemple de policy pour clients:**
```sql
-- Les clients ne voient que leurs propres données
CREATE POLICY "Clients can view own data"
ON clients FOR SELECT
USING (auth.uid() = user_id);
```

---

### Jour 2 : Intégration Frontend

#### T2.1 - Installer Supabase JS
**Objectif:** Ajouter la dépendance Supabase
**Durée estimée:** 15 min

```bash
npm install @supabase/supabase-js
```

- [ ] Installer @supabase/supabase-js
- [ ] Vérifier l'installation

---

#### T2.2 - Créer AuthContext
**Objectif:** Gérer l'état d'authentification globalement
**Durée estimée:** 1h

**Fichier à créer:** `src/contexts/AuthContext.tsx`

```typescript
import { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  session: Session | null;
  user: any;
  loading: boolean;
  signUp: (email: string, password: string, role: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Récupérer la session actuelle
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => subscription?.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, role: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role }
      }
    });
    if (error) throw error;
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

- [ ] Créer le fichier AuthContext.tsx
- [ ] Implémenter les fonctions d'authentification
- [ ] Tester le contexte

---

#### T2.3 - Créer client Supabase
**Objectif:** Initialiser le client Supabase
**Durée estimée:** 15 min

**Fichier à créer:** `src/lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

- [ ] Créer le fichier supabase.ts
- [ ] Vérifier les variables d'environnement

---

#### T2.4 - Créer ProtectedRoute
**Objectif:** Protéger les routes nécessitant l'authentification
**Durée estimée:** 30 min

**Fichier à créer:** `src/components/ProtectedRoute.tsx`

```typescript
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { session, loading } = useAuth();

  if (loading) {
    return <div>Chargement...</div>;
  }

  if (!session) {
    return <Navigate to="/connexion" replace />;
  }

  return <>{children}</>;
}
```

- [ ] Créer le fichier ProtectedRoute.tsx
- [ ] Tester la protection des routes

---

#### T2.5 - Connecter Login à Supabase
**Objectif:** Implémenter l'authentification réelle
**Durée estimée:** 1h

**Fichier à modifier:** `src/pages/auth/Login.tsx`

- [ ] Remplacer le console.log par appel signIn()
- [ ] Ajouter gestion des erreurs
- [ ] Ajouter loading state
- [ ] Rediriger après connexion réussie

---

#### T2.6 - Envelopper App avec AuthProvider
**Objectif:** Rendre l'authentification disponible partout
**Durée estimée:** 15 min

**Fichier à modifier:** `src/main.tsx`

```typescript
import { AuthProvider } from '@/contexts/AuthContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
)
```

- [ ] Importer AuthProvider
- [ ] Envelopper App avec AuthProvider

---

## 🟠 PRIORITÉ 2 - HAUTE (Jour 3-4)

### T3.1 - Connecter RegisterClient
**Objectif:** Permettre l'inscription des clients
**Durée estimée:** 1h

**Fichier à modifier:** `src/pages/auth/RegisterClient.tsx`

- [ ] Implémenter le formulaire d'inscription
- [ ] Appeler signUp() avec role='client'
- [ ] Créer enregistrement dans table clients
- [ ] Rediriger après inscription

---

### T3.2 - Connecter RegisterProvider
**Objectif:** Permettre l'inscription des prestataires
**Durée estimée:** 1h

**Fichier à modifier:** `src/pages/auth/RegisterProvider.tsx`

- [ ] Implémenter le formulaire d'inscription
- [ ] Appeler signUp() avec role='prestataire'
- [ ] Créer enregistrement dans table prestataires
- [ ] Rediriger après inscription

---

### T3.3 - Implémenter Logout
**Objectif:** Permettre la déconnexion
**Durée estimée:** 30 min

**Fichier à modifier:** `src/components/dashboard/DashboardHeader.tsx`

- [ ] Ajouter bouton logout
- [ ] Appeler signOut()
- [ ] Rediriger vers accueil

---

### T3.4 - Créer pages d'authentification manquantes
**Objectif:** Compléter le flux d'authentification
**Durée estimée:** 2h

**Fichiers à créer:**
- [ ] `src/pages/auth/ForgotPassword.tsx`
- [ ] `src/pages/auth/ResetPassword.tsx`
- [ ] `src/pages/auth/VerifyEmail.tsx`

**Ajouter routes dans App.tsx:**
```typescript
<Route path="/mot-de-passe-oublie" element={<ForgotPassword />} />
<Route path="/reinitialiser-mot-de-passe" element={<ResetPassword />} />
<Route path="/verifier-email" element={<VerifyEmail />} />
```

---

### T3.5 - Tester le flux d'authentification complet
**Objectif:** Vérifier que tout fonctionne
**Durée estimée:** 1h

- [ ] Tester inscription client
- [ ] Tester inscription prestataire
- [ ] Tester connexion
- [ ] Tester déconnexion
- [ ] Tester persistance de session
- [ ] Tester redirection après connexion

---

## 🟡 PRIORITÉ 3 - MOYENNE (Jour 5-7)

### T4.1 - Implémenter MessagesPage Client
**Objectif:** Créer le système de messaging
**Durée estimée:** 2h

**Fichier à créer:** `src/pages/dashboard/client/MessagesPage.tsx`

- [ ] Créer liste des conversations
- [ ] Créer vue détaillée d'une conversation
- [ ] Implémenter fetch des messages
- [ ] Implémenter envoi de message
- [ ] Ajouter realtime avec Supabase subscriptions

---

### T4.2 - Implémenter ParametresPage Client
**Objectif:** Permettre la gestion du profil
**Durée estimée:** 1.5h

**Fichier à créer:** `src/pages/dashboard/client/ParametresPage.tsx`

- [ ] Formulaire de profil
- [ ] Formulaire d'adresse
- [ ] Préférences de notification
- [ ] Changement de mot de passe
- [ ] Suppression de compte

---

### T4.3 - Connecter DemandesPage à Supabase
**Objectif:** Afficher les vraies demandes
**Durée estimée:** 1h

**Fichier à modifier:** `src/pages/dashboard/client/DemandesPage.tsx`

- [ ] Fetch demandes de l'utilisateur
- [ ] Implémenter filtrage
- [ ] Implémenter recherche
- [ ] Afficher les devis reçus

---

### T4.4 - Implémenter upload d'images
**Objectif:** Permettre l'upload de photos
**Durée estimée:** 1.5h

**Fichier à modifier:** `src/pages/dashboard/client/NouvelleDemandePages.tsx`

- [ ] Configurer Supabase Storage
- [ ] Implémenter upload vers Storage
- [ ] Afficher les images uploadées
- [ ] Gérer les erreurs d'upload

---

### T4.5 - Connecter PaiementsPage et AvisPage
**Objectif:** Afficher les vraies données
**Durée estimée:** 1h

**Fichiers à modifier:**
- [ ] `src/pages/dashboard/client/PaiementsPage.tsx`
- [ ] `src/pages/dashboard/client/AvisPage.tsx`

- [ ] Fetch paiements
- [ ] Fetch avis
- [ ] Implémenter édition/suppression d'avis

---

## 📊 Résumé des Tâches

| Priorité | Tâche | Durée | Jour |
|----------|-------|-------|------|
| 🔴 | T1.1 - Supabase setup | 1-2h | 1 |
| 🔴 | T1.2 - Créer tables | 2-3h | 1 |
| 🔴 | T1.3 - RLS | 1h | 1 |
| 🔴 | T2.1 - Installer Supabase JS | 15 min | 2 |
| 🔴 | T2.2 - AuthContext | 1h | 2 |
| 🔴 | T2.3 - Client Supabase | 15 min | 2 |
| 🔴 | T2.4 - ProtectedRoute | 30 min | 2 |
| 🔴 | T2.5 - Login | 1h | 2 |
| 🔴 | T2.6 - AuthProvider | 15 min | 2 |
| 🟠 | T3.1 - RegisterClient | 1h | 3 |
| 🟠 | T3.2 - RegisterProvider | 1h | 3 |
| 🟠 | T3.3 - Logout | 30 min | 3 |
| 🟠 | T3.4 - Auth pages | 2h | 4 |
| 🟠 | T3.5 - Test auth | 1h | 4 |
| 🟡 | T4.1 - MessagesPage | 2h | 5 |
| 🟡 | T4.2 - ParametresPage | 1.5h | 5 |
| 🟡 | T4.3 - DemandesPage | 1h | 6 |
| 🟡 | T4.4 - Upload images | 1.5h | 6 |
| 🟡 | T4.5 - Paiements/Avis | 1h | 7 |

**Total estimé:** ~25 heures (3-4 jours de travail intensif)

---

## 🚀 Prochaines Étapes Après Priorité 3

1. Implémenter les pages prestataire (MessagesPage, ParametresPage, ProfilPage, CalendrierPage, DevisPage, RevenusPage)
2. Implémenter les pages admin (UsersPage, ProvidersPage, RequestsPage, DisputesPage, TransactionsPage, ReportsPage, ConfigPage)
3. Intégrer les paiements (M-Pesa, Airtel Money, Orange Money)
4. Ajouter les notifications en temps réel
5. Tests et optimisations
6. Déploiement

---

## 📝 Notes

- Chaque tâche doit être testée avant de passer à la suivante
- Utiliser React Query pour la gestion des données
- Ajouter des loading states et error handling
- Documenter le code au fur et à mesure
- Faire des commits Git réguliers

