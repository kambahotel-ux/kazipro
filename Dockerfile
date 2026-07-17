# Stage 1: Build de l'application React/Vite
FROM node:22-alpine AS builder

# Installer les dépendances nécessaires pour le build
RUN apk add --no-cache libc6-compat

# Définir le dossier de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances (y compris devDependencies pour le build)
RUN npm ci --no-audit --no-fund

# Copier le code source
COPY . .

# Builder l'application (les fichiers seront dans dist/)
# Les variables d'environnement Vite doivent être passées au build time
ARG VITE_API_URL
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_N8N_WEBHOOK_URL

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_N8N_WEBHOOK_URL=$VITE_N8N_WEBHOOK_URL

RUN npm run build

# Stage 2: Production avec nginx
FROM nginx:alpine

# Installer curl pour le health check
RUN apk add --no-cache curl

# Copier la configuration nginx personnalisée
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copier les fichiers buildés depuis le stage builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Changer la propriété des fichiers pour nginx
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d

# Créer le répertoire pour les fichiers temporaires nginx
RUN mkdir -p /var/run/nginx && \
    chown -R nginx:nginx /var/run/nginx

# Variables d'environnement
ENV NODE_ENV=production

# Exposer le port 3200 (frontend Coolify — remplace 7200 du modèle initial)
EXPOSE 3200

# Health check pour Coolify (sur le port 3200)
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3200/health || exit 1

# Commande de démarrage nginx
CMD ["nginx", "-g", "daemon off;"]
