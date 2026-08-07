# Frontend Handoff Documentation

This folder contains the concise, implementation-ready documentation needed for the frontend team to integrate with the E2E backend. It is derived from the authoritative architecture documents and the current backend implementation.

## Document Map

0. **[00_product_definition.md](00_product_definition.md)**: The core product vision, scope, features, and system glossary. This provides crucial context on *why* the application behaves the way it does.
1. **[01_api_overview_and_auth.md](01_api_overview_and_auth.md)**: Details on Base URLs, versioning, the Clerk JWT authentication flow, global response formats (success/error), and idempotency rules.
2. **[02_endpoints_reference.md](02_endpoints_reference.md)**: A concise breakdown of all available endpoints by domain, expected parameters, and the search/filtering strategy.
3. **[03_roles_and_business_rules.md](03_roles_and_business_rules.md)**: Frontend-relevant domain rules, user role capabilities, ban states, content limits (e.g., 30-day TTL, Study Plan limits), and upload constraints.
4. **[04_environment_and_integration.md](04_environment_and_integration.md)**: Required frontend environment variables, CORS origins, and key integration caveats (like cold start delays).
5. **[05_test_accounts.md](05_test_accounts.md)**: Pre-configured test accounts (Admin, Creator, Student) and passwords for local/staging testing.

> **Note**: For exhaustive payload schemas and interactive API exploration, refer to the OpenAPI schema at `/api/schema/` or the Swagger UI at `/api/docs/` when the backend is running.
