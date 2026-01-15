# 🚀 Guide de Démarrage - KaziPro

## Avant de commencer

Assure-toi d'avoir :
- Node.js 18+ installé
- npm ou yarn
- Un compte Supabase (gratuit sur supabase.com)
- Git

---

## Étape 1 : Configuration Supabase (30 min)

### 1.1 Créer un projet Supabase

1. Va sur [supabase.com](https://supabase.com)
2. Clique sur "New Project"
3. Remplis les informations :
   - **Project name:** KaziPro
   - **Database password:** (génère un mot de passe fort)
   - **Region:** Sélectionne la région la plus proche (ex: Europe)
4. Clique sur "Create new project"
5. Attends que le projet soit créé (2-3 min)

### 1.2 Récupérer les clés d'API

1. Va dans **Settings** → **API**
2. Copie :
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** → `VITE_SUPABASE_ANON_KEY`

### 1.3 Créer le fichier `.env.local`

À la racine du projet, crée un fichier `.env.local` :

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 1.4 Initialiser la base de données

1. Va dans Supabase → **SQL Editor**
2. Clique sur **New Query**
3. Copie le contenu de `sql/init_tables.sql`
4. Colle-le dans l'éditeur
5. Clique sur **Run**

✅ Les tables sont créées !

---

## Étape 2 : Installation du Projet (15 min)

### 2.1 Installer les dépendances

```bash
npm install
```

### 2.2 Installer Supabase JS

```bash
npm install @supabase/supabase-js
```

### 2.3 Vérifier que tout fonctionne

```bash
npm run dev
```

Ouvre http://localhost:5173 dans ton navigateur.

---

## Étape 3 : Implémenter l'Authentification (2-3h)

Suis les tâches dans cet ordre :

### 3.1 Créer le client Supabase

**Fichier:** `src/lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### 3.2 Créer AuthContext

**Fichier:** `src/contexts/AuthContext.tsx`

```typescript
import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, role: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Récupérer la session actuelle
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
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

### 3.3 Créer ProtectedRoute

**Fichier:** `src/components/ProtectedRoute.tsx`

```typescript
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/connexion" replace />;
  }

  return <>{children}</>;
}
```

### 3.4 Envelopper App avec AuthProvider

**Fichier:** `src/main.tsx`

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './contexts/AuthContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
)
```

### 3.5 Connecter Login à Supabase

**Fichier:** `src/pages/auth/Login.tsx`

Remplace la fonction `handleSubmit` :

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    setLoading(true);
    await signIn(phone, password);
    navigate('/dashboard/client'); // À adapter selon le rôle
  } catch (error) {
    console.error('Login error:', error);
    // Afficher un toast d'erreur
  } finally {
    setLoading(false);
  }
};
```

### 3.6 Tester l'authentification

1. Lance le serveur : `npm run dev`
2. Va sur http://localhost:5173/connexion
3. Essaie de te connecter avec un compte inexistant (tu devrais voir une erreur)
4. Va sur http://localhost:5173/inscription/client
5. Crée un nouveau compte
6. Essaie de te connecter

---

## Étape 4 : Protéger les Routes (30 min)

**Fichier:** `src/App.tsx`

Enveloppe les routes du dashboard avec `ProtectedRoute` :

```typescript
import { ProtectedRoute } from '@/components/ProtectedRoute';

// Avant
<Route path="/dashboard/client" element={<ClientDashboard />} />

// Après
<Route path="/dashboard/client" element={<ProtectedRoute><ClientDashboard /></ProtectedRoute>} />
```

Fais la même chose pour toutes les routes du dashboard.

---

## Étape 5 : Tester Complètement (1h)

### Checklist de test

- [ ] Créer un compte client
- [ ] Créer un compte prestataire
- [ ] Se connecter avec le compte client
- [ ] Voir le dashboard client
- [ ] Se déconnecter
- [ ] Se connecter avec le compte prestataire
- [ ] Voir le dashboard prestataire
- [ ] Se déconnecter
- [ ] Essayer d'accéder à `/dashboard/client` sans être connecté (devrait rediriger vers login)

---

## 🐛 Dépannage

### Erreur : "Missing Supabase environment variables"

**Solution:** Vérifie que tu as créé le fichier `.env.local` avec les bonnes clés.

### Erreur : "Invalid login credentials"

**Solution:** Vérifie que tu utilises le bon email/mot de passe. Supabase est sensible à la casse.

### Erreur : "Row Level Security violation"

**Solution:** Vérifie que les policies RLS sont correctement configurées dans Supabase.

### La page de login ne se connecte pas

**Solution:** 
1. Ouvre la console du navigateur (F12)
2. Regarde les erreurs
3. Vérifie que Supabase est accessible

---

## 📚 Prochaines Étapes

Une fois l'authentification fonctionnelle :

1. Implémenter les pages client (MessagesPage, ParametresPage)
2. Connecter les pages existantes à Supabase
3. Implémenter les pages prestataire
4. Implémenter les pages admin
5. Ajouter les paiements
6. Ajouter les notifications

---

## 🔗 Ressources Utiles

- [Supabase Docs](https://supabase.com/docs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [React Query](https://tanstack.com/query/latest)
- [shadcn/ui](https://ui.shadcn.com/)

---

## 💡 Tips

- Utilise les **Supabase Logs** pour déboguer les erreurs
- Teste les **RLS policies** dans l'éditeur SQL
- Utilise **React DevTools** pour déboguer le contexte d'authentification
- Fais des **commits Git** réguliers

---

**Bon développement ! 🚀**
