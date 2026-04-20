# CivicCrux API Plan

## Auth APIs
- POST /api/auth/citizen-login
- POST /api/auth/officer-login
- POST /api/auth/logout
- GET /api/auth/me

## Complaint APIs
- POST /api/complaints
- GET /api/complaints/my
- GET /api/complaints/:id
- PUT /api/complaints/:id/status
- PUT /api/complaints/:id/assign

## Admin APIs
- GET /api/admin/analytics
- GET /api/admin/complaints
- GET /api/admin/officers

## Upload APIs
- POST /api/uploads/photo

## Notes
- Protect all private routes.
- Use role-based access control.
- Validate all request bodies.
- Return clear error messages.