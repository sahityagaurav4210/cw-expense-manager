FROM node:24-alpine AS builder
WORKDIR /app


COPY package*.json ./

RUN npm install --legacy-peer-deps
COPY . .

ARG PORT=3663
ARG VITE_CAPTCHA_SERVICE_URL=http://localhost:11906
ARG VITE_BFF_URL=http://localhost:4000/api/v1
ARG VITE_METRICS_INTERVAL_MINUTES=2
ARG VITE_APP_VERSION=1.0.0

ENV EXPOSE_PORT=${PORT}
ENV VITE_CAPTCHA_SERVICE_URL=${VITE_CAPTCHA_SERVICE_URL}
ENV VITE_BFF_URL=${VITE_BFF_URL}
ENV VITE_METRICS_INTERVAL_MINUTES=${VITE_METRICS_INTERVAL_MINUTES}
ENV VITE_APP_VERSION=${VITE_APP_VERSION}

RUN npm run build

FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid /var/cache/nginx /var/log/nginx /etc/nginx/conf.d /usr/share/nginx/html
USER nginx

EXPOSE ${EXPOSE_PORT}
CMD ["nginx", "-g", "daemon off;"]