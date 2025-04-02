// tests/sprints.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Sprint Management", () => {
  test.use({ storageState: "playwright/.auth/user.json" });

  test.beforeEach(async ({ page }) => {
    await page.goto("/");

    // Wait for the page to be fully loaded
    await page.waitForLoadState("networkidle");

    // Check if we need to select a user again
    const errorVisible = await page
      .locator("text=No has seleccionado un usuario")
      .isVisible()
      .catch(() => false);

    if (errorVisible) {
      await page.locator("select.bg-transparent").selectOption({ index: 1 });
      await page.waitForLoadState("networkidle");
      await page
        .waitForSelector("text=No has seleccionado un usuario", {
          state: "detached",
          timeout: 5000,
        })
        .catch(() => console.log("User selection message still visible"));
    }

    // Click on a team tab to access sprint functionality
    await page.waitForSelector('button:has-text("Todas las tareas")', {
      state: "visible",
      timeout: 10000,
    });

    // Wait for teams to load, then click on first team tab
    const teamButtons = page
      .locator("button.whitespace-nowrap")
      .filter({ hasText: /^(?!Todas las tareas)/ });

    // Check if there are any team buttons
    const teamsCount = await teamButtons.count();
    if (teamsCount === 0) {
      console.log("No team buttons found, test may fail");
    } else {
      await teamButtons.first().click();
      // Wait for team view to load
      await page.waitForLoadState("networkidle");
    }
  });

  test("should create a new sprint", async ({ page }) => {
    // Click the sprint selector button - be more specific with the selector
    const sprintButton = page
      .locator("button", { hasText: /sprints|No hay sprints/ })
      .first();
    await expect(sprintButton).toBeVisible({ timeout: 10000 });
    await sprintButton.click();

    // Click the "New sprint" option - be more specific to avoid ambiguity
    await page.locator('button:has-text("Nuevo sprint")').click();

    // Wait for the sprint creation modal to appear
    await page.waitForSelector('input[placeholder="Nombre del Sprint"]', {
      state: "visible",
    });

    // Fill in the sprint form
    await page
      .locator('input[placeholder="Nombre del Sprint"]')
      .fill("Test Sprint");

    // Ensure we have valid dates
    // Get current date in YYYY-MM-DD format for start date
    const today = new Date();
    const todayFormatted = today.toISOString().split("T")[0];

    // Get date two weeks later for end date
    const twoWeeksLater = new Date();
    twoWeeksLater.setDate(today.getDate() + 14);
    const twoWeeksLaterFormatted = twoWeeksLater.toISOString().split("T")[0];

    await page.locator('input[type="date"]').nth(0).fill(todayFormatted);
    await page
      .locator('input[type="date"]')
      .nth(1)
      .fill(twoWeeksLaterFormatted);

    // Click the create button - use force true to ensure click happens
    await page
      .locator('button:has-text("Crear Sprint")')
      .click({ force: true });

    // Wait for the modal to close and for any API calls to complete
    await page.waitForSelector('input[placeholder="Nombre del Sprint"]', {
      state: "detached",
      timeout: 5000,
    });
    await page.waitForLoadState("networkidle");

    // Click the sprint selector again to see if our new sprint is there
    await sprintButton.click();

    // Verify the sprint was created - look for the sprint name in the dropdown
    const sprintExists = await page
      .locator("button", { hasText: "Test Sprint" })
      .isVisible();
    expect(sprintExists).toBeTruthy();
  });

  test("should edit a sprint", async ({ page }) => {
    // Click the sprint selector - be more specific with the selector
    const sprintButton = page
      .locator("button", { hasText: /sprints|No hay sprints/ })
      .first();
    await expect(sprintButton).toBeVisible({ timeout: 10000 });
    await sprintButton.click();

    // Check if there are any sprints
    const hasNoSprints = await page
      .locator("text=No hay sprints")
      .isVisible()
      .catch(() => false);
    if (hasNoSprints) {
      console.log("No sprints found, skipping test");
      test.skip();
      return;
    }

    // Find the first sprint group and hover over it to show the edit button
    const sprintGroups = page
      .locator(".group")
      .filter({ hasText: /^((?!Todos los sprints).)*$/ });
    if ((await sprintGroups.count()) === 0) {
      console.log("No sprint groups found, skipping test");
      test.skip();
      return;
    }

    // Hover over the first sprint group
    await sprintGroups.first().hover();

    // Click the edit button that appears when hovering
    await page
      .locator(".group-hover\\:opacity-100 i.fa-edit")
      .first()
      .click({ force: true });

    // Wait for the edit modal to appear
    await page.waitForSelector('input[placeholder="Nombre del Sprint"]', {
      state: "visible",
    });

    // Modify the sprint name
    await page
      .locator('input[placeholder="Nombre del Sprint"]')
      .fill("Updated Sprint Name");

    // Click save button
    await page
      .locator('button:has-text("Guardar Cambios")')
      .click({ force: true });

    // Wait for the modal to close and for any API calls to complete
    await page.waitForSelector('input[placeholder="Nombre del Sprint"]', {
      state: "detached",
      timeout: 5000,
    });
    await page.waitForLoadState("networkidle");

    // Click the sprint selector again to see if our sprint was updated
    await sprintButton.click();

    // Verify the sprint was updated
    const updatedSprintExists = await page
      .locator("button", { hasText: "Updated Sprint Name" })
      .isVisible();
    expect(updatedSprintExists).toBeTruthy();
  });
});
