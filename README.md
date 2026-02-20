Employee Document Portal — Frontend
A React (Vite) frontend for the Employee Document Portal system.  
Users can log in and view documents, while Admin/Manager can upload and manage documents based on roles.

Features
- Login using token (Laravel Sanctum)
- Role-based UI access (Admin, Manager, Employee)
- View document list + download
- Filters: category, department, access level
- Upload page for authorized roles
- Logout (clears localStorage)

Tech Stack
- React (Vite)
- JavaScript
- Fetch API
- React Router

Setup & Run
1. Clone repository
2. Install dependencies:
   ```bash
   git clone <repo-url>
2. Install dependencies
   npm install
3. Run frontend
   npm run dev
at http://localhost:5173

Backend API
php artisan serve must be running and connect to laravel backend 
at http://127.0.0.1:8000/api/v1

Test Accounts
 Admin: admin@test.com / password123
Manager: manager@test.com / password123
Employee: user@test.com / password123
