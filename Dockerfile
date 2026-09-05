# ── Stage 1: build the frontend ───────────────────────────────────────────────
FROM node:20-alpine AS frontend
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ── Stage 2: build the Go binary ──────────────────────────────────────────────
FROM golang:1.25-alpine AS backend
WORKDIR /src
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend/ ./
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/pocket ./cmd/server

# ── Stage 3: runtime ──────────────────────────────────────────────────────────
FROM alpine:3.20
RUN apk add --no-cache ca-certificates && adduser -D -u 10001 pocket
WORKDIR /app
COPY --from=backend /out/pocket /app/pocket
COPY --from=frontend /app/dist /app/web
USER pocket
ENV PORT=8000 STATIC_DIR=/app/web GIN_MODE=release
EXPOSE 8000
CMD ["/app/pocket"]
