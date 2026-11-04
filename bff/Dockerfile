FROM node:24-alpine

WORKDIR /apps
COPY package*.json ./

RUN npm install

COPY . .

RUN mkdir -p logs && \
    chown -R node:node /apps/logs && \
    chown -R node:node /apps/assets && \
    chown node:node /apps

USER node

ARG PORT=4000
ARG APP_VERSION=0.0.0


ENV PORT=${PORT}
ENV APP_VERSION=${APP_VERSION}


EXPOSE ${PORT}
CMD [ "npm","start" ]
