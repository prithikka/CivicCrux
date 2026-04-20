# CivicCrux Requirements

## Functional Requirements
- Citizens must be able to create accounts and log in.
- Citizens must be able to submit complaints with:
  - issue type
  - description
  - photo
  - location
- Officers must be able to log in securely.
- Officers must only see complaints assigned to their ward.
- Officers must be able to update complaint status.
- Citizens must be able to track complaint progress.
- Admin must be able to view dashboard analytics.
- The system must support Tamil and English.

## Complaint Status Flow
- Pending
- In Progress
- Verification
- Fixed
- Closed

## Verification Rules
- Complaint closure should require proof or verification.
- Before and after photos should be stored if available.
- GPS/location data should be checked when possible.

## Non-Functional Requirements
- Mobile-first responsive design
- Clean and simple UI
- Fast loading pages
- Role-based access control
- Basic input validation
- Clear error messages

## Scope Limits
- Do not overcomplicate the first version.
- Do not build advanced AI features in MVP unless required.
- Focus on working core features first.

## Success Criteria
The project is successful if:
- A citizen can submit a complaint.
- An officer can update it.
- An admin can view stats.
- The app works smoothly on mobile.