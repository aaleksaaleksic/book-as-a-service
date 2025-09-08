package me.remontada.readify.model;

public enum Permission {
    // User Management
    CAN_CREATE_USERS,
    CAN_READ_USERS,
    CAN_UPDATE_USERS,
    CAN_DELETE_USERS,

    // Book Management
    CAN_CREATE_BOOKS,
    CAN_READ_BOOKS,
    CAN_UPDATE_BOOKS,
    CAN_DELETE_BOOKS,

    // Subscription Management
    CAN_SUBSCRIBE,
    CAN_VIEW_SUBSCRIPTION,
    CAN_CANCEL_SUBSCRIPTION,

    // Reading Permissions
    CAN_READ_PREMIUM_BOOKS,
    CAN_DOWNLOAD_BOOKS, // FALSE

    // Admin Permissions
    CAN_VIEW_ANALYTICS,
    CAN_MANAGE_PAYMENTS,
    CAN_MODERATE_CONTENT
}