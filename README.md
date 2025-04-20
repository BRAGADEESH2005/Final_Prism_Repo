# AudioFinder - Voice Authentication System

AudioFinder is a mobile application that helps users distinguish between human voice, AI-generated voice, and non-speech audio using advanced machine learning algorithms. The system provides real-time analysis of audio files with confidence scores and allows users to provide feedback on classifications.

## Project Overview

AudioFinder consists of three main components:

- **Mobile App** - React Native application with Expo (Frontend)
- **Node.js API Server** - Express.js backend with MongoDB (Backend)
- **Python ML Server** - Flask server with machine learning models (Model API)

## Features

### Mobile App
- User authentication (login/register)
- Audio recording and file upload
- Real-time classification of audio files
- Voice recording with in-app audio playback
- User feedback system for improving model accuracy
- Profile dashboard with feedback history and statistics
- Admin portal for global statistics and monitoring

### API Server
- User authentication and management
- Audio file storage and management
- Feedback collection and analysis
- Stats and analytics endpoints
- Role-based access control

### ML Server
- Ensemble machine learning approach for audio classification
- Support for WAV, MP3, OGG, FLAC, and M4A audio formats
- Classification with confidence scores
- Feature extraction using Librosa

## Tech Stack

### Mobile App
- React Native with Expo
- Expo Router for navigation
- AsyncStorage for local storage
- Axios for API communication
- React Context for state management

### API Server
- Node.js with Express
- MongoDB with Mongoose
- JWT for authentication
- Multer for file uploads
- Bcrypt for password hashing

### ML Server
- Flask for API endpoints
- PyTorch for neural network model
- Scikit-learn for machine learning models
- Librosa for audio processing
- XGBoost, Random Forest, and SVM for ensemble methods

## Installation and Setup

### Prerequisites
- Node.js (v14+)
- Python 3.8+
- MongoDB
- Expo CLI

### Mobile App Setup
1. Clone the repository
2. Install dependencies
3. Update API configuration: Edit the `config/api.js` file to point to your backend server
4. Start the app

### API Server Setup
1. Navigate to the server directory
2. Install dependencies
3. Create a `.env` file with the necessary environment variables
4. Start the server

### ML Server Setup
1. Navigate to the ML server directory
2. Install dependencies
3. Start the ML server

## Usage

### User Flow
1. Register/Login to the app
2. Upload an audio file or record audio in the app
3. View classification results with confidence scores
4. Provide feedback on classification accuracy
5. View feedback history and statistics in profile

### Admin Access
Admin dashboard is available for monitoring all feedback and system performance:

- Access is restricted to authorized email (22z214@psgtech.ac.in)
- View global statistics and all user feedback
- Track classification accuracy and distribution

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users/stats` - Get user statistics
- `PUT /api/users/me` - Update user profile

### Feedback
- `POST /api/feedback` - Submit feedback
- `GET /api/feedback/my-feedback` - Get user's feedback
- `GET /api/feedback/all` - Get all feedback (admin only)

### ML Server
- `POST /predict` - Classify audio file
- `GET /health` - Check server status

## Design and Architecture

### Mobile App Architecture
The mobile app follows a component-based architecture with React Native and Expo. Key architectural points:

- Context API: Used for global state management (auth, theme, etc.)
- Expo Router: For declarative navigation and deep linking
- Custom Hooks: For reusable logic like audio recording and playback
- API Integration: Centralized API client with interceptors for auth tokens

### Backend Architecture
The Node.js backend follows a layered architecture:

- Routes Layer: API endpoint definitions
- Controller Layer: Business logic and request handling
- Model Layer: Data models and database interaction
- Middleware Layer: Authentication, error handling, etc.

### ML Server Architecture
The Python ML server employs an ensemble approach:

- Feature Extraction: Using Librosa to extract audio features
- Model Ensemble: Combining multiple classifiers for better accuracy
- API Layer: Flask endpoints for model inference
- Preprocessing: Audio normalization and feature standardization

## Security Considerations
- JWT-based authentication with token expiration
- Password hashing with bcrypt
- HTTPS for all API communications
- Input validation on both client and server
- Role-based access control for admin features
- Sanitization of user inputs to prevent injection attacks

## Future Enhancements
- Real-time Detection: Implement real-time voice analysis without recording
- Multiple Languages: Support for voice analysis in different languages
- Offline Mode: Enable basic functionality without internet connection
- Advanced Analytics: More detailed analytics with visualizations
- Integration: API for third-party applications to use AudioFinder services
- Multi-factor Authentication: Additional security layers for sensitive operations

## Troubleshooting

### Common Issues
**Audio Recording Issues:**
- Ensure microphone permissions are granted
- Check if device supports audio recording
- Verify audio format compatibility

**Classification Errors:**
- Make sure audio file is not corrupted
- Ensure sufficient audio length (minimum 3 seconds)
- Check if the audio contains actual speech

**Connection Problems:**
- Verify internet connectivity
- Check if backend servers are running
- Ensure correct API URLs in configuration

### Debugging Tips
- Enable debug mode in the app settings
- Check server logs for API errors
- Use network monitoring tools to inspect API calls
- Test ML server separately with sample audio files




## Acknowledgments
- Thanks to SAMSUNG PRISM for supporting this project
- Special thanks to open-source libraries that made this project possible
- Gratitude to all beta testers who provided valuable feedback