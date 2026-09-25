# Product Admin Dashboard

A responsive product administration dashboard built with Next.js, React, Tailwind CSS, and Axios using the DummyJSON API.

The application provides authenticated product management with search, category filtering, sorting, pagination, product details, and CRUD operations.

## Features

### Authentication

* Login using the DummyJSON authentication API
* Protected product management pages
* Access token stored in localStorage
* Automatic token attachment through Axios interceptor
* Centralized handling of unauthorized API responses
* Logout functionality
* Login validation
* Login loading state
* Duplicate login request prevention

### Product Management

* View products in a responsive table on desktop
* View products as cards on mobile
* Display product image, title, category, price, rating, and stock
* View detailed product information
* View product images and reviews
* Add products
* Edit products
* Delete products
* Product form validation
* Delete confirmation

### Search, Filter and Sort

* Debounced product search
* Category filtering
* Search and category filtering together
* Sort by:

  * Price
  * Rating
  * Title
* Ascending and descending sorting

### Pagination

* Page number navigation
* Previous and Next buttons
* Page sizes of 10, 20, and 50
* Result range display
* Pagination works with search and filtering

### URL State

The following dashboard values are stored in the URL query parameters:

* Page
* Page size
* Search
* Category
* Sort field
* Sort order

This allows the current dashboard state to remain available after refreshing the page or sharing the URL.

### Persistence

DummyJSON provides simulated CRUD operations rather than permanent database persistence.

To provide a consistent dashboard experience, localStorage is used to preserve:

* Created products
* Updated products
* Deleted product IDs

This allows product changes to remain available after refreshing the application.

### Error and Loading Handling

* Product loading states
* Product details loading state
* Empty search results
* Invalid product handling
* API error handling
* Unauthorized request handling
* Protection against stale search responses
* Retry handling where applicable

## Tech Stack

* Next.js 16
* React 19
* Tailwind CSS
* Axios
* JavaScript
* DummyJSON API
* Browser localStorage

## Project Structure

```text
product-admin-dashboard/
├── app/
│   ├── login/
│   │   └── page.js
│   ├── products/
│   │   ├── [id]/
│   │   │   └── page.js
│   │   └── page.js
│   ├── globals.css
│   ├── layout.js
│   └── page.js
├── lib/
│   └── axios.js
├── services/
│   └── authService.js
├── public/
├── package.json
├── package-lock.json
└── README.md
```

## Getting Started

### Prerequisites

Make sure you have Node.js and npm installed.

### 1. Clone the repository

```bash
git clone https://github.com/Sohamk1309/Product-Admin-Dashboard.git
cd product-admin-dashboard
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Login Credentials

The application uses DummyJSON's test authentication credentials.

```text
Username: emilys
Password: emilyspass
```

## API

The application uses:

```text
https://dummyjson.com
```

Main endpoints include:

```text
POST /auth/login

GET /products

GET /products/search?q=

GET /products/categories

GET /products/:id

POST /products/add

PUT /products/:id

DELETE /products/:id
```

## Implementation Details

### Shared Axios Configuration

A shared Axios instance is defined in `lib/axios.js`.

The request interceptor automatically attaches the stored access token to API requests.

The response interceptor handles unauthorized responses by removing the stored token and redirecting the user to the login page.

### Authentication Service

Authentication API logic is separated into:

```text
services/authService.js
```

This keeps the login API request separate from the login page UI.

### Search and Category Filtering

DummyJSON provides separate endpoints for product search and categories.

Search results are retrieved from the search endpoint and the selected category is then applied to the resulting product collection. This allows search and category filtering to work together.

### Debounced Search

Search input uses a debounce delay before making a new API request. This reduces unnecessary API calls while the user is typing.

Request cancellation and request identification are also used to prevent stale search results from replacing newer results.

### CRUD Persistence

DummyJSON's product mutation endpoints simulate backend operations.

localStorage is therefore used to maintain the application's created, edited, and deleted product state across page refreshes.

### Pagination

Products are filtered and sorted before pagination is applied. This ensures that pagination operates on the currently selected search, category, and sorting state.

### URL State

Dashboard state is synchronized with URL query parameters so that the current page, search, category, page size, and sorting options can be restored after a refresh.

## Challenges Handled

The implementation addresses several practical edge cases:

* Combining product search with category filtering
* Preventing stale search responses
* Persisting simulated CRUD changes
* Handling invalid product IDs
* Handling empty search results
* Preventing duplicate login requests
* Preventing duplicate save operations
* Maintaining pagination after filtering
* Maintaining dashboard state through URL parameters
* Supporting both desktop and mobile layouts

## AI Usage

AI tools were used as a development assistant during the implementation process for:

* Understanding implementation approaches
* Debugging development issues
* Reviewing code structure
* Identifying edge cases
* Improving error handling
* Testing implementation ideas

The final implementation and behavior were manually reviewed and tested during development.

## Build

To create a production build:

```bash
npm run build
```

To run the production build locally:

```bash
npm start
```
