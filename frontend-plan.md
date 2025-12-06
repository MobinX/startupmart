# Frontend Development Plan - StartupMart

This document outlines the detailed plan for the frontend architecture, user journeys, page layouts, and component implementation for the StartupMart platform. We will be using **React**, **Vite**, **TanStack Router**, and **shadcn/ui**.

---

## 1. Core Principles & Tech Stack

-   **Framework**: React with Vite for a fast development experience.
-   **Routing**: **TanStack Router** for type-safe, search-param-driven routing, including file-based route generation.
-   **Data Fetching & State Management**: **TanStack Query** integrated with TanStack Router's `loader` functions for server-side data fetching and caching. Server actions will be used for mutations.
-   **UI Components**: **shadcn/ui** for a comprehensive, accessible, and customizable component library.
-   **Styling**: **Tailwind CSS** as the utility-first CSS framework, configured by `shadcn/ui`.
-   **Forms**: React Hook Form for managing complex forms, especially the multi-step startup creation form.
-   **Authentication**: Firebase Authentication on the client-side, with JWTs passed to the backend for session management via the auth middleware.

---

## 2. Theming and Styling

We will leverage `shadcn/ui`'s theming capabilities.

-   **Theme Configuration**: A base theme will be configured in `globals.css` using CSS variables for colors (primary, secondary, destructive, etc.), border radius, and fonts.
-   **Dark Mode**: Dark mode will be supported out-of-the-box by toggling a class on the `html` element.
-   **Layout Components**: We will primarily use Flexbox and CSS Grid for layouts. `shadcn/ui` components like `Card`, `Sheet`, and `Dialog` will provide structured containers.

---

## 3. Routing and Page Layout Strategy

All routes will be defined in the `src/routes` directory, following TanStack Router's file-based routing conventions.

### 3.1. Root Layout (`__root.tsx`)

This is the main application shell.

-   **Layout**: A vertical flex container (`flex flex-col min-h-screen`).
-   **Components**:
    -   `Header.tsx`: A persistent header component.
        -   **Shadcn Components**: `NavigationMenu`, `Button`.
        -   **Content**: Logo, navigation links (Home, Startups, Pricing), and a conditional "Login/Sign Up" button or a `UserNav` dropdown (Avatar, links to Dashboard, Logout).
    -   `<Outlet />`: Renders the matched child route.
    -   `Footer.tsx`: A simple footer with links and copyright.
-   **Authentication**: The root loader will check for a Firebase auth token, verify it with our backend (`/api/auth/verify`), and provide the `AuthUser` context to all child routes.

### 3.2. Route Structure

```
/
├── __root.tsx              # Main layout with Header/Footer
├── index.tsx               # Landing Page
├── login.tsx               # Login Page
├── signup.tsx              # Signup Page (multi-step: role selection -> credentials)
├── pricing.tsx             # Page showing plans for Investors and Startup Owners
|
├── dashboard.tsx           # Parent layout route for all /dashboard/* routes
├── dashboard/
│   ├── index.tsx           # /dashboard/
│   ├── owner.tsx           # /dashboard/owner
│   └── investor.tsx        # /dashboard/investor
│
├── startups.tsx            # Can serve as a layout for /startups/* if needed
├── startups/
│   ├── index.tsx           # /startups/
│   ├── $startupId.tsx      # /startups/:startupId
│   └── new.tsx             # /startups/new
│
├── favorites.tsx           # /favorites
├── profile.tsx             # /profile
|
└── (api)/                  # API routes are handled by the backend worker
```

---

## 4. User Journeys & Page Breakdowns

### 4.1. Public & Authentication Journey

#### **Page: `/` (Landing Page)**

-   **Purpose**: Marketing page to attract users.
-   **Layout**: A series of full-width sections.
-   **Shadcn Components**: `Button`, `Card` (for testimonials or features).
-   **Data**: Static content. No loader needed.

#### **Page: `/login`**

-   **Purpose**: User sign-in.
-   **Layout**: Centered card on the page.
-   **Shadcn Components**: `Card`, `CardHeader`, `CardTitle`, `CardContent`, `Input`, `Label`, `Button`.
-   **Server Functions**:
    -   **`action`**: A server action that takes email/password, uses Firebase client SDK to sign in, gets the JWT, and sends it to the backend `POST /api/auth/login` to set the session cookie. Redirects to `/dashboard` on success.

#### **Page: `/signup`**

-   **Purpose**: User registration.
-   **Layout**: A multi-step form within a centered `Card`.
    -   **Step 1**: Choose Role (`investor` or `startup_owner`). Uses `RadioGroup`.
    -   **Step 2**: Enter email/password and other details.
-   **Shadcn Components**: `Card`, `RadioGroup`, `Input`, `Label`, `Button`, `Stepper` (custom component).
-   **Server Functions**:
    -   **`action`**: A server action that takes all form data, creates the user with Firebase client SDK, and then calls our backend `POST /api/auth/register` to create the user record in our DB.

#### **Page: `/pricing`**

-   **Purpose**: Display subscription plans for both user types.
-   **Layout**: A grid or flex container showing `Card` components for each plan. A `Switch` to toggle between "Investor Plans" and "Startup Owner Plans".
-   **Shadcn Components**: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`, `Button`, `Switch`, `Check` (for feature lists).
-   **Data Loader**:
    -   **`loader`**: Fetches all plans from the backend using `planService.getAllPlans()`. The data can be filtered on the client based on the switch.

### 4.2. Startup Owner Journey

#### **Layout for Authenticated Routes (e.g., `/dashboard`)**

-   **Purpose**: Provides a shared layout structure (e.g., a dashboard with a sidebar) for a group of routes. This is achieved by creating a parent route that renders the shared UI and an `<Outlet />`.
-   **File Example**: A file at `src/routes/dashboard.tsx` can define the layout for all routes inside the `src/routes/dashboard/` directory (e.g., `index.tsx`, `owner.tsx`).
-   **Layout**: A two-column layout.
    -   **Sidebar**: Navigation for the dashboard (`/dashboard/owner`, `/dashboard/investor`, `/favorites`, etc.).
    -   **Main Content**: `<Outlet />` to render the specific child page.
-   **Shadcn Components**: `ResizablePanelGroup`, `NavigationMenu` (vertical).
-   **Data Loader**:
    -   **`loader`**: The loader on this parent `dashboard.tsx` route will ensure the user is authenticated. It can also fetch user-wide data like notifications or profile status before rendering any child routes.

#### **Page: `/dashboard/owner`**

-   **Purpose**: Central hub for a startup owner to view their startup's status.
-   **Layout**: A grid of cards displaying key information.
-   **Shadcn Components**: `Card`, `CardHeader`, `CardTitle`, `CardContent`, `Button`, `Progress`.
-   **Content & Data**:
    -   A card showing their own startup's summary. If they have no startup, show a prominent "Create Your Startup" `Button` linking to `/startups/new`.
    -   A "Views" card showing the `viewCount`.
    -   A "Profile Completion" progress bar.
-   **Data Loader**:
    -   **`loader`**: Fetches the startup owned by the current user. Calls `startupService.getStartupById` for their own startup.

#### **Page: `/startups/new` & `/startups/$startupId/edit`**

-   **Purpose**: A comprehensive form to create or edit a startup profile.
-   **Layout**: A multi-step form with a sidebar for navigation between sections.
    -   **Sections**: Startup, Financials, Traction, Sales & Marketing, etc., matching `createStartupSchema`.
-   **Shadcn Components**: `Tabs` (for sections), `Input`, `Checkbox`, `Textarea`, `Label`, `Button`.
-   **Server Functions**:
    -   **`loader` (for edit page)**: Fetches the full startup data using `startupService.getStartupById`.
    -   **`action`**: A server action that validates the form data against `createStartupSchema` or `updateStartupSchema` and calls the corresponding `startupService` method (`createStartup` or `updateStartup`).

### 4.3. Investor Journey

#### **Page: `/dashboard/investor`**

-   **Purpose**: Central hub for an investor.
-   **Layout**: A grid of cards.
-   **Shadcn Components**: `Card`, `CardHeader`, `CardTitle`, `CardContent`, `Button`.
-   **Content & Data**:
    -   A card summarizing their activity (e.g., "You have X favorites").
    -   A link/button to the "My Favorites" page.
    -   A link/button to "Discover Startups".
    -   A card showing their current subscription plan and what it allows.
-   **Data Loader**:
    -   **`loader`**: Fetches user stats and their current plan using `userService.getUserStats()` and `planService.getUserPlans()`.

#### **Page: `/startups` (Startup Discovery)**

-   **Purpose**: Allow investors to browse, search, and filter startups.
-   **Layout**:
    -   **Sidebar**: Filters for industry, team size, etc.
    -   **Main Content**: A grid of `StartupCard` components.
-   **Shadcn Components**: `Card`, `Input` (for search), `Select` (for filters), `Checkbox`, `Button`.
-   **Data Loader**:
    -   **`loader`**: Fetches a list of public startups using `startupService.getPublicStartups()`. The `filters` from the URL search params will be passed directly to this loader. The page will be interactive, updating the search params on filter changes, which will trigger a re-fetch.

#### **Page: `/startups/$startupId` (Detailed View)**

-   **Purpose**: Display the full profile of a single startup.
-   **Layout**: A detailed view, possibly using `Tabs` to separate the different sections of the startup's profile.
-   **Shadcn Components**: `Tabs`, `Card`, `Table`, `Badge`.
-   **Content & Gating**:
    -   Displays all information fetched from the loader.
    -   Conditionally renders fields or entire sections based on the `allowedFields` array returned by the loader. If a field is not present in the returned `startup` object, it's not rendered.
    -   A "Favorite" button (`Heart` icon).
-   **Data Loader**:
    -   **`loader`**: Calls `startupService.getStartupById(startupId, user)`. The service on the backend handles the authorization and filtering of fields based on the user's plan.
-   **Server Functions**:
    -   **`action`**: A server action for the "Favorite" button that calls `favoritesService.addFavorite` or `favoritesService.removeFavorite`.

#### **Page: `/favorites`**

-   **Purpose**: Show a list of all startups an investor has favorited.
-   **Layout**: A simple list or grid of `StartupCard` components.
-   **Shadcn Components**: `Card`, `Button`.
-   **Data Loader**:
    -   **`loader`**: Fetches the user's favorites using `favoritesService.getFavorites(userId)`.
