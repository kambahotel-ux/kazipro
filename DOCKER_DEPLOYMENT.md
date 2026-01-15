# Déploiement Docker - Kazi

## Prérequis

- Docker installé (version 20.10+)
- Docker Compose installé (version 2.0+)
- Fichier `.env.local` configuré avec les variables Supabase

## Variables d'environnement requises

Créez un fichier `.env.local` à la racine du projet avec :

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-cle-anon
VITE_API_BASE_URL=https://votre-api.com
VITE_N8N_WEBHOOK_URL=https://votre-n8n-webhook.com
```

## Build de l'image Docker

```bash
# Build simple
docker build -t kazi-app .

# Build avec variables d'environnement
docker build \
  --build-arg VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
  --build-arg VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY \
  --build-arg VITE_API_BASE_URL=$VITE_API_BASE_URL \
  --build-arg VITE_N8N_WEBHOOK_URL=$VITE_N8N_WEBHOOK_URL \
  -t kazi-app .
```

## Lancer avec Docker Compose

```bash
# Démarrer l'application
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Arrêter l'application
docker-compose down
```

## Lancer avec Docker directement

```bash
# Lancer le container
docker run -d \
  --name kazi-app \
  -p 3200:3200 \
  kazi-app

# Voir les logs
docker logs -f kazi-app

# Arrêter le container
docker stop kazi-app
docker rm kazi-app
```

## Déploiement sur Coolify

1. **Créer un nouveau projet dans Coolify**
2. **Connecter votre repository GitHub**
3. **Configurer les variables d'environnement** dans Coolify :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_API_BASE_URL`
   - `VITE_N8N_WEBHOOK_URL`

4. **Configuration du port** : 3200
5. **Health check** : `/health`
6. **Déployer** : Coolify détectera automatiquement le Dockerfile

## Vérification

Une fois déployé, vérifiez que l'application fonctionne :

```bash
# Health check
curl http://localhost:3200/health

# Accéder à l'application
open http://localhost:3200
```

## Troubleshooting

### L'application ne démarre pas

```bash
# Vérifier les logs
docker logs kazi-app

# Vérifier que le port 3200 est libre
lsof -i :3200
```

### Erreur de build

```bash
# Nettoyer le cache Docker
docker builder prune

# Rebuild sans cache
docker build --no-cache -t kazi-app .
```

### Variables d'environnement non prises en compte

Les variables Vite doivent être passées au **build time**, pas au runtime. Assurez-vous de les passer avec `--build-arg`.

## Architecture

- **Stage 1** : Build de l'application React/Vite avec Node.js 22
- **Stage 2** : Serveur de production avec Nginx Alpine
- **Port** : 3200
- **Health check** : `/health` endpoint
- **Sécurité** : Utilisateur non-root (nginx)
