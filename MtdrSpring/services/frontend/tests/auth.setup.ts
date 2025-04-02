// tests/auth.setup.ts
import { test as setup, expect } from "@playwright/test";
import { mkdir } from "fs/promises";
import { dirname } from "path";

// This setup file will handle login and store authentication state
setup("authenticate", async ({ page }) => {
  // Create directory for auth state if it doesn't exist
  await mkdir(dirname("playwright/.auth/user.json"), { recursive: true });

  // Navigate to the application
  await page.goto("/");

  // Wait for the application to load completely
  await page.waitForLoadState("networkidle");

  // Wait until loading is complete
  await page
    .waitForSelector("text=Cargando...", { state: "detached", timeout: 10000 })
    .catch(() => console.log("Loading indicator not found or already gone"));

  // Find and select a user from the dropdown
  await page.locator("select").first().selectOption({ index: 1 });

  // Wait for the page to reload or update after user selection
  // This is critical - need to ensure the application has fully processed the user selection
  await page.waitForLoadState("domcontentloaded");
  await page.waitForLoadState("networkidle");

  // Wait a bit longer to ensure all state is updated
  await page.waitForTimeout(2000);

  // Verify that we're properly logged in (no error message visible)
  const errorMessage = page.locator("text=No has seleccionado un usuario");
  const isStillError = await errorMessage.isVisible().catch(() => false);
  if (isStillError) {
    throw new Error(
      "Failed to authenticate: User selection did not take effect"
    );
  }

  // Now we can store the authentication state
  await page.context().storageState({ path: "playwright/.auth/user.json" });

  console.log("Authentication successful, state stored");
});
