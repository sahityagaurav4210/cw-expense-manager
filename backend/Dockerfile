FROM node:24-alpine

# Install Chromium, fonts, and required libraries for headless PDF generation in Docker Alpine
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    font-noto-emoji

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    CHROME_BIN=/usr/bin/chromium-browser

WORKDIR /apps
COPY package.json .
COPY package-lock.json .
COPY tsconfig.json .

RUN npm install

COPY . .

RUN npm run build && \
    rm -rf src tsconfig.json && \
    mkdir -p logs uploads && \
    chown -R node:node /apps/logs /apps/uploads && \
    chown node:node /apps

USER node

ARG PORT=5000
ENV PORT=${PORT}

EXPOSE ${PORT}
CMD [ "npm","start" ]
