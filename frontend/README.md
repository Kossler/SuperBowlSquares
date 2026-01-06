# Frontend Setup and Running Guide

## Prerequisites

- Node.js 18+ and npm

## Installation

```bash
npm install
```

## Running the Application

### Development Mode

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## Environment Variables

Create a `.env` file in the frontend directory (if needed):

```env
VITE_API_URL=http://localhost:8080/api
```

## Project Structure

```
frontend/
├── public/           # Static assets
├── src/
│   ├── components/   # Reusable React components
│   ├── pages/        # Page components
│   ├── services/     # API service functions
│   ├── utils/        # Utility functions
│   ├── App.jsx       # Main app component
│   ├── main.jsx      # Entry point
│   └── index.css     # Global styles
├── index.html        # HTML template
├── package.json      # Dependencies
└── vite.config.js    # Vite configuration
```

## Features

### User Features
- User registration with up to 9 profiles
- Login/logout functionality
- View all active pools and squares grids
- Claim squares for betting
- Real-time score updates
- View personal squares (highlighted in blue)

### Admin Features
- Create new pools with custom payouts
- Toggle pool active/inactive status
- Update game scores for each quarter
- View all winners with payment information

## API Integration

The frontend communicates with the backend API through:
- `src/services/api.js` - Axios instance with JWT token handling
- `src/services/squaresService.js` - All API endpoint functions

## Authentication

- JWT tokens stored in localStorage
- Automatic token injection in API requests
- Protected routes for authenticated users
- Role-based access for admin features

## Styling

- Custom CSS with responsive design
- Color-coded grid squares:
  - Light gray: Available
  - Green: Claimed by others
  - Light blue: Your squares

## Troubleshooting

### API Connection Issues
- Verify backend is running on port 8080
- Check proxy configuration in `vite.config.js`
- Ensure CORS is properly configured on backend

### Build Issues
- Clear node_modules: `rm -rf node_modules && npm install`
- Clear build cache: `rm -rf dist`

### Authentication Issues
- Clear localStorage in browser DevTools
- Verify JWT token format
- Check token expiration
