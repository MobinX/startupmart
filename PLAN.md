# Project Development Plan

This document outlines the step-by-step plan to build the startup investment platform.

---

### Phase 1: Project Setup & Database (Completed)

- [x] **1.1: Define Database Schema:** Documented in `db_schema.md`.
- [x] **1.2: Set up Drizzle ORM:** Installed and configured Drizzle.
- [x] **1.3: Create Initial Database Migrations:** Generated and applied migrations to Cloudflare D1.
- [ ] **1.4: Seed Database with Initial Data (Optional):** We can add this later if needed for testing.

---

### Phase 2: User Authentication & Profiles

This phase focuses on allowing users to sign up, log in, and manage a basic profile.

- [ ] **2.1: Implement User Endpoints:**
    - Create a `POST /api/auth/register` endpoint for user sign-up.
    - Create a `POST /api/auth/login` endpoint for user sign-in.
- [ ] **2.2: Implement Authentication Middleware:**
    - Create server-side middleware to protect routes and identify the current user.
- [ ] **2.3: Build Authentication UI:**
    - Create frontend routes and components for Sign Up and Sign In pages.
- [ ] **2.4: Build User Profile UI:**
    - Create a basic "My Profile" page where users can view their information.

---

### Phase 3: Startup Profile Management

This phase enables `startup_owner` users to create and manage their business profiles.

- [ ] **3.1: Implement Startup CRUD API:**
    - Create API endpoints (`POST`, `GET`, `PUT`, `DELETE`) for managing startup profiles and all their associated data (financials, traction, etc.).
- [ ] **3.2: Build Startup Creation/Editing Form:**
    - Develop a multi-step form on the frontend to guide owners through filling out their comprehensive profile.
- [ ] **3.3: Build Startup Owner Dashboard:**
    - Create a dashboard where owners can view their own startup's profile and see key metrics.
- [ ] **3.4: Implement View Counter:**
    - Display the total number of views their startup has received on their dashboard.

---

### Phase 4: Investor Features

This phase builds the core experience for `investor` users.

- [ ] **4.1: Implement Startup Discovery API:**
    - Create a `GET /api/startups` endpoint to list all public startups, with support for pagination and filtering.
- [ ] **4.2: Build Startup Listing Page:**
    - Create a UI to display a gallery or list of startups.
- [ ] **4.3: Build Detailed Startup View Page:**
    - Create a UI to display the full, detailed profile of a single startup.
- [ ] **4.4: Implement "Favorites" Feature:**
    - Create `POST /api/startups/:id/favorite` and `DELETE /api/startups/:id/favorite` endpoints.
    - Add a "Favorite" button to the startup UI.
- [ ] **4.5: Build "My Favorites" Page:**
    - Create a page for investors to see all the startups they have favorited.
- [ ] **4.6: Implement View Tracking:**
    - When an investor views a startup, record the view in the `STARTUP_VIEWS` table.

---

### Phase 5: Monetization & Payments

This phase integrates payments for premium features.

- [ ] **5.1: Integrate Payment Gateway:**
    - Set up a payment provider (e.g., Stripe) and configure it on the server.
- [ ] **5.2: Implement Payment API:**
    - Create endpoints to handle payment intent creation and webhook notifications from the payment provider.
- [ ] **5.3: Build Payment Flows:**
    - Create the UI and logic for both startup owners (to pay for a listing) and investors (to pay for premium access).
- [ ] **5.4: Implement Gated Content:**
    - On the backend, check a user's payment status before returning sensitive information like startup owner contacts.
    - On the frontend, conditionally display this information.

---

### Phase 6: Deployment & Finalization

This phase covers testing and final deployment.

- [ ] **6.1: Write Tests:**
    - Implement unit and integration tests for critical API endpoints and user flows.
- [ ] **6.2: Set Up CI/CD:**
    - Configure a CI/CD pipeline (e.g., using GitHub Actions) to automate testing and deployment to Cloudflare.
- [ ] **6.3: Production Deployment:**
    - Run the final deployment to the production environment.
- [ ] **6.4: End-to-End Testing:**
    - Thoroughly test all features on the live production site.
