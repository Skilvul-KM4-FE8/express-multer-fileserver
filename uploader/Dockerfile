FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ENV PORT=1234
ENV PUBLIC_URL=http://your-vps-ip

EXPOSE 1234

CMD ["npm", "start"]
