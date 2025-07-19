# Build Stage
FROM node:18-alpine AS builder

WORKDIR /app
COPY . .
RUN npm install -g pnpm
RUN pnpm install 
RUN npx prisma generate
RUN pnpm run build


FROM node:18-alpine

WORKDIR /app
RUN npm install -g pnpm
COPY --from=builder /app ./
EXPOSE 3000

EXPOSE 3000
RUN npx prisma generate

CMD ["npm", "run", "start:migrate:prod" ]