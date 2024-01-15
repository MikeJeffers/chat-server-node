FROM node:20-bullseye-slim
RUN apt-get update && apt-get install -y --no-install-recommends dumb-init

ENV NODE_ENV production

WORKDIR /usr/src/app

COPY . /usr/src/app
RUN npm ci --omit=dev

CMD ["dumb-init", "node", "index.js"]
