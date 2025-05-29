# express-multer-fileserver

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

````

Kamu bisa menggunakan URL tersebut untuk dikirim ke WhatsApp Gateway seperti ini:

```json
{
  "number": "6281234567890",
  "filePath": "http://<IP-VPS>/uploads/invoice.pdf",
  "caption": "Berikut file invoice Anda"
}
```

---

> Jika kamu ingin file Insomnia Collection (`.json`) siap pakai, tinggal minta saja dan saya bantu buatkan 👍

```

Silakan salin bagian ini langsung ke `README.md` kamu. Jika kamu ingin, saya juga bisa bantu menambahkan bagian sebelumnya atau menyusun `README.md` lengkap dari awal hingga akhir.
```
````
