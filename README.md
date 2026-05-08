# CivicCrux

CivicCrux is a MERN stack based civic issue reporting and management system that allows citizens to report public issues and enables officers/admins to manage and resolve complaints efficiently.


# Features

* Citizen registration and login
* Officer/Admin authentication
* Report civic issues with images
* Track complaint status
* Dashboard for officers
* Complaint management system
* Status update workflow
* Issue categorization
* Secure backend APIs


# Tech Stack

## Frontend

* React.js
* Vite
* HTML
* CSS
* JavaScript

## Backend

* Node.js
* Express.js
* MongoDB
* Mongoose

---

# Project Structure

```bash
backend/
│
├── config/
├── controllers/
├── middleware/
├── models/
├── node_modules/
├── routes/
├── uploads/
├── utils/
├── .env
├── package.json
├── package-lock.json
├── seeder.js
└── server.js


frontend/

README.md
api-plan.md
idea.md
requirements.md
tasks.md
ui-plan.md
```

---

# Installation

## Clone the Repository

```bash
git clone <repository-link>
cd CivicCrux
```



# Backend-Setup

```bash
cd backend
npm install
```

Start backend server:

```bash
npm start
```

or

```bash
node server.js
```

---

# Frontend-Setup

```bash
cd frontend
npm install
npm run dev
```



# Environment Variables

Create a `.env` file inside the `backend` folder and add:

```env
PORT=
MONGO_URI=
JWT_SECRET=
```

---

# Usage

1. Register/Login as citizen
2. Report civic issues
3. Upload issue images
4. Officers manage complaints
5. Update complaint status
6. Track issue resolution

---

# API Modules

* Authentication APIs
* Citizen APIs
* Officer APIs
* Complaint APIs
* Status Management APIs

---

## Acknowledgement

Developed as part of a MERN Stack academic project.
