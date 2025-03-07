# Contributing to Task Manager App For MEEZAK Technologies
Thank you for your interest in contributing to the! We value your efforts and look forward to collaborating with you.

## Core Technologies

The project will be built using:

- **Vite**: React framework for building user interfaces.
- **TailwindCSS**: A utility-first CSS framework.
- **React Hook Form**: A library for efficient form management.
- **Yup**: Schema-based value parsing and validation.

## Prerequisites

Before getting started, ensure your environment meets the following requirements:

- **Node.js**: Version 20 or higher. Check your version with:

  ```bash
  node -v
  ```

- **Npm**: The project uses Npm as the package manager. Install Npm globally if needed:

  ```bash
  npm install 
  ```

## Setting Up the Project

Follow these steps to get started:

### 1. Clone the Repository

Clone the project repository to your local machine:

```bash
git clone https://github.com/Jaystorm56/MeezakTaskManager.git
```

### 2. Install Dependencies

Navigate to the project directory and install the required dependencies:

```bash
cd 
npm install
```

### 3. Start the Development Server

Launch the local development server:

```bash
Npm run dev
```

The application will be available at [http://localhost:5173](http://localhost:5173).

### 4. Create a New Branch from `development`

Always create a new branch for your work, starting from the latest `development` branch:

```bash
git checkout development
git pull origin development
git checkout -b <your-branch-name>
```

## Branch Naming Guidelines

Use the following format for branch names:

```
<type>/<short-description>
```

Examples:

- `feature/sign-in`
- `bugfix/fix-header-styling`

## Commit Message Guidelines

Follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) standard for clear and consistent commit messages:

```
<type>: <short description>
```

Common types include:

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation updates
- **style**: Non-functional code changes (e.g., formatting)
- **refactor**: Code changes that neither fix bugs nor add features
- **test**: Adding or updating tests
- **chore**: Changes to build tools or dependencies

Examples:

- `feat: Implement donation form`
- `fix: Resolve mobile sign-up `
- `docs: Update README`

## Submitting a Pull Request

1. Ensure your branch is updated with the latest `development` branch:

   ```bash
   git checkout development
   git pull origin development
   git checkout <your-branch-name>
   ```

2. Push your changes to your branch:

   ```bash
   git push origin <your-branch-name>
   ```

3. Open a pull request to the `development` branch.
4. Assign at least one reviewer and provide a detailed description of your changes.

## Code Review

All pull requests must be reviewed and approved before merging. Be responsive to feedback and address requested changes promptly.

---

## Thank You!

Your contributions help us build a better Meezak Technologies. Thank you for your time and effort!

