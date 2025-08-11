# Project Structure & Architecture

## Root Directory Structure
```
├── src/                    # Source code
├── prisma/                 # Database schema and migrations
├── test/                   # Test files
├── docs/                   # Documentation
├── dist/                   # Compiled output
├── .kiro/                  # Kiro configuration and steering
├── package.json            # Dependencies and scripts
├── nest-cli.json           # NestJS CLI configuration
├── tsconfig.json           # TypeScript configuration
└── README.md               # Project documentation
```

## Source Code Organization (`src/`)

### Module-Based Architecture
```
src/
├── modules/                # Business domain modules
│   ├── auth/              # Authentication module
│   ├── woocommerce/       # WooCommerce integration
│   └── [other-domains]/   # Additional business domains
├── common/                # Shared components
│   ├── entities/          # Entity interfaces
│   ├── decorators/        # Custom decorators
│   ├── guards/            # Authentication & authorization guards
│   ├── interceptors/      # Response transformation
│   ├── filters/           # Exception handling
│   ├── middlewares/       # Request processing
│   ├── utilities/         # Helper functions
│   ├── types/             # Shared TypeScript types
│   ├── prisma/            # Database service
│   ├── better-auth/       # Authentication configuration
│   └── minio/             # File storage service
├── scripts/               # Utility scripts
├── app.module.ts          # Root application module
└── main.ts                # Application bootstrap
```

## Module Structure Pattern

Each business domain follows this structure:
```
modules/{domain}/
├── models/                # DTOs and interfaces
│   ├── {entity}.request.ts   # Input DTOs
│   └── {entity}.response.ts  # Output DTOs
├── {domain}.service.ts    # Business logic
├── {domain}.controller.ts # HTTP endpoints
└── {domain}.module.ts     # Module configuration
```

## Entity-First DTO Architecture

### Entity Definitions (`common/entities/`)
- Custom entity interfaces (not direct Prisma types)
- Shared across modules for consistency
- Abstract database implementation details

### DTO Pattern
- **Input DTOs**: Implement entity interfaces with class-validator decorators
- **Output DTOs**: Use TypeScript utility types (`Pick`, `Omit`, `Partial`) from entities
- **Module-specific**: Located in `modules/{domain}/models/`

## Path Aliases (tsconfig.json)
```typescript
"paths": {
  "@/*": ["./src/*"],
  "@common/*": ["./src/common/*"],
  "@guards/*": ["./src/common/guards/*"],
  "@filters/*": ["./src/common/filters/*"],
  "@decorators/*": ["./src/common/decorators/*"],
  "@auth/*": ["./src/common/better-auth/*"],
  "@modules/*": ["./src/modules/*"],
  "@prisma/*": ["./src/prisma/*"],
  "@utils/*": ["./src/utils/*"],
  "@types/*": ["./src/types/*"]
}
```

## Key Architectural Patterns

### 1. Domain-Driven Design
- One module per business domain
- Clear separation of concerns
- Business logic in services, not controllers

### 2. Multi-Tenant Architecture
- Organization-scoped data access
- Role-based permissions (`OWNER`, `EMPLOYEE`)
- Session includes active organization context

### 3. Queue-Based Processing
- Background jobs for data synchronization
- Webhook processing via BullMQ
- Redis-backed job queues

### 4. API-First Design
- Swagger/OpenAPI documentation
- RESTful endpoints
- Consistent response formats

## File Naming Conventions
- `.entity.ts` - Entity interfaces in `common/entities/`
- `.request.ts` - Input DTOs with validation
- `.response.ts` - Output DTOs using utility types
- `.service.ts` - Business logic layer
- `.controller.ts` - HTTP endpoint handlers
- `.module.ts` - NestJS module configuration
- `.guard.ts` - Authentication/authorization guards
- `.decorator.ts` - Custom decorators
- `.util.ts` - Utility functions

## Database Structure
- PostgreSQL with Prisma ORM
- UUID primary keys across all entities
- Proper foreign key relationships
- Multi-tenant data isolation by organization
- Better Auth integration for user management

## Integration Points
- **WooCommerce**: REST API integration with webhook management
- **OneSignal**: Push notification service
- **Better Auth**: Authentication with organization plugin
- **AWS**: Cloud services integration
- **OpenAI/Langfuse**: AI/LLM capabilities with observability