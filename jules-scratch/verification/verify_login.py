from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        page.goto("http://localhost:8081")
        page.fill('input[type="email"]', "dr.sarah@clinic.com")
        page.fill('input[type="password"]', "password123")
        page.click('div[role="button"]:has-text("Sign In")')
        page.wait_for_selector("text=Patients", timeout=10000)
        page.screenshot(path="jules-scratch/verification/verification.png")
    except Exception as e:
        print(f"An error occurred: {e}")
        page.screenshot(path="jules-scratch/verification/error.png")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
