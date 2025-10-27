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

---

## 📚 Documentation Synchronization & Update Discipline

Each module, component, or feature must maintain **a single authoritative documentation file** that is always kept current and synchronized with its implementation.  
No redundant or outdated technical documentation should exist elsewhere in the repository or project space.

### 🧩 Core Principles
- **Single Source of Truth:**  
  Each module has exactly one documentation file (e.g., `/src/module-name/DOC.md` or `/docs/module-name.md`).  
  This file must describe its purpose, interfaces, dependencies, and configurations.  
  Remove or merge any duplicates elsewhere.

- **Synchronization with Code Changes:**  
  Whenever code changes, documentation must be reviewed and updated **in the same commit or pull request**.  
  Update API signatures, configuration details, and usage examples to reflect actual implementation.  
  Outdated or mismatched documentation is considered a defect.

- **Integration Discipline:**  
  Code and documentation must evolve together.  
  If documentation is missing or stale, treat the feature or fix as incomplete.  
  Documentation updates are part of the peer-review process.

- **Version Control & Traceability:**  
  Each documentation file should include metadata:  
  - Last updated date  
  - Related commit or PR reference  
  - Version or release tag (if applicable)

- **Duplication Policy:**  
  Never replicate technical details in multiple places.  
  Centralize and reference — don’t re-describe.  
  High-level READMEs or architecture docs may reference module docs but not repeat internal details.

- **Document Structure:**  
  Maintain a clear and consistent format:
  1. Header — Module name, version, author  
  2. Overview — Purpose and key responsibilities  
  3. Public Interfaces — APIs, parameters, outputs  
  4. Integrations — Related modules, dependencies  
  5. Testing & Validation — How to verify functionality  
  6. Changelog — Linked commits or PR references  

### ✅ Verification Checklist
- Documentation exists for every module or feature  
- It reflects the latest code implementation  
- No duplicate or conflicting information  
- Updated alongside every code change  
- Properly versioned and traceable  

### ⚙️ Agent Enforcement
When modifying or generating code:
- Always check for an existing documentation file and update it accordingly  
- If missing, create one under the module’s directory  
- Do not generate multiple or redundant docs  
- Refuse to skip documentation updates on change requests  

---

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
