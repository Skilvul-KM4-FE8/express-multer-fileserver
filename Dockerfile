FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ENV PORT=4567
ENV PUBLIC_URL=http://your-vps-ip

EXPOSE 4567

CMD ["npm", "start"]
