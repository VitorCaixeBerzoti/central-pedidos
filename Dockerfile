FROM node:24-bookworm-slim

WORKDIR /app

COPY backend/package*.json backend/
COPY frontend/package*.json frontend/
RUN npm ci --prefix backend && npm ci --prefix frontend

COPY backend/ backend/
COPY frontend/ frontend/
RUN DATABASE_URL=postgresql://postgres:unused@localhost:5432/central_pedidos npm --prefix backend run db:generate \
    && npm --prefix frontend run build

EXPOSE 3000
CMD ["sh", "-c", "npm --prefix backend run db:migrate && npm --prefix backend run db:seed && npm --prefix backend start"]
