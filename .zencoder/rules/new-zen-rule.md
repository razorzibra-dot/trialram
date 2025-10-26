---
description: Coding Agent Operational Rules - Production-grade standards for implementation, architecture, testing, and deliverables
globs: []
alwaysApply: true
---

# Coding Agent Operational Rules

## Primary Focus

Only produce technical, code-level, or architecture-level content. Exclude all references to time estimates, budget, resources, deadlines, or project management. Focus on **how to implement** — not when or how long it takes.

## 1. Scope & Focus

Focus exclusively on technical, architectural, and implementation aspects.

**Do not include or discuss:**
- Budget, pricing, or cost estimation
- Time, duration, or resource estimates
- Team size, roles, or project management details

**Maintain a developer-to-developer perspective, emphasizing:**
- Code quality
- System consistency
- Maintainability
- Integration safety

## ⚙️ Scope of Work

- Generate, review, and refine production-ready code and technical documentation only
- Maintain alignment with existing application structure, modules, and dependencies
- All suggestions must respect code boundaries — **no breaking of other pages, modules, or features**
- Ensure integration with existing frameworks, libraries, and conventions

## 2. Code Implementation Principles

Follow production-grade standards:
- Code must be deployable, secure, and stable
- No placeholder, mock, or pseudo code unless explicitly requested
- All code should be linted, formatted, and build-clean
- No duplicate logic: Always refactor or reuse shared utilities
- No hardcoded or temporary logic left behind

**Backward compatibility & integration safety:**
- Must not break or regress any existing module, page, or API
- Ensure **no regression or side effects** on existing functionality
- All integrations must maintain existing contracts, routes, and events
- Integration readiness: Ensure new code integrates seamlessly into the existing system (imports, modules, or services)

## 🧱 Architecture & Design Standards

- Follow consistent architectural patterns (e.g., MVC, MVVM, Clean Architecture, etc.) aligned with the project's base
- Keep clear separation of concerns — no cross-layer coupling
- Use Dependency Injection and Interface-based design where appropriate
- Maintain consistent naming conventions, directory structure, and coding style across modules
- Prefer composition over inheritance and modularity over monolith design
- Ensure modularity and reusability — never duplicate logic unnecessarily
- Use clear interfaces, type safety, and error handling where applicable
- All changes should be scalable, testable, and configurable

## 🧼 Code Quality & Testing

100% of new or modified code must meet these criteria:

✅ Code must be clean, readable, and maintainable
✅ Follow linting rules and pass all build checks
✅ No duplicate code or redundant logic
✅ 100% unit/integration tested
✅ Ensure backward compatibility — no regression or side effects
✅ Include clear inline comments and API documentation
✅ Always verify integration with other components
✅ Covered by unit tests, integration tests, or e2e tests as relevant
✅ Linted and type-checked (if using TypeScript or similar)
✅ Build-verified — no broken imports, circular dependencies, or compilation warnings
✅ All existing tests must continue to pass after new changes

## 📖 Documentation Standards

Provide concise and structured technical documentation:

- **Architecture overview** — What is this component/module and how does it fit?
- **Module responsibilities** — What does each part do?
- **Purpose and context of changes** — Why were these changes made?
- **Data flow and dependencies** — How does data move through the system?
- **API signatures and parameter contracts** — What are the inputs/outputs?
- **Configuration and setup instructions** — How to use/deploy?
- **Example usages, edge cases, and testing guidance** — Real-world usage patterns

**Not needed:**
- Business summaries, stakeholder info, or scheduling notes
- Documentation must be free of time/cost details
- Documentation should be clean, concise, and code-oriented

## 6. Best Practice Enforcement

- Adhere to the SOLID and DRY principles
- Respect immutability and pure function patterns where possible
- Prefer asynchronous-safe and thread-safe operations
- Ensure security best practices: input validation, safe dependencies, sanitized data
- Keep performance in check — identify potential bottlenecks early

## 🔍 Review Checklist Before Delivery

All deliverables must pass this checklist:

- ✅ Code builds without errors
- ✅ All linting rules pass
- ✅ Unit and integration tests succeed
- ✅ No functionality or feature regression
- ✅ No hardcoded or temporary logic left behind
- ✅ Documentation updated and clear
- ✅ Integration tested with adjacent modules

## 🧠 Behavioral Guardrails for the Agent

- Always justify architectural or implementation choices from a technical standpoint
- Never suggest shortcuts that would compromise quality or maintainability
- Avoid speculative business or planning commentary — stay strictly technical
- Treat every output as production-ready and peer-review compliant

## 7. Deliverable Criteria (Definition of Done ✅)

All work must meet these criteria:

- ✅ Production-ready and stable
- ✅ Build and lint errors fixed
- ✅ Fully tested (unit/integration)
- ✅ Comprehensive technical documentation
- ✅ No duplicate or dead code
- ✅ Properly integrated into existing structure
- ✅ Backward compatible with existing features

## References

- **Service Factory Pattern**: @.zencoder/rules/repo.md (Multi-backend routing)
- **React & TypeScript Standards**: Use ESLint configuration and Vite build system
- **Ant Design & Tailwind CSS**: Follow existing UI component patterns
- **Supabase Integration**: Respect Row-Level Security and multi-tenant architecture