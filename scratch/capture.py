import asyncio
import base64
import json
import os
from playwright.async_api import async_playwright

BASE_URL = "http://localhost:5173"
SCREENSHOTS_DIR = "/Users/minh/Documents/Ky_2_nam_3/Se330/SE330/frontend-user/screenshots"

def get_mock_token(role):
    payload = json.dumps({"userType": role})
    b64_payload = base64.b64encode(payload.encode()).decode('utf-8')
    return f"mockHeader.{b64_payload}.mockSignature"

def get_mock_user(role):
    name = "Customer User" if role == "CUSTOMER" else "Staff User"
    return json.dumps({
        "id": 1,
        "fullName": name,
        "email": f"{role.lower()}@example.com",
        "phone": "0123456789"
    })

async def capture_role(page, role_name, token, user_json, paths):
    print(f"--- Capturing {role_name} ---")
    
    # Go to base url to set localStorage
    try:
        await page.goto(f"{BASE_URL}/", timeout=10000)
    except Exception as e:
        print(f"Error navigating to {BASE_URL}: {e}")
        return

    if token:
        # Escape quotes for evaluate
        user_json_escaped = user_json.replace("'", "\\'")
        await page.evaluate(f"""
            localStorage.setItem('authToken', '{token}');
            localStorage.setItem('user', '{user_json_escaped}');
        """)
    else:
        await page.evaluate("localStorage.clear();")
    
    # Reload to apply changes
    await page.reload()
    await page.wait_for_timeout(1000) # Wait for page loader

    for path in paths:
        print(f"Navigating to {path}...")
        try:
            await page.goto(f"{BASE_URL}{path}", timeout=10000)
            await page.wait_for_timeout(3000) # wait for animation/loading and any API calls (mocked or real)
            
            safe_path = path.replace('/', '_').strip('_')
            if not safe_path:
                safe_path = "home"
            filename = f"{role_name.lower()}_{safe_path}.png"
            
            await page.screenshot(path=os.path.join(SCREENSHOTS_DIR, filename), full_page=True)
            print(f"Captured {filename}")
        except Exception as e:
            print(f"Failed to capture {path}: {e}")

async def main():
    if not os.path.exists(SCREENSHOTS_DIR):
        os.makedirs(SCREENSHOTS_DIR)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 800})
        page = await context.new_page()

        # Guest
        guest_paths = ['/', '/contact', '/menu', '/register', '/login', '/forgotPass']
        await capture_role(page, "GUEST", None, None, guest_paths)

        # Customer
        customer_paths = ['/', '/contact', '/menu', '/booking', '/profile', '/changePass']
        await capture_role(page, "CUSTOMER", get_mock_token("CUSTOMER"), get_mock_user("CUSTOMER"), customer_paths)

        # Staff
        staff_paths = ['/', '/contact', '/menu', '/staff', '/profile']
        await capture_role(page, "STAFF", get_mock_token("STAFF"), get_mock_user("STAFF"), staff_paths)

        await browser.close()
        print("Done capturing screenshots.")

if __name__ == "__main__":
    asyncio.run(main())
