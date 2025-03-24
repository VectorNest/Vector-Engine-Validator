FROM node:22-bookworm

USER node

WORKDIR /daemon

COPY --chown=node:node package*.json .
COPY --chown=node:node . .

RUN npm ci
RUN npm run build

CMD ["bash", "/daemon/start.sh"]