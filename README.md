# Psycho Backend API

A Node.js backend API for psychological testing and assessment management system built with Express.js and Sequelize ORM.

## Features

- 🔐 **Authentication & Authorization**: JWT-based authentication with role-based access control
- 👥 **User Management**: Comprehensive user and organization management
- 📝 **Test Management**: Create and manage psychological tests, questions, and options
- 📊 **Results & Analytics**: Track test progress and generate results
- 🏢 **Organization Support**: Multi-organization architecture
- 💳 **Subscription Management**: Plans, subscriptions, and invoice handling
- 👨‍👩‍👧‍👦 **Group Management**: Organize users into groups and assign tests
- 📧 **Email Notifications**: Password reset and notification functionality

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js 5.x
- **Database**: MySQL with Sequelize ORM
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcrypt
- **Email**: Nodemailer
- **File Upload**: Multer
- **Testing**: Jest

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- npm or yarn package manager

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Pyscho-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Copy the `.env.example` file to create your own `.env` file:
   ```bash
   cp .env.example .env
   ```
   
   Then edit `.env` and configure the following variables:
   
   - `ACCESS_SECRET`: Secret key for JWT access tokens
   - `REFRESH_SECRET`: Secret key for JWT refresh tokens
   - `PORT`: Server port (default: 5000)
   - `DB_USERNAME`: Your MySQL username
   - `DB_PASSWORD`: Your MySQL password
   - `DB_DATABASE`: Database name
   - `DB_HOST`: Database host (default: 127.0.0.1)
   - `MAIL_USER`: Email address for sending emails
   - `MAIL_PASS`: Email app password (for Gmail, use App Password)
   - `MAIL_FROM`: Sender email address
   - `FRONTEND_URL`: Your frontend application URL

4. **Set up the database**
   
   Create a MySQL database:
   ```sql
   CREATE DATABASE alpha_psycho;
   ```

5. **Run database seeders** (optional)
   
   Populate the database with initial data:
   ```bash
   npm run seed
   ```
   
   Or run specific seeders:
   ```bash
   npm run seed:user-groups
   npm run seed:roles-permissions
   npm run seed:test-assignments
   npm run seed:pricing
   ```

## Running the Application

Start the development server:
```bash
node index.js
```

The API will be available at `http://localhost:5000` (or your configured PORT).

## Project Structure

```
Pyscho-backend/
├── config/              # Configuration files
│   └── config.js        # Database configuration
├── controllers/         # Request handlers
├── middleware/          # Custom middleware (auth, permissions, upload)
├── migrations/          # Database migrations
├── models/              # Sequelize models
├── routes/              # API route definitions
├── seeders/             # Database seeders
├── uploads/             # File upload directory
├── .env                 # Environment variables (not tracked)
├── .env.example         # Environment variables template
└── index.js             # Application entry point
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Tests
- `GET /api/tests` - Get all tests
- `POST /api/tests` - Create new test
- `GET /api/tests/:id` - Get test by ID
- `PUT /api/tests/:id` - Update test
- `DELETE /api/tests/:id` - Delete test

### Organizations
- `GET /api/organizations` - Get all organizations
- `POST /api/organizations` - Create organization
- `GET /api/organizations/:id` - Get organization by ID
- `PUT /api/organizations/:id` - Update organization

### Groups
- `GET /api/groups` - Get all groups
- `POST /api/groups` - Create group
- `PUT /api/groups/:id` - Update group
- `DELETE /api/groups/:id` - Delete group

### Results & Progress
- `GET /api/results` - Get test results
- `POST /api/results` - Submit test result
- `GET /api/progress` - Get user progress

*(For complete API documentation, please refer to the route files in the `routes/` directory)*

## Database Models

- **User**: User accounts and profiles
- **Organization**: Organizations/companies
- **Role**: User roles
- **Permission**: System permissions
- **Test**: Psychological tests
- **Question**: Test questions
- **Option**: Question options
- **Answer**: User answers
- **Result**: Test results
- **Progress**: User test progress
- **Group**: User groups
- **Category**: Test categories
- **Triat**: Psychological traits
- **Plan**: Subscription plans
- **Subscription**: User subscriptions
- **Invoice**: Billing invoices
- **Contact**: Contact form submissions
- **FAQ**: Frequently asked questions

## Testing

Run the test suite:
```bash
npm test
```

## Security Notes

- Never commit your `.env` file to version control
- Use strong, unique secrets for `ACCESS_SECRET` and `REFRESH_SECRET`
- For Gmail, use [App Passwords](https://support.google.com/accounts/answer/185833) instead of your regular password
- Always use HTTPS in production
- Keep dependencies updated regularly

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Support

For issues, questions, or contributions, please open an issue in the repository.
