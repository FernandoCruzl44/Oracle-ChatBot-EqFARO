import { test, expect } from "@playwright/test";
import type { BrowserContext, Page } from "@playwright/test";

// Configure test timeouts and mode
test.describe.configure({ mode: "serial", timeout: 180000 }); // 3 minutes total timeout

// Helper functions
const generateUniqueTaskTitle = () => {
  const now = new Date();
  return `Test Task ${now.getTime()}`;
};

async function retryOperation(
  operation: () => Promise<void>,
  maxRetries: number
) {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      await operation();
      return;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  throw lastError;
}

async function handleUserSelection(page: Page) {
  try {
    await page.waitForTimeout(1000);
    const errorVisible = await page
      .locator("text=No has seleccionado un usuario")
      .isVisible()
      .catch(() => false);

    if (errorVisible) {
      const userSelect = page.locator("select.bg-transparent");
      await expect(userSelect).toBeVisible({ timeout: 10000 });
      await userSelect.selectOption({ index: 1 });
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1500);

      await page
        .waitForSelector("text=No has seleccionado un usuario", {
          state: "detached",
          timeout: 15000,
        })
        .catch(() => console.log("User selection message still visible"));
    }
  } catch (error) {
    console.error("Error in handleUserSelection:", error);
    throw error;
  }
}

async function createTestTask(page: Page): Promise<string> {
  const taskTitle = generateUniqueTaskTitle();

  try {
    // Open create modal with retry mechanism
    await page.waitForTimeout(1000);
    const createButton = page.locator("button:has-text('Agrega tarea')");
    await expect(createButton).toBeVisible({ timeout: 10000 });
    await createButton.click();

    // Wait for modal to be fully visible
    await page.waitForTimeout(1500);
    await page.waitForSelector('input[placeholder="Título de la tarea"]', {
      state: "visible",
      timeout: 10000,
    });

    // Fill basic info with waits
    const titleInput = page.locator('input[placeholder="Título de la tarea"]');
    await titleInput.waitFor({ state: "visible" });
    await titleInput.fill(taskTitle);
    await page.waitForTimeout(500);

    // Set tag with explicit waits
    const tagSelector = page
      .locator("select")
      .filter({ hasText: "Feature" })
      .first();
    await expect(tagSelector).toBeVisible();
    await tagSelector.waitFor({ state: "visible" });
    await tagSelector.selectOption("Feature");
    await page.waitForTimeout(500);

    // Set status with explicit waits
    const statusSelector = page
      .locator("select")
      .filter({ hasText: "Backlog" });
    await expect(statusSelector).toBeVisible();
    await statusSelector.waitFor({ state: "visible" });
    await statusSelector.selectOption("En progreso");
    await page.waitForTimeout(500);

    // Set dates and hours
    const today = new Date().toISOString().split("T")[0];
    const dateInput = page.locator('input[type="date"]').first();
    await dateInput.waitFor({ state: "visible" });
    await dateInput.fill(today);
    await page.waitForTimeout(500);

    const hoursInput = page.locator('input[type="number"]').first();
    await hoursInput.waitFor({ state: "visible" });
    await hoursInput.fill("4");
    await page.waitForTimeout(500);

    // Select team with explicit waits
    const teamSelector = page.locator('select:has-text("Elige un equipo")');
    await teamSelector.waitFor({ state: "visible", timeout: 10000 });
    await teamSelector.selectOption({ index: 1 });
    await page.waitForTimeout(1500);

    // Wait for and handle assignees with extended timeouts
    await page.waitForSelector("text=Asignados", {
      state: "visible",
      timeout: 15000,
    });

    // Specifically target checkboxes within the assignees section
    const assigneesSection = page.locator('.space-y-4:has-text("Asignados")');
    await assigneesSection.waitFor({ state: "visible", timeout: 15000 });

    // Log assignee checkboxes found
    const assigneeCheckboxes = assigneesSection.locator(
      'input[type="checkbox"]'
    );
    const checkboxCount = await assigneeCheckboxes.count();
    console.log(`Number of assignee checkboxes found: ${checkboxCount}`);

    // Select the first assignee checkbox
    const firstAssigneeCheckbox = assigneeCheckboxes.first();
    await firstAssigneeCheckbox.waitFor({ state: "visible", timeout: 10000 });
    await page.waitForTimeout(500);
    await firstAssigneeCheckbox.click();
    await page.waitForTimeout(500);
    await expect(firstAssigneeCheckbox).toBeChecked({ timeout: 5000 });

    // Add description with wait
    const descriptionArea = page.locator("textarea");
    await descriptionArea.waitFor({ state: "visible" });
    await descriptionArea.fill("This is a test task description");
    await page.waitForTimeout(500);

    // Submit task with extended waits
    const submitButton = page.locator('button:has-text("Crear Tarea")');
    await expect(submitButton).toBeVisible({ timeout: 10000 });
    await submitButton.click({ force: true });
    await page.waitForTimeout(2000);

    // Wait for modal to close
    await page.waitForSelector('input[placeholder="Título de la tarea"]', {
      state: "detached",
      timeout: 15000,
    });

    // Additional wait for table update
    await page.waitForTimeout(1500);

    // Verify creation with extended timeout
    const createdTaskRow = page.locator(
      `table tbody tr:has-text("${taskTitle}")`
    );
    await expect(createdTaskRow).toBeVisible({ timeout: 15000 });

    return taskTitle;
  } catch (error) {
    console.error("Error in createTestTask:", error);
    throw new Error(`Failed to create test task: ${error}`);
  }
}

test.describe("Task Operations", () => {
  let taskTitle: string;
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(120000);

    try {
      context = await browser.newContext({
        storageState: "playwright/.auth/user.json",
        viewport: { width: 1920, height: 1080 },
      });

      page = await context.newPage();

      // Initial page load with waits
      await page.goto("/");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);

      await handleUserSelection(page);

      // Wait for initial table load with retry
      await retryOperation(async () => {
        await page.waitForSelector("table tbody tr", { timeout: 10000 });
      }, 3);

      // Create test task
      taskTitle = await createTestTask(page);
    } catch (error) {
      console.error("Error in beforeAll:", error);
      throw error;
    }
  });

  test.afterAll(async () => {
    await context?.close().catch(console.error);
  });

  test("should verify task creation", async () => {
    try {
      const taskRow = page.locator(`table tbody tr:has-text("${taskTitle}")`);
      await expect(taskRow).toBeVisible({ timeout: 10000 });

      // Verify task details
      const statusCell = taskRow.locator("button.text-white");
      const statusText = await statusCell.textContent();
      expect(statusText?.trim()).toContain("En progreso");

      // Verify tag
      const tagCell = taskRow.locator("td >> text=Feature");
      await expect(tagCell).toBeVisible();
    } catch (error) {
      console.error("Error verifying task creation:", error);
      throw error;
    }
  });

  test("should modify the test task", async () => {
    try {
      // Open task details
      const taskRow = page.locator(`table tbody tr:has-text("${taskTitle}")`);
      await taskRow.locator("td.truncate button").first().click();
      await page.waitForSelector('h3:has-text("Comentarios")', {
        state: "visible",
        timeout: 10000,
      });

      // Add comment
      const commentInput = page.locator(
        'input[placeholder="Escribe tu comentario"]'
      );
      await commentInput.waitFor({ state: "visible" });
      await commentInput.fill("This is a test comment");

      const submitComment = page.locator(
        'button[type="submit"] i.fa-paper-plane'
      );
      await submitComment.click();
      await page.waitForTimeout(1500);

      // Verify comment - using a more specific selector
      const comment = page.locator(".flex-1 p.text-sm", {
        hasText: "This is a test comment",
      });
      // Alternative selector if needed:
      // const comment = page.locator('.border.border-oc-outline-light/60 p.text-sm', {
      //   hasText: "This is a test comment"
      // });

      await expect(comment).toBeVisible({ timeout: 10000 });

      // Close task modal
      await page.locator("button i.fa-times").first().click();
      await page.waitForTimeout(1000);

      // Change status to completed
      const statusButton = taskRow.locator("button.text-white");
      await statusButton.click({ force: true });

      // Wait for the dropdown menu to appear
      await page.waitForSelector(".absolute .py-1.px-1", {
        state: "visible",
        timeout: 10000,
      });

      // Click the "Completada" option
      const completedOption = page.locator("button", { hasText: "Completada" });
      await completedOption.click({ force: true });
      await page.waitForTimeout(1500);

      // Verify new status
      const newStatus = await statusButton.textContent();
      expect(newStatus?.trim()).toContain("Completada");
    } catch (error) {
      console.error("Error modifying task:", error);
      throw error;
    }
  });

  test("should search for the test task", async () => {
    try {
      // Clear previous search if exists
      const clearSearch = page.locator("i.fa-times-circle");
      const isClearVisible = await clearSearch.isVisible().catch(() => false);
      if (isClearVisible) {
        await clearSearch.click();
        await page.waitForTimeout(1000);
      }

      // Perform search
      const searchInput = page.locator(
        'input[placeholder="Buscar por título"]'
      );
      await searchInput.fill(taskTitle);
      await page.waitForTimeout(1500);

      // Verify search results
      const searchedRow = page.locator(
        `table tbody tr:has-text("${taskTitle}")`
      );
      await expect(searchedRow).toBeVisible({ timeout: 10000 });

      // Verify only one result
      const rowCount = await searchedRow.count();
      expect(rowCount).toBe(1);
    } catch (error) {
      console.error("Error searching task:", error);
      throw error;
    }
  });

  test("should delete the test task", async () => {
    try {
      // Select task
      const taskRow = page.locator(`table tbody tr:has-text("${taskTitle}")`);
      await expect(taskRow).toBeVisible({ timeout: 10000 });

      const checkbox = taskRow.locator('input[type="checkbox"]');
      await checkbox.check({ force: true });
      await page.waitForTimeout(1000);

      // Click delete button
      const deleteButton = page.locator('button:has-text("Eliminar")');
      await expect(deleteButton).toBeVisible({ timeout: 10000 });
      await deleteButton.click({ force: true });
      await page.waitForTimeout(2000);

      // Verify deletion
      const deletedCount = await page
        .locator(`table tbody tr:has-text("${taskTitle}")`)
        .count();
      expect(deletedCount).toBe(0);
    } catch (error) {
      console.error("Error deleting task:", error);
      throw error;
    }
  });
});
