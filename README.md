# Artiste Restaurant Management System

A comprehensive, full-stack restaurant management system designed to streamline operations for customers, staff, kitchen, and administration.

## Key Features

### For Customers
- **Online Reservation**: Book tables in advance with a smart recommendation system.
- **Digital Menu**: Browse the restaurant's offerings seamlessly.
- **Loyalty Program**: Earn and redeem reward points.
- **Order Tracking**: View order history and ongoing orders.

### For Staff & Kitchen
- **Table Management**: Real-time tracking of table status (available, occupied, cleaning).
- **Order Processing**: Efficiently take and manage orders from customers.
- **Kitchen Display System (KDS)**: Receive real-time ticket updates for meal preparation and notify waiters once the food is ready.

### For Management & Administration
- **Dashboard & Analytics**: Track revenue, sales, and restaurant performance.
- **Menu Management**: Manage categories, food items, and pricing.
- **Vouchers & Promotions**: Create and manage discount campaigns.
- **User Management**: Role-based access control for employees (Staff, Cashier, Kitchen, Manager, Admin).

## Tech Stack

### Backend
- **Framework**: Java 17, Spring Boot 3
- **Security**: Spring Security, JWT (JSON Web Tokens)
- **Database**: PostgreSQL
- **Real-time Communication**: WebSockets (for KDS)
- **Payment Integration**: VNPay API

### Frontend
- **Frontend Admin**: Next.js, React, Tailwind CSS, Ant Design
- **Frontend User**: React, Vite

## Project Structure

This project is a Monorepo containing the following main directories:

```
restaurant-services-management-website/
├── backend/            # Spring Boot backend API
├── frontend-admin/     # Next.js admin & staff portal
└── frontend-user/      # React/Vite customer portal
```

## Installation & Setup

### Prerequisites
- **Java**: JDK 17
- **Node.js**: v18 or later
- **Database**: PostgreSQL
- **Build Tool**: Maven 3.9+

### Backend Setup
1. Open the `backend/` directory.
2. Ensure your PostgreSQL database is running.
3. Configure the database credentials in `backend/src/main/resources/application-dev.yaml` (or set up environment variables).
4. Run the backend server using Maven:
   ```bash
   cd backend
   ./mvnw spring-boot:run
   ```
   > **Note**: Swagger API documentation will be available at `http://localhost:8080/swagger-ui.html` once the server is running.

### Frontend Admin Setup
1. Open the `frontend-admin/` directory.
2. Install dependencies:
   ```bash
   cd frontend-admin
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

### Frontend User Setup
1. Open the `frontend-user/` directory.
2. Install dependencies:
   ```bash
   cd frontend-user
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```