
# Playwright Regression Testing — Contribution & Architecture Guide

## Context
This repository contains the frontend for Gemini Verify. We are building out
automated regression coverage using Playwright. This document defines the
required structure, conventions, and process for adding tests. Follow this
exactly when generating or editing test files — do not invent alternate
structures or naming conventions.

## Application shape
The UI has a persistent top navigation bar and 7-8 primary pages:
Dashboard, Collateral, Holiday, Account Manager, [add remaining pages here].
Each page has page-specific business logic and data; some UI elements
(navbar, login/logout, common input components, common buttons) are shared
across all pages.

## Core principle: Component tests vs Page tests
Shared UI elements are tested ONCE, in isolation. Page-specific tests assume
shared components already work and must NOT re-test shared behavior.

- `tests/components/` — tests for shared UI: navbar, login/logout, shared
  input fields, common buttons. These are the source of truth for shared
  behavior.
- `tests/pages/<page-name>/` — tests for page-specific logic, data
  rendering, and interactions unique to that page. These tests may USE
  shared page objects (e.g. to navigate via the navbar) but must not
  duplicate assertions already covered in `tests/components/`.

## Folder structure (must be followed exactly)
```

tests/
  components/
    navbar.spec.ts
    login-logout.spec.ts
    input-fields.spec.ts
    common-buttons.spec.ts
  pages/
    dashboard/dashboard.spec.ts
    collateral/collateral.spec.ts
    holiday/holiday.spec.ts
    account-manager/account-manager.spec.ts
  pageObjects/
    NavbarComponent.ts
    DashboardPage.ts
    CollateralPage.ts
    HolidayPage.ts
    AccountManagerPage.ts
  fixtures/
    auth.setup.ts
```

## Page Object Model — mandatory
Every page or shared component must have a corresponding Page Object class
in `pageObjects/`. Test files must NOT contain raw selectors — all locators
and interaction methods live in the Page Object. Test files only call Page
Object methods and make assertions.

Example shape for a Page Object:
```ts
export class CollateralPage {
  constructor(private page: Page) {}
  async goto() { ... }
  async filterByDate(date: string) { ... }
  async getRowCount(): Promise<number> { ... }
}
```

## Required tagging
Every test must be tagged using Playwright's test annotation/tag system:
- `@smoke` — critical-path test, runs on every merge request
- `@regression` — full suite, runs nightly and pre-release
- `@component` or `@page` — which tier the test belongs to
- `@page:<name>` — e.g. `@page:collateral`, for running one page in isolation
- `@shared` — for component tests; a failure here likely affects multiple pages
- `@flaky-candidate` — temporary tag for tests under investigation for flakiness

Example:
```ts
test('navbar links navigate to correct pages', { tag: ['@component', '@shared', '@smoke'] }, async ({ page }) => {
  ...
});
```

## Test file template
When creating a new test file, follow this structure:
```ts
import { test, expect } from '@playwright/test';
import { <RelevantPage> } from '../../pageObjects/<RelevantPage>';

test.describe('<Page or Component name>', () => {
  test.beforeEach(async ({ page }) => {
    // navigate/setup via Page Object, not raw page.goto with hardcoded selectors
  });

  test('<specific behavior being tested>', { tag: ['@page:<name>'] }, async ({ page }) => {
    // Arrange via Page Object methods
    // Act
    // Assert — one logical behavior per test, avoid multi-assertion god-tests
  });
});
```

## Rules for converting existing manual regression cases
When given a manual/legacy regression test case to convert:
1. Determine if it belongs in `components/` (shared UI behavior) or
   `pages/<name>/` (page-specific behavior). Default to `pages/` unless it
   is clearly testing navbar, auth, or a shared input/button component.
2. Check whether an equivalent shared-component test already covers part of
   this case — if so, do NOT duplicate that assertion; only add the
   page-specific portion.
3. If the case requires manual data setup, external system state, visual/
   subjective judgment, or third-party integration state that cannot be
   mocked or seeded programmatically, do NOT convert it. Instead, add it to
   `tests/UNAUTOMATED_CASES.md` with a one-line reason.
4. Reuse or extend existing Page Objects — do not create a duplicate Page
   Object for a page that already has one.
5. Tag appropriately per the tagging rules above.

## What NOT to do
- Do not put raw CSS/XPath selectors directly in `.spec.ts` files.
- Do not create a new folder structure or naming convention.
- Do not write a single test that asserts both shared-component behavior
  and page-specific behavior — split it.
- Do not skip tagging.
- Do not silently drop an unconvertible manual test case — log it in
  `UNAUTOMATED_CASES.md`.
