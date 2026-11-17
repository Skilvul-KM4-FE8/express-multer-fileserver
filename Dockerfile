# Gunakan image Node.js LTS
FROM node:20-alpine

# Buat direktori aplikasi
WORKDIR /usr/src/app

# Copy package.json dan package-lock.json
COPY package*.json ./

# Schema Prisma wajib ada sebelum install (postinstall generate client)
COPY prisma ./prisma

# Install dependencies
RUN npm install

# Copy semua file aplikasi
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Buat folder storage jika belum ada
RUN mkdir -p /usr/src/app/storage/uploads

# Port yang digunakan aplikasi
EXPOSE 6969

# Command untuk menjalankan aplikasi
CMD ["npm", "start"]
