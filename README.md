# Callback Manager

A Vercel-deployable API with UI for managing callbacks with Google Authenticator authentication.

## Features

- **Authentication**: Signup/Login with Google Authenticator (TOTP) 2FA
- **Callback Management**: Create, edit, delete callbacks
- **Trigger Callbacks**: Public URLs to trigger callback functions
- **Logging**: Record all callback executions
- **UI**: Modern React interface with Tailwind CSS

## Database

- **Users**: Email, password, TOTP secret
- **Callbacks**: Name, callback URL, active status
- **Logs**: Event records for each callback execution

## API Endpoints

- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login with TOTP
- `GET /api/callbacks` - List callbacks
- `POST /api/callbacks` - Create callback
- `PUT /api/callbacks/[id]` - Update callback
- `DELETE /api/callbacks/[id]` - Delete callback
- `GET /api/trigger/[id]` - Trigger callback (public)
- `GET /api/logs` - List logs

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up database:
   - For development: Update `DATABASE_URL` in `.env` to your PostgreSQL connection
   - For Vercel: Use Vercel Postgres
4. Run migrations: `npx prisma db push`
5. Generate Prisma client: `npx prisma generate`
6. Start development server: `npm run dev`

## Deployment to Vercel

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard:
   - `DATABASE_URL`: Your Vercel Postgres connection string
   - `JWT_SECRET`: A secure random string
4. Deploy

## Usage

1. Signup with email/password - scan QR code with authenticator app
2. Login with email/password/TOTP code
3. Create callbacks with name and URL
4. Use `/api/trigger/[callback-id]` to execute callbacks
5. View logs in the dashboard

## Security

- JWT authentication for API access
- TOTP 2FA for login
- Active status control for callbacks
