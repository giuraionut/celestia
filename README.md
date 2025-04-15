# Celestia (Reddit-Inspired Forum)

Celestia is a web application built with [Next.js](https://nextjs.org) inspired by platforms like Reddit. It provides a space for users to create communities, share posts (text and images), engage in discussions through comments, and interact with content via voting, saving, and hiding.

This project serves as a practical example of building a full-stack application using modern web technologies, focusing on server components, server actions, and efficient data handling.

## Key Features

*   **Community Management:** Create and browse topic-specific communities.
*   **Post Creation:** Share text-based content or upload images.
*   **Commenting System:** Engage in hierarchical discussions on posts.
*   **Voting:** Upvote or downvote posts to influence visibility.
*   **Post Interaction:** Save posts for later viewing or hide posts from your feed.
*   **Content Discovery:** Sort posts by various criteria (e.g., Newest, Top).
*   **Search:** Utilize Full-Text Search (FTS) powered by Prisma/SQLite to find posts.
*   **User Profiles:** View user activity and contributions.
* **NextAuth:** Authentication with nextauth.

## Tech Stack

*   **Framework:** [Next.js](https://nextjs.org/) (App Router)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **ORM:** [Prisma](https://www.prisma.io/)
*   **Database:** [SQLite](https://www.sqlite.org/index.html)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **Font:** [Geist](https://vercel.com/font) (via `next/font`)

## Getting Started

Follow these instructions to get a local copy up and running for development and testing purposes.

### Prerequisites

*   [Node.js](https://nodejs.org/) (Version 18.x or later recommended)
*   A package manager: [npm](https://www.npmjs.com/), [yarn](https://yarnpkg.com/), [pnpm](https://pnpm.io/), or [bun](https://bun.sh/)

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/your-repo-name.git
    cd your-repo-name
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    # or
    bun install
    ```

3.  **Set up environment variables:**
    *   Create a `.env` file in the root of the project and provide the `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_SECRET` and `NEXTAUTH_URL` to get started.

4.  **Set up the database:**
    *   Generate the Prisma Client based on your schema:
        ```bash
        npx prisma generate
        ```
    *   Push the schema changes to create your SQLite database file (`dev.db` by default):
        ```bash
        npx prisma db push
        ```
        *(Note: For production or more complex scenarios, you might use `prisma migrate dev` instead, but `db push` is simpler for quick local setup with SQLite).*

5.  **Run the development server:**
    ```bash
    npm run dev
    # or
    yarn dev
    # or
    pnpm dev
    # or
    bun dev
    ```

6.  **Open the application:**
    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Learn More About Next.js

To learn more about Next.js, take a look at the following resources:

*   [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
*   [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
