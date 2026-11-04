FROM node:24-alpine

WORKDIR /apps
COPY package.json .
COPY package-lock.json .
COPY tsconfig.json .

RUN npm install

COPY ./src ./src
COPY ./templates ./templates

RUN npm run build && \
    rm -rf src tsconfig.json && \
    mkdir logs uploads && \
    chown -R node:node /apps

USER node

ARG PORT=5000
ENV PORT=${PORT}

EXPOSE ${PORT}
CMD [ "npm","start" ]