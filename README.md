# RateMyStore

A store rating web app built for the Roxiler Systems FullStack Intern Coding Challenge. Users can browse registered stores and rate them from 1 to 5. There is one login page for everyone, and what you see after logging in depends on your role.

**Stack:** Express.js, PostgreSQL, React (Vite), JWT, bcrypt

## Roles

**System Administrator**
- Dashboard with total users, total stores and total ratings
- Can add users (normal, admin, store owner) and stores
- Can filter users and stores by name, email, address and role
- Can open a user's details. If that user is a store owner, their store's rating is shown too
- All tables are sortable (ascending and descending)

**Normal User**
- Signs up from the registration page and logs in
- Sees all stores with the store name, address, overall rating and their own rating
- Can search stores by name or address
- Can submit a rating (1 to 5) and change it later
- Can update their password

**Store Owner**
- Sees the average rating of their store
- Sees the list of users who rated the store
- Can update their password

## Validation rules

These are checked in the React forms and again on the server, so they can't be skipped by calling the API directly.

| Field    | Rule                                                          |
|----------|---------------------------------------------------------------|
| Name     | 20 to 60 characters                                           |
| Address  | Up to 400 characters                                          |
| Password | 8 to 16 characters, at least one uppercase and one special character |
| Email    | Must be a valid email format                                  |

## How to run it locally

You need Node.js (LTS) and PostgreSQL installed.

**1. Create the database**

```sql
CREATE DATABASE store_rating;
```

**2. Start the backend**

```bash
cd backend
npm install
copy .env.example .env
```

On Mac/Linux use `cp .env.example .env`. Open `.env` and fill in:

```
DATABASE_URL=postgres://postgres:YOUR_PASSWORD@localhost:5432/store_rating
JWT_SECRET=any_long_random_string
```

Then:

```bash
npm run migrate   # creates the tables
npm run seed      # creates the default admin
npm run dev       # starts the API on http://localhost:5000
```

**3. Start the frontend** (in a new terminal)

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## Default admin

| Email               | Password   |
|---------------------|------------|
| admin@roxiler.com   | Admin@123  |

This is only for testing. Change it if you deploy this anywhere.

## Trying it out

1. Log in as admin and create a user with the Store Owner role (name must be 20+ characters).
2. Go to the Stores tab, add a store and pick that owner.
3. Log out, sign up as a normal user and rate the store.
4. Log in as the owner to see the average rating and who rated.

## Project structure

```
store-rating-app/
├── backend/
│   ├── src/
│   │   ├── index.js      # server, routes, auth middleware
│   │   ├── db.js         # PostgreSQL connection
│   │   ├── migrate.js    # runs the schema
│   │   ├── seed.js       # creates the admin user
│   │   └── validate.js   # validation rules
│   ├── schema.sql
│   └── .env.example
└── frontend/
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── pages/        # one page per role and screen
        ├── main.jsx      # entry point
        ├── App.jsx       # routes and role-based guards
        ├── api.js        # calls to the backend
        ├── utils.js      # helpers
        ├── components.jsx
        └── styles.css
```

## Design decisions

- **One login for all roles.** The JWT carries the user's role. The backend checks it in a middleware before every protected route, and the frontend uses it to redirect to the right dashboard.
- **Passwords are hashed with bcrypt**, never stored as plain text.
- **All SQL is parameterised**, so user input is never pasted into a query string.
- **One rating per user per store.** The ratings table has a unique (user, store) constraint, so rating again updates the old rating instead of adding a new row.
- **Indexes** on foreign key columns to keep the listing queries fast.

## What I would add next

- Pagination on the admin tables
- Delete option for users and stores
- Forgot password flow
- Automated tests for the API

## Author

Manya Shukla