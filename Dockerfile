FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Public Firebase config - these are safe to hardcode as they're
# already exposed in the client-side JavaScript bundle.
ENV NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC2u4nkuyMhLQpySHkKtOSdiAD6Hgy6HS8
ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=fattytoro.firebaseapp.com
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID=fattytoro
ENV NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=fattytoro.firebasestorage.app
ENV NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1060643788581
ENV NEXT_PUBLIC_FIREBASE_APP_ID=1:1060643788581:web:99796fff77d78f2d482ccc

RUN npx next build --webpack

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 8080

CMD ["node", "server.js"]
