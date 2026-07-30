import { test, expect } from "@playwright/test";

const BASE_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const API_URL = process.env.API_URL || "http://localhost:8000";

// Timeout for LLM responses — these can be slow
const CHAT_TIMEOUT = 120_000;

test.describe("Video Context Graph", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  // --------------------------------------------------------------------------
  // Basic page load
  // --------------------------------------------------------------------------

  test("page loads with header and chat panel", async ({ page }) => {
    // Header with domain name
    await expect(page.getByRole("heading", { name: /Video Context Graph/i })).toBeVisible();

    // Chat heading
    await expect(page.getByRole("heading", { name: /chat/i })).toBeVisible();

    // Chat input
    await expect(page.getByPlaceholder(/ask about/i)).toBeVisible();
  });

  test("demo scenario badges are visible", async ({ page }) => {
    // Should show demo scenario section
    await expect(page.getByText(/try these/i)).toBeVisible();

    // Should have clickable badges
    const badges = page.locator("button[title]").filter({ hasText: /.{10,}/ });
    const count = await badges.count();
    expect(count).toBeGreaterThan(0);
  });

  // --------------------------------------------------------------------------
  // Backend health
  // --------------------------------------------------------------------------

  test("backend health check returns ok or degraded", async ({ request }) => {
    const res = await request.get(`${API_URL}/health`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(["ok", "degraded"]).toContain(body.status);
    expect(body.domain).toBe("video-context-graph");
  });

  test("connection status indicator visible", async ({ page }) => {
    // The header contains a colored status dot
    const dot = page.locator("[title*='Backend']");
    await expect(dot).toBeVisible({ timeout: 10_000 });
  });

  // --------------------------------------------------------------------------
  // Schema visualization
  // --------------------------------------------------------------------------

  test("graph loads schema view on startup", async ({ page }) => {
    // The graph panel shows "Schema view" text
    await expect(page.getByText(/schema view/i)).toBeVisible({ timeout: 15_000 });

    // Legend badges should be visible
    const legend = page.locator("[class*='badge']").filter({ hasText: /^[A-Z]/ });
    await expect(legend.first()).toBeVisible({ timeout: 10_000 });
  });

  // --------------------------------------------------------------------------
  // Chat interaction with demo prompts
  // --------------------------------------------------------------------------

  test("demo prompt: Explore — sends and gets response", async ({ page }) => {
    test.setTimeout(CHAT_TIMEOUT);

    // Type the prompt
    const input = page.getByPlaceholder(/ask about/i);
    await input.fill("What videos do we have and what are they about?");
    await page.getByRole("button", { name: /send/i }).click();

    // Should show user message
    await expect(page.getByText("What videos do we have and what are they about?").first()).toBeVisible();

    // Should show loading state (thinking or tool calls)
    await expect(
      page.getByText(/thinking|running|generating/i).first()
    ).toBeVisible({ timeout: 10_000 });

    // Wait for assistant response (not an error)
    const assistantResponse = page.locator(".markdown-content").last();
    await expect(assistantResponse).toBeVisible({ timeout: CHAT_TIMEOUT });

    // Response should have meaningful content (not empty, not just an error)
    const text = await assistantResponse.textContent();
    expect(text).toBeTruthy();
    expect(text!.length).toBeGreaterThan(20);

    // Should NOT be an error message
    expect(text!.toLowerCase()).not.toContain("cannot reach the backend");
  });

  test("demo prompt: Find a moment — sends and gets response", async ({ page }) => {
    test.setTimeout(CHAT_TIMEOUT);

    // Type the prompt
    const input = page.getByPlaceholder(/ask about/i);
    await input.fill("Find the moment where a butterfly lands on the rabbit");
    await page.getByRole("button", { name: /send/i }).click();

    // Should show user message
    await expect(page.getByText("Find the moment where a butterfly lands on the rabbit").first()).toBeVisible();

    // Should show loading state (thinking or tool calls)
    await expect(
      page.getByText(/thinking|running|generating/i).first()
    ).toBeVisible({ timeout: 10_000 });

    // Wait for assistant response (not an error)
    const assistantResponse = page.locator(".markdown-content").last();
    await expect(assistantResponse).toBeVisible({ timeout: CHAT_TIMEOUT });

    // Response should have meaningful content (not empty, not just an error)
    const text = await assistantResponse.textContent();
    expect(text).toBeTruthy();
    expect(text!.length).toBeGreaterThan(20);

    // Should NOT be an error message
    expect(text!.toLowerCase()).not.toContain("cannot reach the backend");
  });

  test("demo prompt: Cross-video — sends and gets response", async ({ page }) => {
    test.setTimeout(CHAT_TIMEOUT);

    // Type the prompt
    const input = page.getByPlaceholder(/ask about/i);
    await input.fill("Which entities appear in more than one video?");
    await page.getByRole("button", { name: /send/i }).click();

    // Should show user message
    await expect(page.getByText("Which entities appear in more than one video?").first()).toBeVisible();

    // Should show loading state (thinking or tool calls)
    await expect(
      page.getByText(/thinking|running|generating/i).first()
    ).toBeVisible({ timeout: 10_000 });

    // Wait for assistant response (not an error)
    const assistantResponse = page.locator(".markdown-content").last();
    await expect(assistantResponse).toBeVisible({ timeout: CHAT_TIMEOUT });

    // Response should have meaningful content (not empty, not just an error)
    const text = await assistantResponse.textContent();
    expect(text).toBeTruthy();
    expect(text!.length).toBeGreaterThan(20);

    // Should NOT be an error message
    expect(text!.toLowerCase()).not.toContain("cannot reach the backend");
  });

  // --------------------------------------------------------------------------
  // Demo badge click flow
  // --------------------------------------------------------------------------

  test("clicking a demo badge sends the prompt", async ({ page }) => {
    test.setTimeout(CHAT_TIMEOUT);

    // Find and click the first demo badge
    const badge = page.locator("button[title]").first();
    const promptText = await badge.getAttribute("title");
    expect(promptText).toBeTruthy();

    await badge.click();

    // Should show user message with the badge prompt
    await expect(page.getByText(promptText!).first()).toBeVisible({ timeout: 5_000 });

    // Should eventually get an assistant response
    const assistantResponse = page.locator(".markdown-content").last();
    await expect(assistantResponse).toBeVisible({ timeout: CHAT_TIMEOUT });
  });

  // --------------------------------------------------------------------------
  // Tool call visualization
  // --------------------------------------------------------------------------

  test("tool calls show timeline with status indicators", async ({ page }) => {
    test.setTimeout(CHAT_TIMEOUT);

    // Send a prompt that should trigger tool calls
    const input = page.getByPlaceholder(/ask about/i);
    await input.fill("Show me the graph around the rabbit");
    await page.getByRole("button", { name: /send/i }).click();

    // Wait for at least one tool call badge to appear
    const toolBadge = page.locator(".chakra-badge, [data-scope='badge']").filter({
      hasText: /search_video_moments|explore_graph|run_cypher|get_graph_schema|twelvelabs_search/,
    });
    await expect(toolBadge.first()).toBeVisible({ timeout: 30_000 });
  });

  // --------------------------------------------------------------------------
  // Graph updates from chat
  // --------------------------------------------------------------------------

  test("graph visualization updates after agent query", async ({ page }) => {
    test.setTimeout(CHAT_TIMEOUT);

    // The graph starts in schema view
    await expect(page.getByText(/schema view/i)).toBeVisible({ timeout: 15_000 });

    // Send a query that should return graph data
    const input = page.getByPlaceholder(/ask about/i);
    await input.fill("Show me the graph around the rabbit");
    await page.getByRole("button", { name: /send/i }).click();

    // Wait for the graph to switch from schema to data view
    // (the text changes from "Schema view" to entity relationships)
    await expect(page.getByText(/entity relationships/i)).toBeVisible({ timeout: CHAT_TIMEOUT });
  });

  // --------------------------------------------------------------------------
  // New conversation
  // --------------------------------------------------------------------------

  test("new conversation button resets chat", async ({ page }) => {
    test.setTimeout(CHAT_TIMEOUT);

    // Send a message first
    const input = page.getByPlaceholder(/ask about/i);
    await input.fill("Hello");
    await page.getByRole("button", { name: /send/i }).click();

    // Wait for response
    await expect(page.locator(".markdown-content").last()).toBeVisible({ timeout: CHAT_TIMEOUT });

    // Click "New" button
    await page.getByRole("button", { name: /new/i }).click();

    // Demo scenarios should be visible again
    await expect(page.getByText(/try these/i)).toBeVisible();
  });

  // --------------------------------------------------------------------------
  // Mobile navigation (viewport 375px)
  // --------------------------------------------------------------------------

  test("mobile: bottom tab bar switches panels", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(BASE_URL);

    // Chat should be visible by default
    await expect(page.getByPlaceholder(/ask about/i)).toBeVisible();

    // Bottom tab bar should be visible
    const graphTab = page.getByRole("button", { name: /graph panel/i });
    await expect(graphTab).toBeVisible();

    // Click graph tab
    await graphTab.click();

    // Graph content should now be visible
    await expect(page.getByText(/schema view|knowledge graph/i).first()).toBeVisible({ timeout: 10_000 });

    // Click details tab
    const detailsTab = page.getByRole("button", { name: /details panel/i });
    await detailsTab.click();

    // The video browser should be visible in the details panel.
    await expect(page.getByRole("heading", { name: /videos/i })).toBeVisible();
  });

  // --------------------------------------------------------------------------
  // Video browser (right-side details panel)
  // --------------------------------------------------------------------------

  test("video browser loads and shows the indexed video list", async ({ page }) => {
    const details = page.getByRole("complementary", { name: /details/i });
    await expect(details.getByRole("heading", { name: /videos/i })).toBeVisible();
    await expect(details.getByText(/^videos \(\d+\)$/i)).toBeVisible({ timeout: 10_000 });
  });

  // --------------------------------------------------------------------------
  // Video segment browser (right-side details panel)
  // --------------------------------------------------------------------------

  test("video browser opens an indexed video's segment detail view", async ({ page }) => {
    const details = page.getByRole("complementary", { name: /details/i });
    await expect(details.getByText(/^videos \(\d+\)$/i)).toBeVisible({ timeout: 10_000 });

    const videoTitle = details.getByRole("heading").nth(1);
    if (await videoTitle.count() === 0) {
      test.skip(true, "no indexed videos — run make seed before end-to-end tests");
    }

    await videoTitle.click();
    await expect(details.getByText(/segments/i)).toBeVisible({ timeout: 10_000 });
  });

  // --------------------------------------------------------------------------
  // Regression tests for v0.12.0 / v0.13.0 frontend bug fixes
  // --------------------------------------------------------------------------

  test("composite keys do not trigger React duplicate-key warnings across renders", async ({ page }) => {
    // Send a few video prompts in sequence. React logs a console.error if
    // entity or tool-call badges collide on a non-unique key.
    const keyWarnings: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "warning" || msg.type() === "error") {
        const text = msg.text();
        if (
          text.includes("Encountered two children with the same key") ||
          text.includes("Each child in a list should have a unique") ||
          text.includes("key prop")
        ) {
          keyWarnings.push(text);
        }
      }
    });

    const input = page.locator("textarea, input[type='text']").first();
    if (await input.count() === 0) test.skip(true, "no chat input found");

    for (const prompt of [
      "What videos do we have and what are they about?",
      "Show me the graph around the rabbit",
      "Which entities appear in more than one video?",
    ]) {
      await input.fill(prompt);
      await page.keyboard.press("Enter");
      // Allow streaming + tool-call badges to flush before sending the next.
      await page.waitForTimeout(3000);
    }
    expect(keyWarnings).toEqual([]);
  });

  test("video browser list renders without runtime errors", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (err) => pageErrors.push(err.message));

    const details = page.getByRole("complementary", { name: /details/i });
    await expect(details.getByRole("heading", { name: /videos/i })).toBeVisible();
    await expect(details.getByText(/^videos \(\d+\)$/i)).toBeVisible({ timeout: 10_000 });
    expect(pageErrors).toEqual([]);
  });

  test("video segment entity badges render without runtime errors", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (err) => pageErrors.push(err.message));

    const details = page.getByRole("complementary", { name: /details/i });
    await expect(details.getByText(/^videos \(\d+\)$/i)).toBeVisible({ timeout: 10_000 });

    const videoTitle = details.getByRole("heading").nth(1);
    if (await videoTitle.count() === 0) {
      test.skip(true, "no indexed videos — run make seed before end-to-end tests");
    }

    await videoTitle.click();
    await expect(details.getByText(/segments/i)).toBeVisible({ timeout: 10_000 });
    expect(pageErrors).toEqual([]);
  });

  // --------------------------------------------------------------------------
  // API-level prompt quality checks
  // --------------------------------------------------------------------------

  test("API: Explore prompt 1 returns quality response", async ({ request }) => {
    test.setTimeout(CHAT_TIMEOUT);

    const res = await request.post(`${API_URL}/api/chat`, {
      data: { message: "What videos do we have and what are they about?" },
    });
    expect(res.ok()).toBeTruthy();

    const body = await res.json();

    // Should have a response string
    expect(body.response).toBeTruthy();
    expect(typeof body.response).toBe("string");
    expect(body.response.length).toBeGreaterThan(50);

    // Should have a session_id
    expect(body.session_id).toBeTruthy();

    // Response should not be a generic error
    expect(body.response.toLowerCase()).not.toContain("i apologize");
    expect(body.response.toLowerCase()).not.toContain("i don't have access");
  });

  test("API: Explore prompt 2 returns quality response", async ({ request }) => {
    test.setTimeout(CHAT_TIMEOUT);

    const res = await request.post(`${API_URL}/api/chat`, {
      data: { message: "Show me the graph around the rabbit" },
    });
    expect(res.ok()).toBeTruthy();

    const body = await res.json();

    // Should have a response string
    expect(body.response).toBeTruthy();
    expect(typeof body.response).toBe("string");
    expect(body.response.length).toBeGreaterThan(50);

    // Should have a session_id
    expect(body.session_id).toBeTruthy();

    // Response should not be a generic error
    expect(body.response.toLowerCase()).not.toContain("i apologize");
    expect(body.response.toLowerCase()).not.toContain("i don't have access");
  });

  test("API: Explore prompt 3 returns quality response", async ({ request }) => {
    test.setTimeout(CHAT_TIMEOUT);

    const res = await request.post(`${API_URL}/api/chat`, {
      data: { message: "What entities and topics appear in the indexed videos?" },
    });
    expect(res.ok()).toBeTruthy();

    const body = await res.json();

    // Should have a response string
    expect(body.response).toBeTruthy();
    expect(typeof body.response).toBe("string");
    expect(body.response.length).toBeGreaterThan(50);

    // Should have a session_id
    expect(body.session_id).toBeTruthy();

    // Response should not be a generic error
    expect(body.response.toLowerCase()).not.toContain("i apologize");
    expect(body.response.toLowerCase()).not.toContain("i don't have access");
  });

  test("API: Find a moment prompt 1 returns quality response", async ({ request }) => {
    test.setTimeout(CHAT_TIMEOUT);

    const res = await request.post(`${API_URL}/api/chat`, {
      data: { message: "Find the moment where a butterfly lands on the rabbit" },
    });
    expect(res.ok()).toBeTruthy();

    const body = await res.json();

    // Should have a response string
    expect(body.response).toBeTruthy();
    expect(typeof body.response).toBe("string");
    expect(body.response.length).toBeGreaterThan(50);

    // Should have a session_id
    expect(body.session_id).toBeTruthy();

    // Response should not be a generic error
    expect(body.response.toLowerCase()).not.toContain("i apologize");
    expect(body.response.toLowerCase()).not.toContain("i don't have access");
  });

  test("API: Find a moment prompt 2 returns quality response", async ({ request }) => {
    test.setTimeout(CHAT_TIMEOUT);

    const res = await request.post(`${API_URL}/api/chat`, {
      data: { message: "Where does the rabbit eat an apple?" },
    });
    expect(res.ok()).toBeTruthy();

    const body = await res.json();

    // Should have a response string
    expect(body.response).toBeTruthy();
    expect(typeof body.response).toBe("string");
    expect(body.response.length).toBeGreaterThan(50);

    // Should have a session_id
    expect(body.session_id).toBeTruthy();

    // Response should not be a generic error
    expect(body.response.toLowerCase()).not.toContain("i apologize");
    expect(body.response.toLowerCase()).not.toContain("i don't have access");
  });

  test("API: Find a moment prompt 3 returns quality response", async ({ request }) => {
    test.setTimeout(CHAT_TIMEOUT);

    const res = await request.post(`${API_URL}/api/chat`, {
      data: { message: "Find video moments that show the rabbit eating" },
    });
    expect(res.ok()).toBeTruthy();

    const body = await res.json();

    // Should have a response string
    expect(body.response).toBeTruthy();
    expect(typeof body.response).toBe("string");
    expect(body.response.length).toBeGreaterThan(50);

    // Should have a session_id
    expect(body.session_id).toBeTruthy();

    // Response should not be a generic error
    expect(body.response.toLowerCase()).not.toContain("i apologize");
    expect(body.response.toLowerCase()).not.toContain("i don't have access");
  });

  test("API: Cross-video prompt 1 returns quality response", async ({ request }) => {
    test.setTimeout(CHAT_TIMEOUT);

    const res = await request.post(`${API_URL}/api/chat`, {
      data: { message: "Which entities appear in more than one video?" },
    });
    expect(res.ok()).toBeTruthy();

    const body = await res.json();

    // Should have a response string
    expect(body.response).toBeTruthy();
    expect(typeof body.response).toBe("string");
    expect(body.response.length).toBeGreaterThan(50);

    // Should have a session_id
    expect(body.session_id).toBeTruthy();

    // Response should not be a generic error
    expect(body.response.toLowerCase()).not.toContain("i apologize");
    expect(body.response.toLowerCase()).not.toContain("i don't have access");
  });

  test("API: Cross-video prompt 2 returns quality response", async ({ request }) => {
    test.setTimeout(CHAT_TIMEOUT);

    const res = await request.post(`${API_URL}/api/chat`, {
      data: { message: "What connects the two clips to each other?" },
    });
    expect(res.ok()).toBeTruthy();

    const body = await res.json();

    // Should have a response string
    expect(body.response).toBeTruthy();
    expect(typeof body.response).toBe("string");
    expect(body.response.length).toBeGreaterThan(50);

    // Should have a session_id
    expect(body.session_id).toBeTruthy();

    // Response should not be a generic error
    expect(body.response.toLowerCase()).not.toContain("i apologize");
    expect(body.response.toLowerCase()).not.toContain("i don't have access");
  });

  test("API: Cross-video prompt 3 returns quality response", async ({ request }) => {
    test.setTimeout(CHAT_TIMEOUT);

    const res = await request.post(`${API_URL}/api/chat`, {
      data: { message: "Show me entities shared by both clips" },
    });
    expect(res.ok()).toBeTruthy();

    const body = await res.json();

    // Should have a response string
    expect(body.response).toBeTruthy();
    expect(typeof body.response).toBe("string");
    expect(body.response.length).toBeGreaterThan(50);

    // Should have a session_id
    expect(body.session_id).toBeTruthy();

    // Response should not be a generic error
    expect(body.response.toLowerCase()).not.toContain("i apologize");
    expect(body.response.toLowerCase()).not.toContain("i don't have access");
  });
});
