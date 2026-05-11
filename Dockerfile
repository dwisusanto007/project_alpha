FROM node:22-slim

WORKDIR /app

# ── Backend dependencies ──────────────────────────────
COPY package*.json ./
RUN npm ci --omit=dev

# ── Client portal (React) ─────────────────────────────
COPY client/package*.json ./client/
RUN cd client && npm ci

COPY client/ ./client/
RUN cd client && npm run build && rm -rf node_modules

# ── Developer dashboard (React) ───────────────────────
COPY app/package*.json ./app/
RUN cd app && npm ci

COPY app/ ./app/
RUN cd app && npm run build && rm -rf node_modules

# ── Rest of source ────────────────────────────────────
COPY . .

EXPOSE 8080
ENV PORT=8080

CMD ["node", "index.js"]
