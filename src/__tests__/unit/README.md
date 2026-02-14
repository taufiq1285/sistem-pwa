# Unit Tests Structure

This directory contains all unit tests organized by logic type and testing priority.

## 📁 Directory Structure

```
src/__tests__/unit/
├── core-logic/              # 🔴 HIGH Priority - Business Logic (White-Box Testing)
│   ├── api/                 # API layer tests (data fetching, transformations)
│   ├── hooks/               # Custom React hooks with business logic
│   ├── utils/               # Utility functions with algorithms
│   ├── validations/          # Schema validation tests
│   ├── offline/             # Offline-first sync logic
│   ├── lib/
│   │   ├── offline/        # Offline managers (queue, sync, etc)
│   │   └── pwa/           # PWA utilities (service worker, caching)
│   └── middleware/         # Business middleware (permissions, etc)
│
└── presentation/            # 🟢 LOW Priority - Infrastructure & UI
    ├── components/          # UI component tests (presentation only)
    ├── providers/           # Context providers (infrastructure)
    ├── services/            # External service integrations
    └── supabase/          # Supabase client wrappers
```

## 🎯 Testing Priorities

### 🔴 HIGH Priority (Core Logic - White-Box Testing Required)

**Location:** `src/__tests__/unit/core-logic/`

These tests require **100% white-box coverage** including:
- ✅ Statement Coverage
- ✅ Branch Coverage
- ✅ Condition Coverage
- ✅ Path Coverage
- ✅ Data Flow Coverage
- ✅ Loop Coverage

**Files in this category:**
- **API Layer** (32 files): Authentication, data management, business rules
- **Custom Hooks** (12 files): State management, side effects, sync logic
- **Utilities** (20+ files): Algorithms, transformations, calculations
- **Validations** (6 files): Input validation, business constraints
- **Offline** (7 files): Conflict resolution, sync strategy
- **Lib** (7 files): Core library functions
- **Middleware** (1 file): Authorization & access control

**Total:** ~85 test files covering critical business logic

---

### 🟡 MEDIUM Priority (Gray Area)

**Services** (3 files):
- External service integrations
- Third-party library wrappers
- Database operations (infrastructure, not business logic)

**Approach:** Integration testing + critical path coverage

---

### 🟢 LOW Priority (Non-Core Logic)

**Location:** `src/__tests__/unit/presentation/`

These are **NOT core business logic**:

- **Components** (6 files): UI rendering, styling, user interaction
- **Providers** (5 files): Context provision, dependency injection
- **Services** (3 files): Third-party integrations, infrastructure

**Approach:** Snapshot testing + basic functionality checks

---

## 📊 Test Distribution

| Category | Files | Priority | Coverage Target | Testing Type |
|----------|--------|------------|------------------|---------------|
| **API** | 32 | 🔴 HIGH | 100% | White-Box |
| **Hooks** | 12 | 🔴 HIGH | 100% | White-Box |
| **Utils** | 20+ | 🔴 HIGH | 100% | White-Box |
| **Validations** | 6 | 🔴 HIGH | 100% | White-Box |
| **Offline** | 7 | 🔴 HIGH | 100% | White-Box |
| **Lib** | 7 | 🔴 HIGH | 100% | White-Box |
| **Middleware** | 1 | 🔴 HIGH | 100% | White-Box |
| **Components** | 6 | 🟢 LOW | 70% | Snapshot |
| **Providers** | 5 | 🟢 LOW | 70% | Snapshot |
| **Services** | 3 | 🟡 MEDIUM | 80% | Integration |

---

## 🚀 Running Tests

### Run All Tests
```bash
npm run test
```

### Run Only Core Logic Tests (Recommended for Development)
```bash
npm run test -- src/__tests__/unit/core-logic
```

### Run Specific Category
```bash
# API tests
npm run test -- src/__tests__/unit/core-logic/api

# Hook tests
npm run test -- src/__tests__/unit/core-logic/hooks

# Utility tests
npm run test -- src/__tests__/unit/core-logic/utils
```

### Run with Coverage
```bash
npm run test:coverage
```

---

## 📝 Writing New Tests

### For Core Logic (`core-logic/`)

1. **100% Coverage Required**: All branches, paths, and conditions
2. **White-Box Techniques**:
   - Test all execution paths
   - Verify data transformations
   - Test edge cases and boundaries
   - Mock all external dependencies
   - Test error handling paths

3. **Test Structure** (15-20 sections):
   ```typescript
   describe("ModuleName", () => {
     // Section 1: Basic Functionality
     // Section 2: Edge Cases
     // Section 3: Branch Coverage
     // Section 4: Path Coverage
     // Section 5: Data Flow
     // Section 6: Error Handling
     // Section 7: Integration Scenarios
     // ... etc
   });
   ```

### For Presentation Layer (`presentation/`)

1. **Snapshot Testing**: For UI components
2. **Functionality Testing**: Basic user interactions
3. **No Deep Coverage Needed**: These are infrastructure/UI, not business logic

---

## 📈 Progress Tracking

See `testing/white-box/MISSING_TESTS_WHITEBOX_ANALYSIS.md` for detailed progress on core logic testing.

**Current Status:**
- ✅ 17/85 core modules completed (20%)
- ✅ 2,027+ tests written
- ✅ 100% coverage achieved for completed modules

---

## 🔗 Related Documentation

- [White-Box Testing Guide](../../testing/white-box/MISSING_TESTS_WHITEBOX_ANALYSIS.md)
- [Test Coverage Reports](../../../docs/)
- [Project Testing Memory](../../../memory/MEMORY.md)

---

**Last Updated:** 2026-02-13
**Maintained By:** White-Box Testing Initiative
