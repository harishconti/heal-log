
from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto("http://localhost:8081")

    # Wait for the email input field to be visible
    email_input = page.locator('input[placeholder="Enter your email"]')
    expect(email_input).to_be_visible(timeout=60000)

    # Fill in the email and password
    email_input.fill("dr.sarah@clinic.com")
    page.locator('input[placeholder="Enter your password"]').fill("password123")

    # Click the login button
    login_button = page.locator('div[role="button"]:has-text("Login")')
    login_button.click()

    # Wait for the dashboard to load by checking for a known element
    dashboard_header = page.locator('text="Dashboard"')
    expect(dashboard_header).to_be_visible(timeout=60000)

    # Take a screenshot of the dashboard
    page.screenshot(path="jules-scratch/verification/login_verification.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
