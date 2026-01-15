# ⚡ Quick Start - KaziPro

## 🎯 Objectif
Mettre en place l'authentification Supabase en 2 jours.

---

## 📋 Checklist Rapide

### Jour 1 : Configuration (2-3h)

#### Étape 1 : Supabase Setup (30 min)
```bash
# 1. Va sur https://supabase.com
# 2. Crée un nouveau projet
# 3. Attends que le projet soit créé
# 4. Va dans Settings → API
# 5. Copie SUPABASE_URL et SUPABASE_ANON_KEY
```

#### Étape 2 : Créer .env.local (5 min)
```bash
# À la racine du projet
cat > .env.local << EOF
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
EOF
```

#### Étape 3 : Initialiser la BD (30 min)
```bash
# 1. Va dans Supabase → SQL Editor
# 2. Clique "New Query"
# 3. Copie le contenu de sql/init_tables.sql
# 4. Colle-le et clique "Run"
# 5. Attends que tout soit créé
```

#### Étape 4 : Installer Supabase JS (5 min)
```bash
npm install @supabase/supabase-js
```

#### Étape 5 : Créer les fichiers (1h)

**Fichier 1:** `src/lib/supabase.ts`
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

**Fichier 2:** `src/contexts/AuthContext.tsx`
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
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

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
      options: { data: { role } }
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

**Fichier 3:** `src/components/ProtectedRoute.tsx`
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

#### Étape 6 : Modifier les fichiers existants (30 min)

**Modifier:** `src/main.tsx`
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

**Modifier:** `src/pages/auth/Login.tsx`
Remplace la fonction `handleSubmit` :
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    setLoading(true);
    await signIn(phone, password);
    navigate('/dashboard/client');
  } catch (error) {
    console.error('Login error:', error);
    alert('Erreur de connexion');
  } finally {
    setLoading(false);
  }
};
```

**Modifier:** `src/App.tsx`
Enveloppe les routes du dashboard :
```typescript
import { ProtectedRoute } from '@/components/ProtectedRoute';

// Avant
<Route path="/dashboard/client" element={<ClientDashboard />} />

// Après
<Route path="/dashboard/client" element={<ProtectedRoute><ClientDashboard /></ProtectedRoute>} />
```

Fais la même chose pour toutes les routes du dashboard.

---

### Jour 2 : Test et Déploiement (1-2h)

#### Étape 1 : Lancer le serveur (5 min)
```bash
npm run dev
```

#### Étape 2 : Tester l'inscription (15 min)
```bash
# 1. Va sur http://localhost:5173/inscription/client
# 2. Remplis le formulaire
# 3. Clique "S'inscrire"
# 4. Vérifie dans Supabase Dashboard → Authentication → Users
```

#### Étape 3 : Tester la connexion (15 min)
```bash
# 1. Va sur http://localhost:5173/connexion
# 2. Utilise les identifiants créés
# 3. Clique "Se connecter"
# 4. Tu devrais être redirigé vers /dashboard/client
```

#### Étape 4 : Tester la protection des routes (10 min)
```bash
# 1. Va sur http://localhost:5173/dashboard/client
# 2. Tu devrais être redirigé vers /connexion
# 3. Connecte-toi
# 4. Tu devrais accéder au dashboard
```

#### Étape 5 : Tester la déconnexion (10 min)
```bash
# 1. Clique sur le bouton de déconnexion
# 2. Tu devrais être redirigé vers /connexion
# 3. Essaie d'accéder à /dashboard/client
# 4. Tu devrais être redirigé vers /connexion
```

---

## ✅ Checklist de Validation

- [ ] Supabase est configuré
- [ ] .env.local existe avec les bonnes clés
- [ ] Les tables sont créées
- [ ] @supabase/supabase-js est installé
- [ ] src/lib/supabase.ts existe
- [ ] src/contexts/AuthContext.tsx existe
- [ ] src/components/ProtectedRoute.tsx existe
- [ ] src/main.tsx est modifié
- [ ] src/pages/auth/Login.tsx est modifié
- [ ] src/App.tsx est modifié
- [ ] L'inscription fonctionne
- [ ] La connexion fonctionne
- [ ] La protection des routes fonctionne
- [ ] La déconnexion fonctionne

---

## 🚀 Prochaines Étapes

Une fois l'authentification fonctionnelle :

1. Connecter RegisterClient et RegisterProvider
2. Implémenter logout
3. Créer pages d'auth manquantes
4. Implémenter MessagesPage client
5. Implémenter ParametresPage client
6. Connecter DemandesPage à Supabase
7. Implémenter upload d'images

---

## 🐛 Dépannage Rapide

### Erreur : "Missing Supabase environment variables"
```bash
# Vérifier que .env.local existe et contient :
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

### Erreur : "Cannot find module '@supabase/supabase-js'"
```bash
npm install @supabase/supabase-js
```

### Erreur : "Invalid login credentials"
```bash
# Vérifier que l'utilisateur existe dans Supabase
# Vérifier que le mot de passe est correct
```

### La page de login ne se connecte pas
```bash
# Ouvrir la console (F12)
# Regarder les erreurs
# Vérifier que Supabase est accessible
```

---

## 📞 Besoin d'Aide ?

1. Consulte **GETTING_STARTED.md** pour plus de détails
2. Consulte **COMMANDS.md** pour les commandes utiles
3. Consulte **TASKS.md** pour les tâches détaillées
4. Consulte **CHECKLIST.md** pour suivre ta progression

---

## 🎉 Félicitations !

Si tu as complété cette checklist, tu as :
- ✅ Configuré Supabase
- ✅ Créé la base de données
- ✅ Implémenté l'authentification
- ✅ Protégé les routes
- ✅ Testé le flux complet

**Prochaine étape:** Lis **TASKS.md** pour les tâches suivantes ! 🚀

---

**Durée totale:** 2 jours  
**Difficulté:** Facile  
**Prérequis:** Node.js, npm, compte Supabase

