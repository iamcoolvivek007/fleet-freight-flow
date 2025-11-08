# FreightFlow

FreightFlow is a comprehensive logistics management application designed for truck parking and freight businesses. It allows users to manage trucks, load providers, loads, and transactions in a single platform.

## Features

- **Dashboard:** Get an overview of your logistics operations, including total trucks, loads, revenue, and profit.
- **Truck Management:** Add, edit, and track your trucks, including driver and owner information, truck type, and status.
- **Load Provider Management:** Manage your load provider clients, including contact information and load history.
- **Load Management:** Create, assign, and track loads from start to finish, including material details, freight costs, and profit.
- **Transaction Management:** Record and manage all transactions, including advances, payments, expenses, and charges.
- **Financial Reports:** Generate detailed reports to analyze your business performance, including daily load reports, driver balance sheets, and party balance sheets.

## Technologies Used

- **Vite:** A fast build tool for modern web projects.
- **React:** A JavaScript library for building user interfaces.
- **TypeScript:** A typed superset of JavaScript that compiles to plain JavaScript.
- **Tailwind CSS:** A utility-first CSS framework for rapid UI development.
- **shadcn/ui:** A collection of re-usable components built using Radix UI and Tailwind CSS.
- **Supabase:** An open-source Firebase alternative for building secure and scalable applications.

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm

### Installation

1. Clone the repository:

   ```bash
   git clone <YOUR_GIT_URL>
   ```

2. Navigate to the project directory:

   ```bash
   cd <YOUR_PROJECT_NAME>
   ```

3. Install the dependencies:

   ```bash
   npm install
   ```

4. Create a `.env` file in the root of the project and add the following environment variables:

   ```env
   VITE_SUPABASE_URL=<YOUR_SUPABASE_URL>
   VITE_SUPABASE_PUBLISHABLE_KEY=<YOUR_SUPABASE_PUBLISHABLE_KEY>
   ```

5. Start the development server:

   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5173`.

## Usage

1. **Sign up:** Create a new account to get started.
2. **Add Trucks:** Add your trucks to the system, including driver and owner information.
3. **Add Load Providers:** Add your load provider clients.
4. **Create Loads:** Create new loads and assign them to your trucks.
5. **Manage Transactions:** Record all transactions related to your loads, including advances, payments, and expenses.
6. **Generate Reports:** Use the reports page to analyze your business performance.
