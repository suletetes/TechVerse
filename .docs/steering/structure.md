# Project Structure & Organization

## Root Level Organization
```
techverse-ecommerce/
├── client/          # React frontend application
├── server/          # Node.js backend application  
├── docs/            # Project documentation
├── scripts/         # Deployment and utility scripts
└── *.js files       # Root-level test and utility files
```

## Backend Structure (`server/`)
```
server/
├── src/
│   ├── config/      # Database, passport, session configuration
│   ├── controllers/ # Route handlers and business logic
│   ├── middleware/  # Express middleware (auth, security, logging)
│   ├── models/      # Mongoose schemas and models
│   ├── routes/      # API route definitions
│   ├── services/    # Business logic and external service integrations
│   └── utils/       # Helper functions and utilities
├── tests/           # Test files (unit, integration, e2e)
├── uploads/         # File upload storage
├── scripts/         # Database seeding and utility scripts
└── server.js        # Main application entry point
```

## Frontend Structure (`client/`)
```
client/
├── src/
│   ├── components/  # Reusable React components
│   │   ├── Auth/    # Authentication components
│   │   ├── Common/  # Shared UI components
│   │   └── __tests__/ # Component tests
│   ├── context/     # React context providers
│   ├── hooks/       # Custom React hooks
│   ├── pages/       # Page components and routing
│   │   ├── admin/   # Admin-specific pages
│   │   ├── auth/    # Authentication pages
│   │   └── info/    # Information pages
│   ├── services/    # API service functions
│   ├── utils/       # Helper functions and utilities
│   └── App.jsx      # Main application component
├── public/          # Static assets
├── dist/            # Build output
└── templates/       # HTML templates
```

## Key Conventions

### File Naming
- **Components**: PascalCase (e.g., `UserProfile.jsx`, `ProductCard.jsx`)
- **Pages**: PascalCase (e.g., `Home.jsx`, `ProductDetails.jsx`)
- **Utilities**: camelCase (e.g., `apiClient.js`, `formatPrice.js`)
- **Config files**: kebab-case (e.g., `vite.config.js`, `jest.config.js`)
- **Test files**: `*.test.js` or `*.spec.js` or in `__tests__/` directories

### Import/Export Patterns
- Use ES modules (`import`/`export`) throughout
- Barrel exports in `pages/index.js` for clean imports
- Named exports preferred over default exports for utilities
- Absolute imports configured for cleaner import paths

### Component Organization
- **Feature-based grouping**: Components grouped by domain (Auth, Admin, etc.)
- **Colocation**: Tests next to components in `__tests__/` folders
- **Separation of concerns**: Presentational vs container components
- **Reusable components**: In `components/Common/` for shared UI elements

### API Structure
- **RESTful routes**: Following REST conventions (`/api/products`, `/api/users`)
- **Versioned APIs**: Base path `/api` with potential for versioning
- **Consistent responses**: Standardized JSON response format
- **Error handling**: Centralized error middleware with structured error responses

### Environment Management
- **Multiple environments**: Development, staging, production configurations
- **Environment files**: Separate `.env` files per environment
- **Validation**: Environment variable validation on startup
- **Security**: Sensitive data in environment variables, not committed to repo

### Testing Strategy
- **Unit tests**: Individual component and function testing
- **Integration tests**: API endpoint and database integration testing
- **E2E tests**: Full user workflow testing
- **Test organization**: Tests colocated with source code
- **Mocking**: MSW for API mocking in frontend tests

### Documentation Structure
- **API docs**: Comprehensive API documentation in `docs/`
- **README files**: Project overview and setup instructions
- **Inline docs**: JSDoc comments for complex functions
- **Architecture docs**: High-level system design documentation