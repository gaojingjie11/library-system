FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force
COPY . .
RUN chown -R node:node /app
USER node
EXPOSE 3000
CMD ["node", "app.js"]
