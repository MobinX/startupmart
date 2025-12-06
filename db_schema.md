# Database Schema

This document outlines the database schema for the startup investment platform.

## ERD (Entity Relationship Diagram)

```mermaid
erDiagram
    USERS ||--o{ STARTUPS : "owns"
    USERS ||--o{ PAYMENTS : "makes"
    USERS ||--o{ FAVORITES : "has"
    USERS ||--o{ USER_PLANS : "subscribes"
    PLANS ||--o{ USER_PLANS : "has"
    STARTUPS ||--o{ PAYMENTS : "receives"
    STARTUPS ||--o{ STARTUP_VIEWS : "has"
    STARTUPS ||--|{ STARTUP_FINANCIALS : "has"
    STARTUPS ||--|{ STARTUP_TRACTION : "has"
    STARTUPS ||--|{ STARTUP_SALES_MARKETING : "has"
    STARTUPS ||--|{ STARTUP_OPERATIONAL : "has"
    STARTUPS ||--|{ STARTUP_LEGAL : "has"
    STARTUPS ||--|{ STARTUP_ASSETS : "has"
    USERS {
        int id PK
        string email UK
        string firebase_uid UK
        string auth_provider "google, facebook, github, apple"
        string role "startup_owner, investor"
        string current_pricing_plan "free, premium"
        timestamp created_at
    }
    PLANS {
        int id PK
        string name
        string plan_for "investor, startup_owner"
        json allowed_fields "array of field names"
        decimal price
        string description
        timestamp created_at
    }
    USER_PLANS {
        int id PK
        int user_id FK
        int plan_id FK
        boolean is_active
        timestamp started_at
        timestamp expires_at
    }
    STARTUPS {
        int id PK
        int user_id FK
        string name
        string industry
        int year_founded
        string description
        string website_link
        string founder_background
        int team_size
        boolean sell_equity
        boolean sell_business
        string reason_for_selling
        string desired_buyer_profile
        decimal asking_price
        timestamp created_at
    }
    STARTUP_FINANCIALS {
        int id PK
        int startup_id FK
        json monthly_revenue
        json annual_revenue
        decimal monthly_profit_loss
        decimal gross_margin
        decimal operational_expense
        decimal cash_runway
        decimal funding_raised
        decimal valuation_expectation
    }
    STARTUP_TRACTION {
        int id PK
        int startup_id FK
        int total_customers
        int monthly_active_customers
        decimal customer_growth_yoy
        decimal customer_retention_rate
        decimal churn_rate
        string major_clients
        int completed_orders
    }
    STARTUP_SALES_MARKETING {
        int id PK
        int startup_id FK
        string sales_channels
        decimal cac
        decimal ltv
        string marketing_platforms
        decimal conversion_rate
    }
    STARTUP_OPERATIONAL {
        int id PK
        int startup_id FK
        string supply_chain_model
        decimal cogs
        string average_delivery_time
        string inventory_data
    }
    STARTUP_LEGAL {
        int id PK
        int startup_id FK
        string trade_license_number
        string tax_id
        string verified_phone
        string verified_email
        string ownership_documents_link
        string nda_financials_link
    }
    STARTUP_ASSETS {
        int id PK
        int startup_id FK
        string domain_ownership
        string patents_or_copyrights
        string source_code_link
        string software_infrastructure
        string social_media_handles
    }
    PAYMENTS {
        int id PK
        int user_id FK
        int startup_id FK
        string plan_type "investor_premium, startup_listing"
        decimal amount
        string status "succeeded, failed"
        string transaction_id
        timestamp created_at
    }
    FAVORITES {
        int id PK
        int user_id FK
        int startup_id FK
        timestamp created_at
    }
    STARTUP_VIEWS {
        int id PK
        int user_id FK
        int startup_id FK
        timestamp created_at
    }
    STARTUP_CONTACTS {
        int id PK
        int startup_id FK
        string contact_email
        string contact_phone
    }
```

## Table Definitions

### `USERS`

Stores user information for both startup owners and investors.

-   `id`: Primary Key
-   `email`: Unique email for login.
-   `firebase_uid`: Unique Firebase user ID.
-   `auth_provider`: Authentication provider (`google`, `facebook`, `github`, or `apple`).
-   `role`: User role (`startup_owner` or `investor`).
-   `current_pricing_plan`: The user's current subscription plan (`free` or `premium`). Defaults to `free`.
-   `created_at`: Timestamp of user creation.

### `STARTUPS`

Core information about each startup.

-   `id`: Primary Key
-   `user_id`: Foreign Key to `USERS` (the owner).
-   `name`: Startup name.
-   ... (all fields from "Basic Business Overview" and "What They Want")

### `STARTUP_FINANCIALS`

-   `id`: Primary Key
-   `startup_id`: Foreign Key to `STARTUPS`.
-   ... (all fields from "Financials")

### `STARTUP_TRACTION`

-   `id`: Primary Key
-   `startup_id`: Foreign Key to `STARTUPS`.
-   ... (all fields from "Traction Metrics")

### `STARTUP_SALES_MARKETING`

-   `id`: Primary Key
-   `startup_id`: Foreign Key to `STARTUPS`.
-   ... (all fields from "Sales & Marketing")

### `STARTUP_OPERATIONAL`

-   `id`: Primary Key
-   `startup_id`: Foreign Key to `STARTUPS`.
-   ... (all fields from "Operational Data")

### `STARTUP_LEGAL`

-   `id`: Primary Key
-   `startup_id`: Foreign Key to `STARTUPS`.
-   ... (all fields from "Legal & Verification")

### `STARTUP_ASSETS`

-   `id`: Primary Key
-   `startup_id`: Foreign Key to `STARTUPS`.
-   ... (all fields from "Company Assets")

### `PAYMENTS`

Tracks all payments made on the platform.

-   `id`: Primary Key
-   `user_id`: Foreign Key to `USERS` (who made the payment).
-   `startup_id`: Foreign Key to `STARTUPS` (if payment is for a specific startup listing).
-   `plan_type`: The type of plan purchased.
-   `amount`: Payment amount.
-   `status`: Payment status.
-   `transaction_id`: From the payment gateway.
-   `created_at`: Timestamp of payment.

### `FAVORITES`

Tracks which startups an investor has favorited.

-   `id`: Primary Key
-   `user_id`: Foreign Key to `USERS` (the investor).
-   `startup_id`: Foreign Key to `STARTUPS` (the favorited startup).
-   `created_at`: Timestamp of when it was favorited.

### `STARTUP_VIEWS`

Tracks views on startup profiles.

-   `id`: Primary Key
-   `user_id`: Foreign Key to `USERS` (the viewer).
-   `startup_id`: Foreign Key to `STARTUPS` (the viewed startup).
-   `created_at`: Timestamp of the view.

### `STARTUP_CONTACTS`

Stores the private contact information for startups, accessible only to premium investors.

-   `id`: Primary Key
-   `startup_id`: Foreign Key to `STARTUPS`.
-   `contact_email`: The private contact email for the startup.
-   `contact_phone`: The private contact phone for the startup.

### `PLANS`

Defines subscription plans that control access to different startup data fields.

-   `id`: Primary Key
-   `name`: The name of the plan (e.g., "Basic Investor", "Premium Investor").
-   `plan_for`: Target user type (`investor` or `startup_owner`).
-   `allowed_fields`: JSON array of field identifiers that this plan grants access to. Possible values include:
    - Section-level: `startup`, `financials`, `traction`, `salesMarketing`, `operational`, `legal`, `assets`, `contacts`
    - Field-level: `startupMarketing`, `startupProfit`, `startupRevenue`, `startupValuation`, `startupCustomers`, `startupGrowth`
-   `price`: The price of the plan.
-   `description`: A description of what the plan offers.
-   `created_at`: Timestamp of plan creation.

### `USER_PLANS`

Links users to their subscribed plans.

-   `id`: Primary Key
-   `user_id`: Foreign Key to `USERS`.
-   `plan_id`: Foreign Key to `PLANS`.
-   `is_active`: Whether the plan subscription is currently active.
-   `started_at`: Timestamp of when the subscription started.
-   `expires_at`: Timestamp of when the subscription expires (nullable for lifetime plans).