# --- Build stage ---
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps

COPY . .

ARG VITE_API_URL=https://ads-api.vkoctak.tech
ENV VITE_API_URL=$VITE_API_URL

# CI=false prevents treating warnings as errors
ENV CI=false
RUN npm run build

# --- Production stage ---
FROM nginx:alpine AS runner

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
