# -*- coding: utf-8 -*-
"""Generate two separate PDFs - one per teammate."""

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    ListFlowable,
    ListItem,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

BASE = Path(__file__).resolve().parent.parent.parent

ACCENT = colors.HexColor("#2563EB")
GREEN = colors.HexColor("#16A34A")
ORANGE = colors.HexColor("#EA580C")
GREY = colors.HexColor("#6B7280")
LIGHT = colors.HexColor("#EFF6FF")
DARK = colors.HexColor("#111827")

styles = getSampleStyleSheet()
title = ParagraphStyle("TitleX", parent=styles["Title"], fontSize=20, textColor=ACCENT, spaceAfter=6)
subtitle = ParagraphStyle("Sub", parent=styles["Normal"], fontSize=10.5, textColor=GREY, spaceAfter=16)
h1 = ParagraphStyle("H1", parent=styles["Heading1"], fontSize=14, textColor=colors.white, spaceBefore=0, spaceAfter=0)
h2 = ParagraphStyle("H2", parent=styles["Heading2"], fontSize=12, textColor=ACCENT, spaceBefore=10, spaceAfter=6)
body = ParagraphStyle("Body", parent=styles["Normal"], fontSize=10, leading=15)
small = ParagraphStyle("Small", parent=styles["Normal"], fontSize=8.5, textColor=GREY, leading=12)


def section_header(text, color=ACCENT):
    t = Table([[Paragraph(text, h1)]], colWidths=[170 * mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), color),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("ROUNDEDCORNERS", [6, 6, 6, 6]),
    ]))
    return t


def check_list(items):
    return ListFlowable(
        [ListItem(Paragraph(i, body), value="\u2610") for i in items],
        bulletType="bullet",
        bulletColor=GREY,
        leftIndent=12,
    )


def new_doc(path, title_str):
    return SimpleDocTemplate(
        str(path), pagesize=A4,
        leftMargin=20 * mm, rightMargin=20 * mm, topMargin=18 * mm, bottomMargin=18 * mm,
        title=title_str, author="Smart Canteen Team",
    )


def shared_rules(story):
    story.append(Spacer(1, 8))
    story.append(section_header("Shared Rules", DARK))
    story.append(Spacer(1, 8))
    story.append(Paragraph("Code conventions", h2))
    story.append(check_list([
        "Layered architecture: schemas -> repositories -> services -> routers. Keep business logic out of routers.",
        "No comments in code unless truly necessary; follow the style of existing files.",
        "Routers use APIRouter with explicit tags and response_model.",
        "Never expose hashed_password or internal fields in responses.",
        "Auth dependencies: app.api.deps.get_current_user / get_current_admin.",
    ]))
    story.append(Spacer(1, 6))
    story.append(Paragraph("Error handling", h2))
    story.append(check_list([
        "404 for missing resources, 403 for unauthorized roles, 409 for conflicts.",
        "Raise HTTPException in services with clear detail messages.",
        "Validate with pydantic schemas (min_length, ge=0 for money/quantities).",
    ]))
    story.append(Spacer(1, 6))
    story.append(Paragraph("Testing & delivery", h2))
    story.append(check_list([
        "Add tests under tests/ (see tests/test_auth.py as template, incl. cleanup of test rows).",
        "All tests must pass: backend\\venv\\Scripts\\python.exe -m pytest tests -v",
        "Commit and push your branch, then report the endpoints you implemented.",
    ]))
    story.append(Spacer(1, 10))
    story.append(Paragraph("Generated for the Smart Canteen team - Phase 2 workstreams.", small))


# ===================== STEP 1 =====================
doc1 = new_doc(BASE / "Step1_Menu_Category_CRUD_Member1.pdf", "Step 1 - Menu & Category CRUD")
s = []
s.append(Paragraph("Step 1 - Menu & Category CRUD", title))
s.append(Paragraph("Assigned to: <b>Team Member 1</b>  |  Status: Todo list", subtitle))
s.append(section_header("Goal", GREEN))
s.append(Spacer(1, 8))
s.append(Paragraph(
    "Build RESTful CRUD endpoints for categories and menu items. Admin users manage the menu; customers can read it. "
    "Follow the existing layered pattern: schemas -> repository -> service -> router.",
    body,
))
s.append(Spacer(1, 8))
s.append(section_header("Files to create / modify", GREEN))
s.append(Spacer(1, 8))
s.append(check_list([
    "<b>app/schemas/menu.py</b> - CategoryCreate/Update/Out, MenuItemCreate/Update/Out (validation: price >= 0, stock >= 0, min_length on names).",
    "<b>app/repositories/menu_repository.py</b> - CRUD helpers for Category and MenuItem.",
    "<b>app/services/menu_service.py</b> - business logic (409 on duplicate category name, 404 if not found).",
    "<b>app/api/v1/menu.py</b> - router with prefixes <font face='Courier'>/categories</font> and <font face='Courier'>/menu-items</font>.",
    "<b>app/api/v1/__init__.py</b> - register your new router.",
]))
s.append(Spacer(1, 8))
s.append(section_header("Endpoints to implement", GREEN))
s.append(Spacer(1, 8))
s.append(check_list([
    "GET /categories - public, returns all categories with their menu items.",
    "POST /categories - admin only (depend on get_current_admin).",
    "GET /categories/{id} - public, 404 if missing.",
    "PATCH /categories/{id} - admin only.",
    "DELETE /categories/{id} - admin only, cascades to menu items.",
    "GET /menu-items - public, optional filters: ?category_id= & ?is_available=true.",
    "POST /menu-items - admin only, validates category exists.",
    "GET /menu-items/{id} - public, 404 if missing.",
    "PATCH /menu-items/{id} - admin only.",
    "DELETE /menu-items/{id} - admin only.",
]))
s.append(Spacer(1, 8))
s.append(section_header("Hints", GREEN))
s.append(Spacer(1, 8))
s.append(check_list([
    "Reuse app.api.deps.get_current_user / get_current_admin.",
    "Keep image_url nullable.",
    "Use response_model=CategoryOut so relations never leak.",
    "Models already exist in the DB - import from app.models.",
]))
s.append(Spacer(1, 8))
s.append(section_header("Verification", GREEN))
s.append(Spacer(1, 8))
s.append(Paragraph(
    "Create a category, then a menu item under it, update its price, list with the category filter, delete it, "
    "and confirm the same flow returns 404 afterwards. Register an admin user in the DB (role='admin') or temporarily "
    "promote one to test the admin endpoints. Run the full test suite: "
    "<font face='Courier'>backend\\venv\\Scripts\\python.exe -m pytest tests -v</font>",
    body,
))
shared_rules(s)
doc1.build(s)

# ===================== STEP 2 =====================
doc2 = new_doc(BASE / "Step2_Order_Inventory_Member2.pdf", "Step 2 - Order & Inventory")
s2 = []
s2.append(Paragraph("Step 2 - Order & Inventory Endpoints", title))
s2.append(Paragraph("Assigned to: <b>Team Member 2</b>  |  Status: Todo list", subtitle))
s2.append(section_header("Goal", ORANGE))
s2.append(Spacer(1, 8))
s2.append(Paragraph(
    "Build the ordering flow: a customer creates an order with items, the total is computed server-side, "
    "and inventory stock is deducted. Also expose inventory management endpoints for the admin.",
    body,
))
s2.append(Spacer(1, 8))
s2.append(section_header("Files to create / modify", ORANGE))
s2.append(Spacer(1, 8))
s2.append(check_list([
    "<b>app/schemas/order.py</b> - OrderItemIn (menu_item_id, quantity >= 1), OrderCreate (list of items), OrderItemOut, OrderOut (with computed total).",
    "<b>app/repositories/order_repository.py</b> - CRUD + queries for orders and order items.",
    "<b>app/services/order_service.py</b> - totals, stock validation, stock deduction, order status transitions.",
    "<b>app/api/v1/orders.py</b> - router with prefix <font face='Courier'>/orders</font>.",
    "<b>app/api/v1/inventory.py</b> - router with prefix <font face='Courier'>/inventory</font>.",
    "<b>app/api/v1/__init__.py</b> - register both routers.",
]))
s2.append(Spacer(1, 8))
s2.append(section_header("Endpoints to implement", ORANGE))
s2.append(Spacer(1, 8))
s2.append(check_list([
    "POST /orders - customer only (current user): creates order + items, computes total, checks stock, deducts stock.",
    "GET /orders - customers see their own orders only; admins see all.",
    "GET /orders/{id} - owner or admin only, 404 if missing, 403 if not allowed.",
    "PATCH /orders/{id}/status - admin only; statuses: pending, confirmed, completed, cancelled.",
    "GET /inventory - admin only, lists stock per menu item.",
    "PATCH /inventory/{menu_item_id} - admin only, sets or adds stock (restock).",
]))
s2.append(Spacer(1, 8))
s2.append(section_header("Hints", ORANGE))
s2.append(Spacer(1, 8))
s2.append(check_list([
    "Reject the whole order with 409 if any item is out of stock (rollback, no partial deduction).",
    "Compute prices from menu_items.price at order time - never trust client prices.",
    "Commit once, at the end, after all stock updates succeed (single transaction).",
    "Use selectinload / eager loading for order items to avoid N+1 queries.",
]))
s2.append(Spacer(1, 8))
s2.append(section_header("Verification", ORANGE))
s2.append(Spacer(1, 8))
s2.append(Paragraph(
    "Create a menu item with stock=5, place an order for quantity 2, confirm stock becomes 3, total equals 2 x price. "
    "Order 10 more -> expect 409 and stock unchanged (still 3). Complete the flow to 'completed'. "
    "A non-owner user must get 403 on GET /orders/{id}. Run the full test suite: "
    "<font face='Courier'>backend\\venv\\Scripts\\python.exe -m pytest tests -v</font>",
    body,
))
shared_rules(s2)
doc2.build(s2)

print(f"PDF 1: {BASE / 'Step1_Menu_Category_CRUD_Member1.pdf'}")
print(f"PDF 2: {BASE / 'Step2_Order_Inventory_Member2.pdf'}")
