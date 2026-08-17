from fastapi import APIRouter

from app.api import (
    category,
    inventory,
    menu,
    order,
    dashboard,
    payment,
    notification,
    staff,
    staff_attendance,
    activity,
)

from app.api.v1 import (
    auth,
    users,
    email_test,
    notification_ws,
)
from app.api import activity_ws
from fastapi import APIRouter

from app.api import (
    category,
    inventory,
    menu,
    order,
    dashboard,
    payment,
    notification,
    activity,
)

from app.api.v1 import (
    auth,
    users,
    email_test,
    notification_ws,
)


api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(order.router)
api_router.include_router(category.router)
api_router.include_router(menu.router)
api_router.include_router(inventory.router)
api_router.include_router(dashboard.router)
api_router.include_router(payment.router)
api_router.include_router(notification.router)
api_router.include_router(email_test.router)
api_router.include_router(notification_ws.router)
api_router.include_router(activity.router)
api_router = APIRouter()

api_router.include_router(
    activity_ws.router
)

# ============================================================
# AUTH
# ============================================================

api_router.include_router(
    auth.router
)


# ============================================================
# USERS
# ============================================================

api_router.include_router(
    users.router
)


# ============================================================
# ORDERS
# ============================================================

api_router.include_router(
    order.router
)


# ============================================================
# CATEGORIES
# ============================================================

api_router.include_router(
    category.router
)


# ============================================================
# MENU
# ============================================================

api_router.include_router(
    menu.router
)


# ============================================================
# INVENTORY
# ============================================================

api_router.include_router(
    inventory.router
)


# ============================================================
# DASHBOARD
# ============================================================

api_router.include_router(
    dashboard.router
)


# ============================================================
# PAYMENT
# ============================================================

api_router.include_router(
    payment.router
)


# ============================================================
# NOTIFICATIONS
# ============================================================

api_router.include_router(
    notification.router
)


# ============================================================
# EMAIL TEST
# ============================================================

api_router.include_router(
    email_test.router
)


# ============================================================
# NOTIFICATION WEBSOCKET
# ============================================================

api_router.include_router(
    notification_ws.router
)


# ============================================================
# STAFF
# ============================================================

api_router.include_router(
    staff.router
)


# ============================================================
# STAFF ATTENDANCE
# ============================================================

api_router.include_router(
    staff_attendance.router
)

# ============================================================
# ACTIVITY LOG
# ============================================================

api_router.include_router(
    activity.router
)