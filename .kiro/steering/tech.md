# Technology Stack

## Core Framework
- **NestJS**: Progressive Node.js framework with TypeScript
- **TypeScript**: Strict typing with ES2021 target
- **Node.js**: Runtime environment

## Database & ORM
- **PostgreSQL**: Primary database
- **Prisma**: ORM with code-first migrations
- **Redis**: Queue storage and caching (via ioredis)

## Authentication & Authorization
- **Better Auth**: Modern authentication library with organization plugin
- **JWT**: Token-based authentication via Passport
- **bcrypt**: Password hashing

## Key Libraries & Integrations
- **WooCommerce REST API**: E-commerce platform integration
- **OneSignal**: Push notification service
- **BullMQ**: Queue management for background jobs
- **AWS SDK**: Cloud services integration
- **OpenAI**: AI/LLM integration
- **Langfuse**: LLM observability and analytics
- **Persian Tools**: Localization for Persian/Iranian market
- **Jalaali-js**: Persian calendar support

## Development Tools
- **pnpm**: Package manager (preferred over npm/yarn)
- **ESLint**: Code linting with TypeScript support
- **Prettier**: Code formatting
- **Jest**: Testing framework
- **Swagger/OpenAPI**: API documentation

## Common Commands

### Development
```bash
# Install dependencies
pnpm install

# Start development server with hot reload
pnpm run start:dev

# Start with debugging
pnpm run start:debug

# Build for production
pnpm run build

# Start production server
pnpm run start:prod
```

### Database
```bash
# Run database migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# Reset database (development only)
npx prisma migrate reset
```

### Testing
```bash
# Run unit tests
pnpm run test

# Run tests in watch mode
pnpm run test:watch

# Run e2e tests
pnpm run test:e2e

# Generate test coverage
pnpm run test:cov
```

### Code Quality
```bash
# Lint and fix code
pnpm run lint

# Format code
pnpm run format
```

## Environment Configuration
- Use `.env` file for environment variables
- Required variables include `DATABASE_URL`, `APP_URL`
- WooCommerce credentials stored per organization
- OneSignal configuration for notifications