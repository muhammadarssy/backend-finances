# Postman Collection - Finance & Investment API

Collection Postman untuk testing API Finance & Investment Management.

## File yang Tersedia

1. **postman_collection.json** - Collection utama dengan semua endpoints
2. **postman_environment.json** - Environment variables untuk development

## Cara Import ke Postman

### Import Collection
1. Buka Postman
2. Klik **Import** di kiri atas
3. Pilih file `postman_collection.json`
4. Klik **Import**

### Import Environment
1. Di Postman, klik **Environments** di sidebar kiri
2. Klik **Import**
3. Pilih file `postman_environment.json`
4. Klik **Import**
5. Pilih environment "Finance API - Development" di dropdown environment

## Setup Awal

### 1. Set Base URL
- Environment variable `base_url` sudah di-set ke `http://localhost:3000`
- Jika server berjalan di port lain, update di environment

### 2. Authentication
Collection menggunakan **Bearer Token** authentication.

**Auto Token Setup:**
- Endpoint **Register** dan **Login** otomatis menyimpan token ke variable `auth_token`
- Token akan digunakan untuk semua request yang memerlukan authentication

**Manual Token Setup:**
Jika ingin set token manual:
1. Login atau Register terlebih dahulu
2. Copy token dari response
3. Update environment variable `auth_token`

## Struktur Collection

Collection terorganisir dalam folder:

1. **Authentication** - Register, Login, Get Current User
2. **Users** - Update Profile
3. **Accounts** - CRUD operations untuk accounts
4. **Categories** - CRUD operations untuk categories
5. **Tags** - CRUD operations untuk tags
6. **Transactions** - Create, List, Update, Delete transactions (Income/Expense/Transfer)
7. **Budgets** - Get, Create/Update, Delete budgets
8. **Bills** - CRUD operations untuk bills + Pay bill
9. **Health Check** - Health check endpoint

## Workflow Testing

### 1. Authentication Flow
```
1. Register (atau Login jika sudah ada user)
   → Token otomatis tersimpan
   
2. Get Current User (Me)
   → Verify token bekerja
```

### 2. Setup Data
```
1. Create Account
   → Copy account_id untuk digunakan di request lain

2. Create Category
   → Copy category_id untuk digunakan di request lain

3. Create Tag (optional)
   → Copy tag_id untuk digunakan di request lain
```

### 3. Create Transactions
```
1. Create Income Transaction
   → Menggunakan account_id dan category_id

2. Create Expense Transaction
   → Menggunakan account_id, category_id, dan tag_id (optional)

3. Create Transfer
   → Menggunakan fromAccountId dan toAccountId
```

### 4. Budget Management
```
1. Create/Update Budget
   → Set budget untuk bulan tertentu dengan items per category

2. Get Budget
   → Lihat budget dengan spent calculation
```

### 5. Bill Management
```
1. Create Bill
   → Set bill dengan due date

2. Pay Bill
   → Record payment (optional: link ke transaction)

3. List Bills
   → Filter by status (PAID/UNPAID) atau date range
```

## Tips

1. **Variable Replacement**
   - Collection menggunakan variables seperti `:id`, `account_id_here`, dll
   - Ganti dengan actual IDs setelah create resources
   - Atau gunakan Postman variables untuk auto-replace

2. **Test Scripts**
   - Register dan Login otomatis menyimpan token
   - Bisa tambahkan test scripts untuk auto-save IDs ke variables

3. **Environment Variables**
   - Semua IDs bisa disimpan di environment untuk kemudahan
   - Update `account_id`, `category_id`, dll setelah create

4. **Error Handling**
   - Check response status code
   - Error messages ada di field `message` dan `code`

## Contoh Response Format

### Success Response
```json
{
  "success": true,
  "message": "OK",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "code": "ERROR_CODE"
}
```

## Notes

- Semua endpoints (kecuali Register, Login, Health Check) memerlukan authentication
- Token expires sesuai dengan `JWT_EXPIRES_IN` di environment (default: 7d)
- Jika token expired, login lagi untuk mendapatkan token baru
