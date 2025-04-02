// tests/components.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Component Testing", () => {
  test.use({ storageState: "playwright/.auth/user.json" });

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("TaskModal should display task details correctly", async ({ page }) => {
    // Wait until the task table has at least one row.
    await page.waitForSelector("table tr", { timeout: 10000 });

    // Wait until at least one task button (inside a 'td.truncate') becomes visible.
    await page.waitForSelector("table td.truncate button", {
      state: "visible",
      timeout: 10000,
    });

    // Log the count of found task buttons.
    const buttonCount = await page.locator("table td.truncate button").count();
    console.log("Found task buttons:", buttonCount);
    expect(buttonCount).toBeGreaterThan(0);

    // Click the first task button to open the modal.
    await page.locator("table td.truncate button").first().click();

    // Verify that the modal shows expected elements.
    await expect(page.locator('input[type="text"].text-lg')).toBeVisible(); // Title input
    await expect(page.locator("textarea")).toBeVisible(); // Description textarea
    await expect(page.locator('h3:has-text("Comentarios")')).toBeVisible(); // Comments header

    // Optionally, close the modal.
    await page.locator("button i.fa-times").first().click();
    await expect(page.locator('h3:has-text("Comentarios")')).not.toBeVisible();
  });

  test("SidebarProfile should display current user and allow switching", async ({
    page,
  }) => {
    // Verify that the user information is displayed in the sidebar.
    await expect(
      page.locator(".text-stone-300 .font-medium").first()
    ).toBeVisible();

    // Click the first available select element (user selector).
    await page.locator("select").first().click();

    // Select a different user.
    await page.locator("select").selectOption({ index: 1 });
  });

  test("Search functionality should filter tasks", async ({ page }) => {
    // Count the initial task rows using the table rows.
    const initialTaskCount = await page.locator("table tr").count();

    // Type a search term that should match part of some tasks.
    await page.locator('input[placeholder="Buscar por título"]').fill("imple");

    // Wait for results to update.
    await page.waitForTimeout(500);

    // Count the task rows after applying the search filter.
    const filteredTaskCount = await page.locator("table tr").count();

    // Filtered count should be less than or equal to the initial count.
    expect(filteredTaskCount).toBeLessThanOrEqual(initialTaskCount);

    // Now enter a search term that should match no tasks.
    await page
      .locator('input[placeholder="Buscar por título"]')
      .fill("xyznonexistenttask123");
    await page.waitForTimeout(500);

    // Verify the message "No hay tareas que coincidan con la búsqueda" is visible.
    await expect(
      page.locator("text=No hay tareas que coincidan con la búsqueda")
    ).toBeVisible();

    // Clear the search by clicking the "clear" icon.
    await page.locator("i.fa-times-circle").click();
    await page.waitForTimeout(500);

    // Verify that the original task count is restored.
    const restoredCount = await page.locator("table tr").count();
    expect(restoredCount).toEqual(initialTaskCount);
  });
});
