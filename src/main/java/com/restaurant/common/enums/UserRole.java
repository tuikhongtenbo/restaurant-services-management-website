package com.restaurant.common.enums;

public enum UserRole {
    ADMIN("ADMIN"),
    MANAGER("MANAGER"),
    WAITER("WAITER"),
    CASHIER("CASHIER"),
    KITCHEN_STAFF("KITCHEN_STAFF"),
    CUSTOMER("CUSTOMER");

    public final String roleName;

    UserRole(String roleName) {
        this.roleName = roleName;
    }
}
