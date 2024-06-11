FROM node:20-bullseye-slim

WORKDIR /var/app

COPY --from=root package-lock.json .
COPY package.json .

RUN npm ci

COPY . .

RUN npm run build
RUN npm prune --production

ENV NODE_ENV="production"

CMD ["npm", "run", "start"]
