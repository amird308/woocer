# Repository Map - Implementation Status ✅

## Core Architecture ✅
- **Framework**: NestJS with TypeScript ✅
- **Package Manager**: pnpm ✅
- **Database**: PostgreSQL with Prisma ORM ✅
- **Authentication**: Better Auth with organization plugin ✅
- **API Documentation**: Swagger/OpenAPI decorators ✅
- **Configuration**: MCP server integration via `mcp.json` ✅

## Database Models (schema.prisma) ✅

### User Management ✅
- `User` - Core user entity with auth fields ✅
- `Session` - User sessions with organization context ✅
- `Account` - SSO account linking ✅
- `Verification` - Email/identity verification ✅

### Organization Management ✅
- `Organization` - Multi-tenant organizations with company details ✅
- `Member` - User-organization relationships with roles ✅
- `Invitation` - Pending organization invitations ✅
- `Team` - Sub-organization teams ✅

## Module Structure ✅

### Common Entities (common/entities/) ✅
```
common/
└── entities/
    ├── user.entity.ts          # User entity interface ✅
    ├── session.entity.ts       # Session entity interface ✅
    ├── account.entity.ts       # Account entity interface ✅
    ├── verification.entity.ts  # Verification entity interface ✅
    ├── organization.entity.ts  # Organization entity interface ✅
    ├── member.entity.ts        # Member entity interface ✅
    ├── invitation.entity.ts    # Invitation entity interface ✅
    ├── team.entity.ts          # Team entity interface ✅
    └── index.ts               # Barrel exports ✅
```

### Auth Module ✅
```
modules/auth/
├── auth-client.ts              # Better Auth client configuration ✅
├── auth.service.ts            # Auth business logic ✅
├── auth.controller.ts         # Better Auth integration ✅
└── auth.module.ts             # Module configuration ✅

common/
├── decorators/
│   ├── current-user.decorator.ts      # User extraction decorator ✅
│   └── require-permissions.decorator.ts # Permission decorator ✅
└── guards/
    ├── auth.guard.ts          # Authentication guard ✅
    └── permission.guard.ts    # Permission-based access control ✅
```

### Organization Module ✅ (Example Implementation)
```
modules/organization/
├── organization.service.ts     # Business logic ✅
├── organization.controller.ts  # HTTP endpoints ✅
└── organization.module.ts     # Module configuration ✅
```

## Common/Shared Components ✅

### Types & DTOs ✅
- Pagination responses and utilities ✅
- Common response interfaces (`ApiResponseDto`) ✅
- Entity interfaces in `common/entities/` ✅
- Input DTOs using entity interfaces with validation ✅
- Output DTOs using TypeScript `Pick`, `Omit`, and utility types from entities ✅

### Module-Specific DTOs ✅
```
modules/auth/models/
├── user.request.ts            # User input DTOs ✅
└── user.response.ts           # User output DTOs ✅

modules/organization/models/
├── organization.request.ts    # Organization input DTOs ✅
└── organization.response.ts   # Organization output DTOs ✅
```

### Decorators ✅
- `@CurrentUser` - Extract authenticated user from request ✅
- `@RequirePermissions` - Role-based access control ✅

### Guards ✅
- `AuthGuard` - Authentication verification ✅
- `PermissionGuard` - Organization/role permission checks ✅

### Utilities ✅
```
common/utilities/
├── slug.util.ts              # URL slug generation ✅
├── validation.util.ts        # Validation helpers ✅
└── index.ts                 # Barrel exports ✅
```

### Interceptors ✅
```
common/interceptors/
└── transform.interceptor.ts   # Response transformation ✅
```

### Validation ✅
- Class-validator for input DTOs ✅
- Swagger decorators for API documentation ✅

## Key Patterns & Architecture ✅

### 1. Module per Domain ✅
Each business domain has its own module with:
- Controller for HTTP endpoints ✅
- Service for business logic ✅
- Separate `.request.ts` and `.response.ts` files ✅

### 2. Entity-First DTO Pattern ✅
- Custom entity interfaces defined in `common/entities/` (not using Prisma types directly) ✅
- Input DTOs implement entity interfaces with class-validator decorators ✅
- Output DTOs use TypeScript utility types (`Pick`, `Omit`, `Partial`) from entity interfaces ✅
- DTOs are module-specific in `modules/{domain}/models/` directories ✅
- Full Swagger documentation with `@ApiProperty` ✅

### 3. Service Layer Architecture ✅
- Business logic separated from controllers ✅
- One service per entity ✅
- Prisma ORM for data persistence ✅
- Queue integration for background processing (BullMQ) ✅

### 4. Permission-Based Access Control ✅
- Organization-scoped permissions ✅
- Role-based access with `@RequirePermissions` ✅
- Session includes active organization context ✅

## Configuration Files ✅

### Core Configuration ✅
- `nest-cli.json` - NestJS CLI configuration ✅
- `schema.prisma` - Database schema and models ✅
- `mcp.json` - Model Context Protocol server configuration ✅

### Authentication ✅
- `auth-client.ts` - Better Auth client with organization plugin ✅
- Environment variables for API URLs and database connections ✅

## Implemented Structure ✅

```
src/
├── modules/
│   ├── auth/                 # Authentication module ✅
│   │   ├── models/           # Auth-specific DTOs ✅
│   │   │   ├── user.request.ts  # User input DTOs ✅
│   │   │   └── user.response.ts # User output DTOs ✅
│   │   ├── auth-client.ts    # Better Auth client ✅
│   │   ├── auth.service.ts   # Auth business logic ✅
│   │   ├── auth.controller.ts # Auth endpoints ✅
│   │   └── auth.module.ts    # Module config ✅
│   └── organization/         # Organization module ✅
│       ├── models/           # Organization-specific DTOs ✅
│       │   ├── organization.request.ts  # Organization input DTOs ✅
│       │   └── organization.response.ts # Organization output DTOs ✅
│       ├── organization.service.ts    # Business logic ✅
│       ├── organization.controller.ts # HTTP endpoints ✅
│       └── organization.module.ts     # Module config ✅
├── common/
│   ├── entities/            # Entity interfaces ✅
│   │   ├── user.entity.ts   ✅
│   │   ├── organization.entity.ts ✅
│   │   └── [other entities] ✅
│   ├── decorators/          # Custom decorators ✅
│   ├── guards/              # Auth & permission guards ✅
│   ├── interceptors/        # Response transformation ✅
│   ├── utilities/           # Common utilities ✅
│   ├── filters/             # Exception handling ✅
│   ├── middlewares/         # Request processing ✅
│   ├── types/               # Shared types ✅
│   ├── prisma/              # Database service ✅
│   └── better-auth/         # Auth configuration ✅
├── app.module.ts            # Main app module ✅
└── main.ts                  # Application bootstrap ✅
```

## Integration Points ✅

### Package Management ✅
- **pnpm** for dependency management and workspace support ✅
- Faster installs and better disk space efficiency ✅

### Database ✅
- PostgreSQL with Prisma migrations ✅
- UUID primary keys across all entities ✅
- Proper foreign key relationships and cascading ✅
- Entity interfaces abstract Prisma types for better maintainability ✅

### Authentication Flow ✅
- Better Auth handles session management ✅
- Organization context in sessions ✅
- Permission-based route protection ✅

### Queue System ✅
- BullMQ for background processing ✅
- Redis-based queue implementation ✅

## Development Guidelines ✅

### Code Standards ✅
- One module per main domain/route ✅
- Separate controllers for secondary routes ✅
- Entity interfaces in `common/entities/` (not direct Prisma types) ✅
- Input DTOs implement entity interfaces with class-validator ✅
- Output DTOs use TypeScript utility types from entities ✅
- Full Swagger documentation ✅

### File Naming Conventions ✅
- `.entity.ts` for entity interfaces in `common/entities/` ✅
- `.request.ts` for input DTOs (using entity interfaces) ✅
- `.response.ts` for output DTOs (using Pick/Omit from entities) ✅
- `.service.ts` for business logic ✅
- `.controller.ts` for HTTP endpoints ✅

### Entity-First Architecture ✅
- Define entity interfaces first in `common/entities/` ✅
- Use these entities for both input validation and output typing ✅
- Leverage TypeScript utility types (`Pick<Entity, 'field1' | 'field2'>`, `Omit<Entity, 'sensitiveField'>`) ✅
- Prisma models map to entity interfaces but don't expose Prisma types directly ✅
- Better separation of concerns and easier testing ✅

## Implementation Status Summary

✅ **COMPLETED**:
- All entity interfaces created
- Entity-first DTO pattern implemented
- Auth module with Better Auth integration
- Organization module as example implementation
- Common utilities and interceptors
- Proper module structure
- Guards and decorators
- Service layer architecture
- Swagger documentation setup

🎯 **READY FOR DEVELOPMENT**:
- Additional business domain modules can be created following the organization module pattern
- All foundational architecture is in place
- Development can proceed with confidence following established patterns