# ЗАДАЧА: Додати Google OAuth2 авторизацію + захист роутів

## Контекст
Це backend Node.js + Express 5 + Prisma + TypeScript проєкт.
Поточна структура описана в CLAUDE.md. Зараз немає авторизації — всі роути відкриті.

## Що потрібно зробити

### 1. Встанови залежності
```bash
npm install googleapis cookie-parser
npm install --save-dev @types/cookie-parser
```

### 2. Додай модель User в prisma/schema.prisma
```prisma
model User {
  id           String   @id @default(cuid())
  googleId     String   @unique
  email        String   @unique
  accessToken  String
  refreshToken String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```
Після додавання виконай: `npx prisma migrate dev --name add-user`

### 3. Створи src/services/googleAuth.ts
Використовуй `googleapis` пакет (OAuth2Client).
Налаштуй OAuth2Client з env змінних: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI.
Scope: `https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile`

Експортуй:
- `getAuthUrl(): string` — генерує URL для редіректу на Google login
- `getTokensFromCode(code: string): Promise<{accessToken, refreshToken, googleId, email}>` — міняє code на токени, витягує googleId та email з userinfo endpoint
- `refreshAccessToken(refreshToken: string): Promise<string>` — оновлює access_token через refresh_token, повертає новий accessToken

### 4. Створи src/routes/auth.ts з 4 роутами

**GET /auth/google**
- Викликає `getAuthUrl()`
- Робить `res.redirect(url)`

**GET /auth/google/callback**
- Отримує `code` з `req.query.code`
- Викликає `getTokensFromCode(code)`
- Upsert User в БД по googleId: зберігає accessToken і refreshToken
- Встановлює httpOnly cookie `userId` = user.id, maxAge 30 днів, sameSite: 'lax'
- Редірект на `http://localhost:5173`
- При помилці — редірект на `http://localhost:5173?error=auth_failed`

**GET /auth/me**
- Читає cookie `userId`
- Якщо немає або user не знайдений в БД — повертає `{ user: null }`
- Повертає `{ user: { id, email } }` БЕЗ токенів

**POST /auth/logout**
- Очищає cookie `userId` (res.clearCookie)
- Повертає `{ ok: true }`

### 5. Створи src/middleware/requireAuth.ts
```typescript
// Розшир Express Request тип:
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}
```
Логіка middleware:
- Читає `req.cookies.userId`
- Якщо немає → `res.status(401).json({ error: 'Unauthorized' })`
- Знаходить User в БД
- Якщо не знайдено → `res.status(401).json({ error: 'Unauthorized' })`
- Якщо знайдено → `req.userId = user.id` → `next()`
- НЕ перевіряй expiry accessToken тут — це зайва складність для мок даних

### 6. Оновни src/server.ts
- Додай `import cookieParser from 'cookie-parser'`
- Додай `app.use(cookieParser())` ПЕРЕД роутами
- Додай `app.use('/auth', authRoutes)`
- CORS: `app.use(cors({ origin: 'http://localhost:5173', credentials: true }))`
- Захисти роути:
  ```typescript
  app.use('/api/campaigns', requireAuth, campaignRoutes)
  app.use('/api/audit', requireAuth, auditRoutes)
  ```

### 7. Перевір .env — має бути:
```
GOOGLE_REDIRECT_URI=http://localhost:4000/auth/google/callback
```

## Правила
- TypeScript strict, no any
- Всі async/await з try/catch
- Помилки повертати як `{ error: string }`
- Не логувати токени в консоль
- Після змін запусти `npm run dev` і перевір що сервер стартує без помилок
