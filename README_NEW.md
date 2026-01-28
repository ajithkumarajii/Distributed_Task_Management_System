# Distributed Task Management System (DTMS)

A production-grade backend system for managing projects and tasks with **role-based access control (RBAC)**, **clean architecture**, and **enterprise-level validation**.

## 🎯 System Overview

The DTMS implements a complete domain model with:
- **Project Management**: Create, manage projects with multiple team members
- **Task Management**: Full CRUD operations with workflow validation
- **Role-Based Access Control**: ADMIN, MANAGER, and MEMBER roles
- **Status Workflow**: TODO → IN_PROGRESS → DONE with validation
- **Task Assignment**: Assign tasks to team members
- **Comments & Collaboration**: Add comments to tasks for team communication
- **Pagination & Filtering**: Efficient data retrieval with filters
- **Comprehensive Validation**: Input validation using Zod

## 📋 Tech Stack

### Backend
- **Runtime**: Node.js 16+
- **Framework**: Express.js 5.2.1
- **Database**: MongoDB 5.0+ with Mongoose 8.0.0
- **Authentication**: JWT (jsonwebtoken 9.0.3)
- **Validation**: Zod
- **Security**: bcrypt for password hashing
- **Security**: Bcrypt 6.0.0 for password hashing
- **Utilities**: dotenv for environment management

### Frontend
- **Framework**: React 19.2.0
- **Build Tool**: Vite 7.2.4
- **Styling**: CSS-in-JS (inline styles with CSS animations)
- **HTTP Client**: Fetch API

## 🛠️ Installation

### Prerequisites
- Node.js (v18+)
- npm or yarn
- MongoDB Atlas account (or local MongoDB)

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
# Create .env file from template
cp .env.example .env

# Edit .env and add your MongoDB URI and JWT secret
```

4. Start the server:
```bash
npm start        # Production mode
npm run dev      # Development mode with nodemon
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## 🔐 Environment Variables

### Backend (.env)

```env
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/task_management?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_EXPIRES_IN=24h
```

## 📝 API Endpoints

### Authentication

- `POST /auth/register` - Register a new user
  - Body: `{ name, email, password }`
  
- `POST /auth/login` - Login user
  - Body: `{ email, password }`
  - Returns: `{ token, message }`
  
- `GET /auth/me` - Get current user (Protected)
  - Headers: `Authorization: Bearer <token>`

## 🏗️ Project Structure

```
Distributed_Task_Management_System/
├── backend/
│   ├── src/
│   │   ├── app.js              # Express app setup
│   │   ├── db.js               # MongoDB connection
│   │   ├── models/
│   │   │   └── User.js         # Mongoose user schema
│   │   ├── services/
│   │   │   └── auth.service.js # Auth business logic
│   │   ├── controllers/
│   │   │   └── auth.controller.js # Request handlers
│   │   ├── routes/
│   │   │   └── auth.routes.js  # Route definitions
│   │   └── middleware/
│   │       └── auth.middleware.js # JWT verification
│   ├── package.json
│   ├── .env.example            # Environment template
│   └── .gitignore
├── frontend/
│   ├── src/
│   │   ├── App.jsx             # Main app component
│   │   ├── App.css             # Global styles
│   │   ├── main.jsx            # React entry point
│   │   ├── index.css           # CSS variables & defaults
│   │   ├── pages/
│   │   │   └── Login.jsx       # Auth component
│   │   ├── services/
│   │   │   └── api.js          # API service layer
│   │   └── assets/
│   ├── package.json
│   ├── vite.config.js
│   ├── eslint.config.js
│   └── .gitignore
├── .gitignore
└── README.md
```

## 🔄 Authentication Flow

1. User registers with name, email, and password
2. Password is hashed with bcrypt (10 salt rounds)
3. User data saved to MongoDB
4. On login, credentials are verified
5. JWT token generated (24-hour expiration)
6. Token stored in localStorage on client
7. Protected routes verified via middleware

## 🎨 UI Features

- **Login Page**: Split-screen design with gradient background
- **Register Form**: Password strength indicator
- **Dashboard**: Stats cards, user info, and performance metrics
- **Responsive Design**: Mobile, tablet, and desktop support
- **Modern Animations**: Smooth transitions and fade-in effects

## 📦 Deployment

### Backend Deployment
- Recommended: Heroku, AWS, DigitalOcean, Render
- Environment variables must be set in deployment platform

### Frontend Deployment
- Recommended: Vercel, Netlify, GitHub Pages
- Build command: `npm run build`
- Output directory: `dist/`

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Commit with clear messages
4. Push to branch
5. Create Pull Request

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 📞 Support

For issues, questions, or suggestions, please open an issue in the repository.

---

**Ready to use!** Start by following the Installation steps above.
