FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 4173

# Proxy /api -> service "app" di docker-compose
ENV API_PROXY=http://app:6969

CMD ["npx", "vite", "preview", "--host", "0.0.0.0", "--port", "4173"]
