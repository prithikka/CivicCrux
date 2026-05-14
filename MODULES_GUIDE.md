# CivicCrux - Complete Module Guide

## Project Overview
**CivicCrux** is a MERN Stack application that helps citizens report civic issues and enables officers to manage and resolve them efficiently.

---

## 🏗️ ARCHITECTURE OVERVIEW

```
Frontend (React + Vite)    ←→    Backend (Node.js + Express)    ←→    Database (MongoDB)
```

---

# 📚 BACKEND MODULES

## 1. **SERVER & CONFIGURATION**

### `server.js` - Main Entry Point
**What it does:** Starts the Express server and connects all components.

```javascript
const express = require('express');          // Web framework
const cors = require('cors');                // Allow cross-origin requests
const connectDB = require('./config/db');    // Connect to MongoDB

app.use(cors());                             // Enable CORS
app.use(express.json());                     // Parse JSON
app.listen(PORT);                            // Start server
```

**Simple explanation:**
- Like a restaurant that opens its doors
- CORS = Allows customers from different addresses
- express.json() = Can read customer orders (JSON data)

### `config/db.js` - Database Connection
**What it does:** Connects the app to MongoDB database.

```javascript
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI);    // Connect to database
```

**Simple explanation:**
- Like opening a phone line to the database
- Uses environment variable (MONGO_URI) for security

---

## 2. **DATABASE MODELS** (How data is stored)

### `models/User.js` - User Schema
**Stores:** Information about citizens, officers, and admins

```javascript
{
    username: String,           // Unique login name
    email: String,              // Unique email
    phone: String,              // Contact number
    password: String,           // Encrypted password
    role: 'citizen'/'officer'/'admin',  // User type
    ward: String,               // Area/Zone (for officers)
    dob: String,                // Date of birth
}
```

**Key Features:**
- `bcryptjs`: Passwords are encrypted (hashed) for security
- `matchPassword()`: Compares entered password with stored encrypted password
- `pre('save')` hook: Automatically encrypts password before saving

**Simple explanation:**
- Like a folder with user information
- Password is scrambled so nobody can read it
- Automatically encrypts password when you save it

### `models/Complaint.js` - Complaint/Issue Schema
**Stores:** Details about reported civic issues

```javascript
{
    title: String,                           // "Broken Pothole"
    description: String,                     // Detailed description
    category: String,                        // "Pothole", "Garbage", etc.
    ward: String,                            // "Ward 1"
    location: String,                        // "Main Road"
    gpsCoordinates: { lat, lng },           // GPS location
    imageUrl: String,                        // Photo of issue
    status: 'REPORTED' / 'IN PROGRESS' / 'RESOLVED' / 'ESCALATED' / 'REOPENED',
    reportedBy: ObjectId,                    // Reference to citizen
    assignedTo: ObjectId,                    // Reference to officer
    resolutionImageUrl: String,              // Photo after fix
    officerRemarks: String,                  // Officer notes
    history: [                               // Timeline of changes
        { status, note, changedBy, timestamp }
    ]
}
```

**Simple explanation:**
- Like a ticket tracking system
- Keeps a complete history of all changes
- Links to user who reported it and officer assigned

---

## 3. **CONTROLLERS** (Business Logic)

### `controllers/authController.js` - Authentication Logic

#### `registerCitizen()`
```javascript
// Validation checks:
1. Username ≥ 5 characters
2. Password requirements:
   - ≥ 8 characters
   - 1 uppercase letter
   - 1 lowercase letter
   - 1 special character
3. Email doesn't already exist
4. Username not taken
```

**Simple explanation:**
- When someone signs up, check if username/email already exists
- Encrypt password before saving
- Return token for automatic login

#### `loginCitizen()`
```javascript
// Find user by username
// Check if password matches
// Return token (like a session pass)
```

#### `loginOfficer()`
```javascript
// Same as citizen but checks for officer/admin role
```

**Key Tool:**
- `jsonwebtoken` (JWT): Creates a secure token that proves you're logged in
- Token is sent in future requests to verify identity

---

### `controllers/complaintController.js` - Complaint Management

#### Key Functions:

**1. `createComplaint()` - Citizen reports an issue**
```javascript
// Input: title, description, category, ward, location, image
// Action: Create new complaint with "REPORTED" status
// Add to history: "Complaint registered successfully"
```

**2. `getMyComplaints()` - Citizen views their issues**
```javascript
// Get all complaints where reportedBy = current user
// Check for escalations automatically
```

**3. `getOfficerComplaints()` - Officer views assigned issues**
```javascript
// Get complaints in officer's ward
// Filter out escalated/reopened (unless assigned to this officer)
```

**4. `updateComplaintStatus()` - Officer updates status**
```javascript
// Allowed transitions:
REPORTED → IN PROGRESS → RESOLVED
// Escalated/Reopened can go back to IN PROGRESS or RESOLVED
```

**5. `checkEscalations()` - Automatic escalation**
```javascript
// If complaint is REPORTED for 14 days without action
// Automatically change to ESCALATED
// Remove from ward officer's queue
```

**Simple explanation:**
- Like a workflow: Submit → Officer works on it → Fixed
- If officer ignores for 14 days, complaint escalates (manager takes over)

---

## 4. **MIDDLEWARE** (Security Checks)

### `middleware/authMiddleware.js`

#### `protect` - Check if user is logged in
```javascript
if request has valid JWT token {
    Extract user info from token
    Attach to request object
    Allow to continue
} else {
    Send 401 (Unauthorized) error
}
```

**Simple explanation:**
- Like a security guard checking your badge
- Verifies token before allowing access

#### `authorize(...roles)` - Check user role
```javascript
if user.role in allowed_roles {
    Allow access
} else {
    Send 403 (Forbidden) error
}
```

**Simple explanation:**
- After authentication, check if user has permission
- Example: Only officers can update complaint status

---

## 5. **ROUTES** (API Endpoints)

### `routes/authRoutes.js`
```
POST /api/auth/citizen-register      - Citizen signup
POST /api/auth/citizen-login         - Citizen login
POST /api/auth/officer-login         - Officer login
GET  /api/auth/me                    - Get current user info
```

### `routes/complaintRoutes.js`
```
POST   /api/complaints               - Create complaint
GET    /api/complaints               - Get all (admin)
GET    /api/complaints/my            - Get my issues (citizen)
GET    /api/complaints/officer       - Get officer's issues
GET    /api/complaints/:id           - Get issue details
PUT    /api/complaints/:id           - Update status (officer)
```

### `routes/uploadRoutes.js`
```
POST /api/uploads                    - Upload image
```

---

## 6. **UTILITIES**

### `utils/generateToken.js` - JWT Token Generation
```javascript
jwt.sign(
    { id: user._id },              // Data to encode
    process.env.JWT_SECRET,         // Secret key
    { expiresIn: '7d' }             // Expires in 7 days
);
```

**Simple explanation:**
- Creates a secure token that expires after 7 days
- Token contains user's ID

---

## 7. **FILE UPLOAD**

### `routes/uploadRoutes.js` - Image Upload Handler
**Tool Used:** `multer` - Handles file uploads

```javascript
multer.diskStorage({
    destination: './uploads',       // Save to uploads folder
    filename: (file) => {
        filename = Date.now() + file.originalname;
    }
});
```

**Simple explanation:**
- When user uploads an image, save it to `/uploads/` folder
- Filename = timestamp + original name (avoids duplicates)

---

## 🔐 BACKEND TOOLS SUMMARY

| Tool | Purpose |
|------|---------|
| **express** | Web framework, handles HTTP requests |
| **mongoose** | Connect to MongoDB, define schemas |
| **bcryptjs** | Encrypt passwords |
| **jsonwebtoken** | Create secure login tokens |
| **cors** | Allow requests from different domains |
| **multer** | Handle image uploads |
| **dotenv** | Read environment variables (.env file) |
| **nodemon** | Auto-restart server on code changes |

---

---

# 🎨 FRONTEND MODULES

## 1. **MAIN APPLICATION**

### `src/App.jsx` - Router Configuration
**What it does:** Maps URLs to pages

```javascript
<Routes>
    <Route path="/" element={<Home />} />
    <Route path="/citizen-login" element={<CitizenLogin />} />
    <Route path="/citizen-signup" element={<CitizenSignup />} />
    <Route path="/officer-login" element={<OfficerLogin />} />
    <Route path="/citizen" element={<CitizenDashboard />} />
    <Route path="/officer" element={<OfficerDashboard />} />
    <Route path="/issue/:id" element={<IssueDetails />} />
    <Route path="/report" element={<ReportIssue />} />
</Routes>
```

**Simple explanation:**
- When user visits `/citizen-login`, show CitizenLogin page
- Like a table of contents in a book

---

## 2. **PAGES** (Full Screen Views)

### `pages/Home.jsx`
- Landing page
- Shows brief description
- Links to login/signup

### `pages/CitizenLogin.jsx`
**What it does:** Login form for citizens

```javascript
// User enters: username, password
// Submit to: POST /api/auth/citizen-login
// On success:
//   - Save token to localStorage
//   - Redirect to /citizen (dashboard)
```

**Key Features:**
- Show/hide password toggle (👁️ icon)
- Error messages display
- Link to signup and forgot password

### `pages/CitizenSignup.jsx`
**What it does:** Registration form for new citizens

```javascript
// User enters: username, email, phone, password, DOB
// Validations: Check if email/username already exists
// On success: Auto-login and redirect
```

### `pages/CitizenDashboard.jsx`
**What it does:** Shows citizen their reported issues

```javascript
// On load:
//   1. Get token from localStorage
//   2. Fetch user info: GET /api/auth/me
//   3. Fetch complaints: GET /api/complaints/my

// Display:
//   - Stats: Total, Reported, In Progress, Resolved
//   - List of all complaints
//   - Each as IssueCard component
```

**Simple explanation:**
- Like a to-do list showing all submitted complaints
- Shows status of each complaint

### `pages/OfficerDashboard.jsx`
**What it does:** Shows officer their assigned issues (you already did this!)

### `pages/OfficerLogin.jsx`
**What it does:** Login for officers/admins

```javascript
// User enters: email, password (not username)
// Submit to: POST /api/auth/officer-login
// On success: Redirect to /officer
```

### `pages/AdminDashboard.jsx`
**What it does:** Shows admin all issues and analytics

### `pages/ReportIssue.jsx`
**What it does:** Form to submit new civic complaint

```javascript
// User fills:
//   - Title: "Broken Pothole"
//   - Category: Select dropdown
//   - Ward: Select dropdown
//   - Location: Text field
//   - Description: Text area
//   - Image: File upload

// Features:
//   1. Capture GPS location (navigator.geolocation)
//   2. Upload image to server
//   3. Submit complaint

// Process:
//   1. User selects image
//   2. Click "Capture Location" → Get GPS coordinates
//   3. Submit form
//   4. App uploads image: POST /api/uploads
//   5. App creates complaint: POST /api/complaints
//   6. Redirect to dashboard
```

**Key Technology:**
- `navigator.geolocation.getCurrentPosition()` - Get device GPS
- `FormData` - Send image file to server

### `pages/IssueDetails.jsx`
**What it does:** Show full details of one complaint

```javascript
// Get issue ID from URL: /issue/:id
// Fetch from: GET /api/complaints/:id
// Display:
//   - Title, Description, Category
//   - Status and timeline (history)
//   - Photos
//   - Officer assigned
//   - All updates
```

### `pages/CitizenForgot.jsx`
**What it does:** Password reset for citizens

---

## 3. **COMPONENTS** (Reusable UI Pieces)

### `components/Header.jsx`
**What it does:** Top navigation bar for all pages

```javascript
Props:
  - title: Page title
  - user: Logged-in user name
  - extraAction: Button (Report/Cancel/Logout)
```

**Simple explanation:**
- Like a header in every page showing page name and user
- Shows different buttons based on page

### `components/IssueCard.jsx`
**What it does:** Display one issue in a card format

```javascript
Props:
  - issue: Complaint object
  - isOfficer: Boolean (true if officer viewing)

Display:
  - Issue title
  - Category badge
  - Location
  - Status (color-coded)
  - Assigned officer (if applicable)
```

**Simple explanation:**
- Like a post card showing summary of an issue
- Click to see full details

### `components/StatCard.jsx`
**What it does:** Display a statistic number

```javascript
Props:
  - count: Number
  - label: Text (e.g., "Total Issues")

Display:
  - Big number
  - Label below
```

**Simple explanation:**
- Like showing "5 issues reported" in a nice box

---

## 4. **DATA**

### `data/dummyData.js`
**What it does:** Sample data for testing

```javascript
// Fake issues, users for development
// Helps visualize UI before backend is ready
```

---

## 5. **FIREBASE SETUP**

### `src/firebase.js`
**What it does:** Initializes Firebase (for future features)

```javascript
const firebaseConfig = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    // ...
};
initializeApp(firebaseConfig);
```

**Currently:** Uses dummy values
**Future Use:** Could use for real-time notifications, cloud storage

---

## 6. **STYLING**

### `src/App.css` & `src/index.css`
**What it does:** Global CSS styles

**CSS Variables (Theme System):**
```css
--color-primary: Main color
--color-border: Border color
--text-primary: Main text
--text-secondary: Secondary text
--color-reported: Red
--color-in-progress: Yellow
--color-resolved: Green
--color-escalated: Orange
```

**Simple explanation:**
- Uses CSS variables for consistent theming
- Easy to change colors everywhere by updating variables

---

## 🛠️ FRONTEND TOOLS SUMMARY

| Tool | Purpose |
|------|---------|
| **React** | UI library, components |
| **React Router** | Navigation between pages |
| **Vite** | Fast build tool, dev server |
| **Fetch API** | Make HTTP requests to backend |
| **localStorage** | Store token (for logged-in state) |
| **navigator.geolocation** | Get device GPS location |
| **FormData** | Send files to server |

---

---

# 🔄 DATA FLOW EXAMPLES

## Example 1: Citizen Reports an Issue

```
1. Citizen clicks "Report New Issue"
   ↓
2. Fill form (title, description, category, ward, location)
   ↓
3. Click "Capture Location" 
   → navigator.geolocation gets GPS
   ↓
4. Select image from device
   ↓
5. Click "Submit"
   ↓
6. Frontend uploads image:
   POST /api/uploads → Returns imageUrl
   ↓
7. Frontend creates complaint:
   POST /api/complaints 
   Headers: Authorization: Bearer {token}
   Body: { title, description, category, ward, imageUrl, lat, lng }
   ↓
8. Backend:
   - Check if user authenticated (middleware/authMiddleware.js)
   - Validate data (controllers/complaintController.js)
   - Save to MongoDB (models/Complaint.js)
   - Create history entry
   ↓
9. Frontend redirects to dashboard
   ↓
10. Dashboard fetches: GET /api/complaints/my
```

## Example 2: Officer Updates Issue Status

```
1. Officer logs in
   POST /api/auth/officer-login
   Returns: { token, userId, role: 'officer', ward: 'Ward 1' }
   ↓
2. Officer goes to /officer dashboard
   GET /api/complaints/officer
   Backend filters: Complaint.find({ ward: officer.ward })
   ↓
3. Officer clicks on issue
   GET /api/complaints/:id
   ↓
4. Officer uploads resolution photo
   POST /api/uploads
   ↓
5. Officer clicks "Mark as Resolved" + enters remarks
   PUT /api/complaints/:id
   Body: {
       status: 'RESOLVED',
       resolutionImageUrl: imageUrl,
       officerRemarks: 'Fixed with new materials'
   }
   ↓
6. Backend updates:
   - Change status to RESOLVED
   - Add to history with timestamp
   - Save complaint
   ↓
7. Citizen sees updated status in their dashboard
```

## Example 3: Auto-Escalation (Runs in Background)

```
1. Every time officer views their complaints
   GET /api/complaints/officer
   ↓
2. Backend runs checkEscalations()
   ↓
3. Query: Find all complaints where:
   - status = 'REPORTED'
   - createdAt ≤ 14 days ago
   ↓
4. For each complaint:
   - Change status to 'ESCALATED'
   - Clear assignedTo field
   - Add history entry
   ↓
5. Admin sees these escalated issues
   - Can reassign to another officer
```

---

# 📊 WORKFLOW SUMMARY

### Complaint Lifecycle:
```
REPORTED (Citizen submits)
   ↓
[14 days pass without action?]
   ↓ YES → ESCALATED (Goes to admin)
   ↓ NO
   ↓
IN PROGRESS (Officer accepts)
   ↓
RESOLVED (Officer uploads solution)
```

### User Flows:
```
CITIZEN FLOW:
Home → Login → Dashboard → Report Issue → View Status → Issue Details

OFFICER FLOW:
Officer Login → Officer Dashboard → (already covered in officer dropdown task)

ADMIN FLOW:
Admin Login → Admin Dashboard → View All Issues → Reassign/Escalate
```

---

# 🎯 Key Modules to Study

## Must-Know Backend:
1. **Models** - How data is structured
2. **Auth Controller** - User registration & login
3. **Complaint Controller** - Main business logic
4. **Auth Middleware** - Security
5. **Routes** - API endpoints

## Must-Know Frontend:
1. **CitizenLogin/Signup** - Authentication UI
2. **CitizenDashboard** - Fetching and displaying data
3. **ReportIssue** - Form submission with file upload
4. **IssueCard/Header** - Components

---

# 💡 Quick Tips

- **Token Storage**: Stored in `localStorage` - persists even after page refresh
- **API Base URL**: All requests go to `http://localhost:5000`
- **CORS**: Enabled in backend so frontend can communicate
- **File Uploads**: Images stored in `/backend/uploads/` folder
- **Database**: Uses MongoDB (NoSQL) - more flexible than SQL
- **Timestamps**: All data has `createdAt` and `updatedAt` automatically

---

Done! This covers all modules. Study them in this order:
1. **Backend Server Setup** → Understanding how server works
2. **Database Models** → How data looks
3. **Authentication** → How login/signup works
4. **Complaint CRUD** → Create, Read, Update operations
5. **Frontend Pages** → React components
6. **Data Flow** → How everything connects
