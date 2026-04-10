# ЗАДАЧА: Додати OAuth2 авторизацію на фронтенд

## Контекст
React 19 + Vite + Shopify Polaris 13 + TypeScript + Axios.
Поточна структура описана в CLAUDE.md.
Бекенд вже має OAuth2 роути: GET /auth/google, GET /auth/me, POST /auth/logout.
Всі /api/* роути тепер захищені і повертають 401 без авторизації.
Axios запити мають відправляти credentials (cookies).

## Що потрібно зробити

### 1. Оновни src/api.ts
Додай `withCredentials: true` до axios instance:
```typescript
const api = axios.create({
  baseURL: 'http://localhost:4000/api',
  withCredentials: true,
});
```
Додай новий виклик:
```typescript
export const getMe = () =>
  axios.get<{ user: { id: string; email: string } | null }>(
    'http://localhost:4000/auth/me',
    { withCredentials: true }
  ).then(r => r.data.user);

export const logout = () =>
  axios.post('http://localhost:4000/auth/logout', {}, { withCredentials: true });
```

### 2. Створи src/components/LoginPage.tsx
Простий Polaris екран авторизації:
- Polaris `Page` з title="Google Ads Anomaly Detector"
- По центру Polaris `Card` з:
  - `Text` variant="headingLg": "Connect your Google Ads account"
  - `Text` variant="bodyMd" tone="subdued": "Sign in with Google to analyze your campaigns for anomalies."
  - Polaris `Button` variant="primary" url="http://localhost:4000/auth/google": "Connect Google Ads"
    (використовуй url prop щоб зробити звичайний перехід, не SPA навігацію)
- Якщо в URL є `?error=auth_failed` — показати Polaris `Banner` tone="critical": "Authorization failed. Please try again."

### 3. Оновни src/App.tsx
Додай стан авторизації:
```typescript
const [user, setUser] = useState<{ id: string; email: string } | null | undefined>(undefined);
// undefined = ще перевіряємо, null = не авторизований, object = авторизований
```

На mount викликай `getMe()`:
- Якщо повернув user → `setUser(user)` → завантажуй campaigns і anomalies як зараз
- Якщо повернув null → `setUser(null)` → показуй LoginPage

Поки `user === undefined` — показуй Polaris `Spinner` по центру сторінки (перевірка сесії).

Додай кнопку logout в secondaryActions Page:
```typescript
secondaryActions={[
  {
    content: 'Sync Campaigns',
    onAction: handleSync,
    loading: syncing,
    disabled: syncing,
  },
  {
    content: user?.email ?? 'Logout',
    onAction: handleLogout,
  }
]}
```

Додай `handleLogout`:
```typescript
const handleLogout = async () => {
  await logout();
  setUser(null);
  setCampaigns([]);
  setAnomalies([]);
};
```

### 4. Обробка 401 в axios
В src/api.ts додай axios response interceptor:
```typescript
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // редірект на логін — перезавантаж сторінку щоб App.tsx перевірив /auth/me
      window.location.reload();
    }
    return Promise.reject(error);
  }
);
```

## Полный flow після змін:
1. Користувач відкриває http://localhost:5173
2. App.tsx викликає GET /auth/me
3. Якщо 401/null → показує LoginPage
4. Користувач натискає "Connect Google Ads" → переходить на http://localhost:4000/auth/google
5. Google OAuth2 → callback → cookie встановлено → редірект назад на http://localhost:5173
6. App.tsx знову викликає GET /auth/me → тепер є user → завантажує campaigns
7. Run Audit → AI аналіз → показує аномалії

## Правила
- TypeScript strict, no any
- Всі компоненти функціональні з хуками
- Всі API виклики тільки через api.ts
- Polaris компоненти для всього UI — ніяких raw HTML для layout
- Після змін перевір що `npm run dev` запускається без помилок TypeScript
