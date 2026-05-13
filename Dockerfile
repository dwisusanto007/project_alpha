FROM node:22-slim

# ── Chrome dependencies for Puppeteer ─────────────────
RUN apt-get update && apt-get install -y \
  chromium \
  fonts-liberation \
  libappindicator3-1 \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libcups2 \
  libdbus-1-3 \
  libgbm1 \
  libgtk-3-0 \
  libnspr4 \
  libnss3 \
  libx11-xcb1 \
  libxcomposite1 \
  libxdamage1 \
  libxfixes3 \
  libxrandr2 \
  libxss1 \
  libxtst6 \
  xdg-utils \
  --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

# Tell Puppeteer to use system Chromium — skip bundled download
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

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
