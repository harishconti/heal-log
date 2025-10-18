from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # 1. Navigate to the login page
    page.goto("http://localhost:8081/login")
    page.screenshot(path="jules-scratch/verification/login_page.png")

    # 2. Fill in the login form and click the login button
    page.get_by_placeholder("Email Address").fill("dr.sarah@clinic.com")
    page.get_by_placeholder("Password").fill("password123")
    page.get_by_role("button", name="Sign In").click()

    # 3. Wait for navigation to the main page and click the "Add Patient" button
    expect(page).to_have_url("http://localhost:8081/")
    page.get_by_role("button", name="add").click()

    # 4. Wait for navigation to the "Add Patient" screen and fill out the form
    expect(page).to_have_url("http://localhost:8081/add-patient")
    page.get_by_placeholder("Enter patient's full name").fill("John Doe")
    page.get_by_placeholder("Phone number").fill("1234567890")
    page.get_by_placeholder("Email address").fill("john.doe@example.com")
    page.get_by_placeholder("Patient's address").fill("123 Main St")
    page.get_by_placeholder("Describe the patient's initial complaint or symptoms...").fill("Fever and cough")
    page.get_by_placeholder("Enter initial diagnosis or assessment...").fill("Common cold")

    # 5. Take a screenshot of the form
    page.screenshot(path="jules-scratch/verification/verification.png")

    context.close()
    browser.close()

with sync_playwright() as playwright:
    run(playwright)