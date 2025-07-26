# SpareBank1 Budget App - Setup Instructions

## 🚀 Quick Start

Follow these steps to get your personal budgeting app up and running.

### Prerequisites

- **Node.js** 18+ and npm
- **PostgreSQL** database
- **SpareBank1 Developer Account** (for API access)

### 1. Environment Configuration

Create a `.env.local` file in the root directory with these variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/budget_app"

# SpareBank1 OAuth Configuration
# Get these from SpareBank1 Developer Portal: https://developer.sparebank1.no/
SPAREBANK1_CLIENT_ID="your_client_id_here"
SPAREBANK1_CLIENT_SECRET="your_client_secret_here"
SPAREBANK1_REDIRECT_URI="http://localhost:3000/api/auth/callback/sparebank1"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your_nextauth_secret_here"

# Optional - Redis for caching
REDIS_URL="redis://localhost:6379"
```

### 2. Generate NextAuth Secret

```bash
openssl rand -base64 32
```

Copy the output and use it as your `NEXTAUTH_SECRET`.

### 3. SpareBank1 Developer Setup

1. Go to [SpareBank1 Developer Portal](https://developer.sparebank1.no/)
2. Create a customer client for "Personal Digital Budget"
3. Set redirect URI to: `http://localhost:3000/api/auth/callback/sparebank1`
4. Note down your `client_id` and `client_secret`

### 4. Database Setup

#### Option A: Local PostgreSQL

```bash
# Install PostgreSQL and create database
createdb budget_app
```

#### Option B: Docker

```bash
docker run --name budget-postgres -e POSTGRES_DB=budget_app -e POSTGRES_USER=admin -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:15
```

Update your `DATABASE_URL` accordingly.

### 5. Install Dependencies

First, install the dependencies we need for the current setup:

```bash
npm install clsx tailwind-merge
```

For the full development (Phase 1), you'll need:

```bash
# Core dependencies
npm install @prisma/client prisma
npm install next-auth @next-auth/prisma-adapter
npm install @hookform/resolvers react-hook-form zod
npm install zustand
npm install axios
npm install date-fns

# UI Dependencies
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install @radix-ui/react-select @radix-ui/react-tabs
npm install lucide-react

# Development
npm install -D @types/node typescript
```

### 6. Database Migration (When Ready for Phase 1)

```bash
# Initialize Prisma
npx prisma init

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push
```

### 7. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your app!

## 📁 Project Structure

```
src/
├── app/                 # Next.js App Router pages
├── components/          # React components
│   └── ui/             # Reusable UI components
├── lib/                # Utility functions and configurations
├── types/              # TypeScript type definitions
├── hooks/              # Custom React hooks (coming in Phase 1)
└── stores/             # State management (coming in Phase 1)
```

## 🛠 Development Phases

This project is designed to be built in phases:

### ✅ Foundation (Current)

- [x] Basic project setup
- [x] Clean UI foundation
- [x] Type definitions
- [x] Utility functions

### 🔄 Phase 1: Authentication & Basic API (Next)

- [ ] NextAuth.js setup with SpareBank1 OAuth
- [ ] Database schema with Prisma
- [ ] Basic account overview
- [ ] SpareBank1 API integration

### 📅 Phase 2: Core Features

- [ ] Transaction management
- [ ] Budget creation and tracking
- [ ] Basic analytics

### 🚀 Phase 3: Advanced Features

- [ ] Advanced analytics and reporting
- [ ] Goal setting
- [ ] Export functionality

## 🤝 Contributing

Follow the development plan in `DEVELOPMENT_PLAN.md` for detailed implementation steps.

## 🔐 Security Notes

- Never commit `.env.local` or any files containing secrets
- Use strong, unique passwords for your database
- Keep your SpareBank1 client credentials secure
- Regularly rotate your `NEXTAUTH_SECRET`

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [SpareBank1 API Documentation](https://developer.sparebank1.no/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org/)

## 🆘 Getting Help

1. Check the `DEVELOPMENT_PLAN.md` for detailed implementation guidance
2. Review SpareBank1 API documentation
3. Check the troubleshooting section in the development plan

---

**Ready to build your personal finance dashboard!** 🎯
