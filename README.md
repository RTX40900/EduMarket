# EduMarket

EduMarket is a decentralized platform that allows users to buy, sell, gift, and create educational courses using blockchain technology. This enables users to also make money by creating and selling their own courses.

The platform leverages smart contracts to ensure secure and transparent transactions. Users can connect their MetaMask wallet to interact with the platform.

Whenever someone purchases a course, the funds are transferred directly to the course author's wallet. This eliminates the need for intermediaries and ensures that authors receive their earnings instantly.

## Features

- **User Authentication**: Users can log in using Open Campus ID (OCID) for a seamless experience.
- **Wallet Connection**: Connect your MetaMask wallet for validation, purchasing, or gifting courses.
- **Instant Earnings**: Authors receive their earnings directly to their wallet upon course purchase.
- **Course Marketplace**: Browse and purchase available courses listed by various authors.
- **My Courses**: View and access courses you have purchased.
- **Create Course**: Authors can create and list their own courses on the platform. 

## Tech Stack

- **Frontend**: React, Next.js, Tailwind CSS
- **Blockchain**: Ethereum, Web3.js
- **Authentication**: Open Campus ID (OCID)

## Getting Started

### Prerequisites

- Node.js
- MetaMask extension installed in your browser
- Ethereum wallet with some ETH for transactions

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/RTX40900/edumarket.git
   cd edumarket
   ```

2. Install dependencies:
   ```bash
   npm install
   ```


4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Usage

### Authentication

Users can log in using their Open Campus ID. The login button is available on the homepage if the user is not authenticated.

### Connecting Wallet

To interact with the platform, users need to connect their MetaMask wallet. The option to connect the wallet is available on the homepage and other relevant pages.

### Browsing Courses

Users can browse available courses on the "Buy Courses" page. Each course displays its title, description, price, and author.

### Purchasing Courses

To purchase a course, click the "Purchase" button on the course card. Ensure your MetaMask wallet is connected and has sufficient funds.

### Gifting Courses

Users can gift a course to another Ethereum address by clicking the "Gift" button on the course card.

### Viewing Purchased Courses

Purchased courses are listed on the "My Courses" page. Users can click "Open" to view the course content.

### Creating Courses

Authors can create new courses by navigating to the "Create Course" page. Fill in the course details and submit the form to list the course on the platform.

## Code Structure

- `frontend/app/page.tsx`: Main application page
- `frontend/components/Header.tsx`: Header component
- `frontend/app/buy-courses/page.tsx`: Buy Courses page
- `frontend/app/my-courses/page.tsx`: My Courses page
- `frontend/app/create-course/page.tsx`: Create Course page
- `frontend/app/course/[id]/page.tsx`: Course detail page
- `frontend/app/user/page.tsx`: User profile page
- `frontend/app/constants.ts`: Constants used in the application

## Smart Contract

The smart contract for course storage is located in the backend folder


## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.
