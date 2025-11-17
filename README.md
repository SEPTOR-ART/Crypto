# CryptoZen - Modern Cryptocurrency Exchange Platform

CryptoZen is a modern, secure cryptocurrency exchange platform with an Asian-inspired aesthetic. It allows users to purchase popular cryptocurrencies including Bitcoin (BTC), Ethereum (ETH), Litecoin (LTC), and Ripple (XRP) using multiple payment methods.

## Features

### Frontend (Client)
- **Modern UI/UX**: Built with Next.js for a fast, responsive experience
- **Asian-Inspired Design**: Unique aesthetic with parallax scrolling effects and smooth animations
- **Real-time Price Tracking**: Live cryptocurrency price displays
- **User Authentication**: Secure login and registration system
- **Multi-page Application**: Dashboard, trading, wallet, settings, and admin interfaces
- **Integrated Chat Support**: Real-time customer support chat functionality
- **Responsive Design**: Works on all device sizes

### Backend (Server)
- **RESTful API**: Built with Node.js and Express
- **Database**: MongoDB integration with Mongoose ODM
- **Authentication**: JWT-based authentication with password encryption
- **Security**: Helmet.js for HTTP headers security, CORS support
- **User Management**: Complete user registration, login, and profile management
- **Transaction Processing**: Buy/sell transaction handling

## Technologies Used

### Frontend
- Next.js
- React
- CSS Modules
- JavaScript (ES6+)

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JSON Web Tokens (JWT)
- Bcrypt.js
- Helmet.js
- CORS

## Project Structure

```
Crypto/
├── client/              # Next.js frontend
│   ├── components/      # Reusable UI components
│   ├── context/         # React context for state management
│   ├── pages/           # Next.js pages
│   ├── services/        # API service layer
│   ├── styles/          # CSS modules
│   └── ...
├── server/              # Node.js backend
│   ├── config/          # Configuration files
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Custom middleware
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   └── ...
└── README.md
```

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd Crypto
   ```

2. **Install frontend dependencies:**
   ```bash
   cd client
   npm install
   ```

3. **Install backend dependencies:**
   ```bash
   cd ../server
   npm install
   ```

4. **Configure environment variables:**
   - Create a `.env` file in the `server` directory
   - Add the following variables:
     ```
     PORT=5000
     NODE_ENV=development
     JWT_SECRET=your_jwt_secret_key_here
     MONGODB_URI=your_mongodb_connection_string
     ```

### Running the Application

1. **Start the backend server:**
   ```bash
   cd server
   npm run dev
   ```

2. **Start the frontend development server:**
   ```bash
   cd client
   npm run dev
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## API Endpoints

### Authentication
- `POST /api/users` - Register a new user
- `POST /api/users/login` - Login user

### User Profile
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

### Cryptocurrency Data
- `GET /api/prices` - Get current cryptocurrency prices
- `GET /api/assets` - Get available cryptocurrency assets

### Transactions
- `POST /api/transactions` - Create a new transaction
- `GET /api/transactions` - Get user transactions
- `GET /api/transactions/:id` - Get transaction by ID
- `PUT /api/transactions/:id` - Update transaction status

## Security Features

- **Password Encryption**: Bcrypt.js for secure password hashing
- **JWT Authentication**: Token-based authentication for secure API access
- **Input Validation**: Server-side validation for all user inputs
- **HTTP Headers Security**: Helmet.js for secure HTTP headers
- **CORS Protection**: Cross-Origin Resource Sharing protection
- **Rate Limiting**: (To be implemented) API rate limiting for DDoS protection

## Future Enhancements

- Implement real-time cryptocurrency price updates using WebSocket
- Add multi-factor authentication (MFA)
- Integrate with actual cryptocurrency wallets and exchanges
- Implement advanced trading features (limit orders, stop-loss, etc.)
- Add admin dashboard for platform management
- Implement KYC (Know Your Customer) verification process
- Add support for more cryptocurrencies
- Implement advanced charting and analytics

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by modern cryptocurrency exchanges
- Asian-inspired design elements for a unique user experience
- Built with security and user experience as top priorities