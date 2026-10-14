FROM node:24-alpine

ARG PORT=3031

WORKDIR /apps
COPY package.json .
COPY package-lock.json .
COPY tsconfig.json .

RUN npm ci

COPY src ./src
COPY templates ./templates
COPY banner.txt ./banner.txt

RUN npm run build && rm -rf src tsconfig.json sonar-project.properties .gitignore README.md CHANGELOG.md

# Create a non-root user and switch to it for runtime safety
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Ensure app files are owned by the non-root user
RUN chown -R appuser:appgroup /apps

USER appuser

EXPOSE ${PORT}
CMD [ "npm","start" ]