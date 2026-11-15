# express-multer-fileserver

> Dokumentasi integrasi (endpoint, contoh fetch/axios, batasan, jebakan): [`docs/README.md`](docs/README.md)

## how to install in your VPS

### create fileserver in root

```bash
mkdir var/www/file
```

### change in dockerfile file ip your vps

### docker setup

```bash
docker-compose up --build -d
```

```bash
docker-compose up -d
```

## author

```bash
alfitosantosa
```

### how to use

---

### 🔸 1. Buka Insomnia

Jika belum terpasang, kamu bisa mengunduh dan menginstalnya dari:

🔗 [https://insomnia.rest/download](https://insomnia.rest/download)

---

### 🔸 2. Buat Request Baru

- Klik **New Request**
- Isi:
  - **Name:** `Upload File`
  - **Method:** `POST`
  - **URL:** `http://<IP-VPS>/upload`  
    _(Contoh: `http://192.168.1.100/upload` atau `http://yourdomain.com/upload`)_

---

### 🔸 3. Pilih Tab `Body` → `Multipart Form`

- Pilih tab **Body**
- Ganti tipe menjadi **Multipart Form**
- Klik **Add Form Field** lalu isi:
  - **Key:** `file`
  - **Type:** `File`
  - **Value:** Pilih file dari komputer kamu (misalnya `invoice.pdf`)

Contoh form-data di Insomnia:

| KEY  | TYPE | VALUE            |
| ---- | ---- | ---------------- |
| file | File | invoice.pdf (📎) |

---

### 🔸 4. Kirim Request

Klik tombol **Send** untuk mengirim file ke server.

---

### ✅ Contoh Respons Berhasil

```json
{
  "url": "http://<IP-VPS>/uploads/invoice.pdf"
}
```

