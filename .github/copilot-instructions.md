# Copilot Instructions (ReadBookHub)

## Mission
Build a secure, scalable "Netflix-for-books" app (Spring Boot 3 + React/Next.js).

## Tech stack
Backend: Java 17, Spring Boot 3, Spring Security (JWT), JPA/Hibernate, BCrypt, PostgreSQL/MySQL  
Frontend: Next.js + TS, TanStack Query, React Hook Form + Zod, Tailwind, shadcn/ui

## Architecture & Code Style
- Strict layers: Controller → Service → Repository; DTOs only in controllers.
- Services via interfaces; use explicit `@Autowired`; no `@RequiredArgsConstructor`.
- MapStruct/manual mappers; centralized exceptions via `@ControllerAdvice`.
- Method security: `@PreAuthorize` + fine-grained permissions enum.

## Security
- JWT stateless auth; BCrypt for passwords; CORS configured per env.
- Never generate downloadable book assets; server enforces no-download responses.

## Frontend rules
- All server calls through React Query hooks (+ error/loading states).
- Forms: RHF + Zod; token via Axios interceptors; route guards by permissions.

## API Design
- REST `/api/v1/...`, request/response DTOs with validation.
- Standardized error model {timestamp,status,message,path}.


