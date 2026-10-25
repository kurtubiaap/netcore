# Build stage
FROM golang:alpine AS builder

WORKDIR /app

RUN apk add --no-cache gcc musl-dev

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=1 GOOS=linux go build -o /app/netcore ./cmd/api

# Final stage
FROM alpine:3.21

WORKDIR /app

RUN apk add --no-cache ca-certificates tzdata

COPY --from=builder /app/netcore /app/netcore

EXPOSE 8080

CMD ["/app/netcore"]
