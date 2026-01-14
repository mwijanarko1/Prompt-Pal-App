# Connecting Prompt-Pal-App with prompt-pal-api

This guide explains how to connect your React Native mobile app with your Strapi backend API.

## Prerequisites

1. **Strapi Backend Running**: Make sure your `prompt-pal-api` is running
   ```bash
   cd prompt-pal-api
   npm run develop
   ```
   The API should be available at `http://localhost:1337` by default.

2. **Network Configuration**: 
   - For **iOS Simulator**: Use `http://localhost:1337`
   - For **Android Emulator**: Use `http://10.0.2.2:1337` (Android emulator maps localhost differently)
   - For **Physical Device**: Use your computer's local IP address (e.g., `http://192.168.1.100:1337`)

## Setup Steps

### 1. Create Environment File

Create a `.env` file in the `PromptPal` directory:

```bash
cd PromptPal
touch .env
```

Add the following content (adjust the URL based on your setup):

```env
# API Configuration
# For iOS Simulator or web:
EXPO_PUBLIC_API_URL=http://localhost:1337

# For Android Emulator:
# EXPO_PUBLIC_API_URL=http://10.0.2.2:1337

# For Physical Device (replace with your computer's IP):
# EXPO_PUBLIC_API_URL=http://192.168.1.100:1337

# Optional: Gemini API Key (if using direct Gemini calls instead of backend)
# EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
```

### 2. Install Dependencies

The app should already have the necessary dependencies. If not, ensure you have:

```bash
npm install
```

### 3. Restart Expo

After creating the `.env` file, restart your Expo development server:

```bash
npm start
```

Then press `r` to reload the app.

## How It Works

### API Client (`src/lib/api.ts`)

The API client handles all communication with your Strapi backend:

- **Task Management**: Fetch daily tasks, user tasks, image tasks
- **Image Generation**: Generate images via backend API
- **Image Evaluation**: Compare user-generated images with target images
- **User Management**: Create users, fetch user data
- **Submissions**: Submit solutions and check results
- **Progress Tracking**: Get user streaks, completed tasks, results

### Level Data (`src/features/levels/data.ts`)

The level data service:
- First tries to fetch tasks from the API
- Falls back to hardcoded levels if API is unavailable
- Converts API task format to app's Level format

### Gemini Service (`src/lib/gemini.ts`)

The Gemini service:
- Uses backend API for image generation and evaluation (if `EXPO_PUBLIC_API_URL` is set)
- Falls back to placeholder/mock functions if API is unavailable
- Can be configured to use direct Gemini API calls instead

## Available API Endpoints

Your Strapi backend provides these endpoints (via `/api/analyzer/`):

### Tasks
- `GET /api/analyzer/daily-tasks` - Get all daily tasks
- `GET /api/analyzer/tasks/:taskId` - Get a specific task
- `GET /api/analyzer/users/:userId/tasks` - Get user's tasks
- `GET /api/analyzer/users/:userId/image-tasks` - Get user's image tasks

### Image Operations
- `POST /api/analyzer/generate-image` - Generate image from prompt
- `POST /api/analyzer/evaluate-images` - Compare two images

### User Management
- `POST /api/analyzer/users/create` - Create new user
- `GET /api/analyzer/users/:userId` - Get user by ID
- `GET /api/analyzer/users/external/:externalId` - Get user by external ID

### Submissions & Results
- `POST /api/analyzer/users/:userId/submit` - Submit solution
- `GET /api/analyzer/submissions/:submissionId/check` - Check submission status
- `GET /api/analyzer/users/:userId/results` - Get user results
- `GET /api/analyzer/users/:userId/completed-tasks` - Get completed tasks

### Progress Tracking
- `GET /api/analyzer/users/:userId/streak` - Get user streak
- `GET /api/analyzer/streak-leaderboard` - Get leaderboard

## Testing the Connection

1. **Check API is Running**:
   ```bash
   curl http://localhost:1337/api/analyzer/daily-tasks
   ```

2. **Test in App**:
   - Open the app
   - Navigate to a game level
   - The app should fetch tasks from the API
   - Check the console logs for API calls

3. **Verify Image Generation**:
   - Enter a prompt in a game level
   - Click "Generate"
   - The image should be generated via the backend API

## Troubleshooting

### "Network error" or "Failed to fetch"
- Check that the Strapi backend is running
- Verify the `EXPO_PUBLIC_API_URL` is correct
- For physical devices, ensure both devices are on the same network
- Check firewall settings

### "Level not found"
- The API might not have tasks yet
- The app will fall back to hardcoded levels
- Create tasks in Strapi admin panel

### CORS Issues
- Make sure Strapi CORS is configured to allow your app's origin
- Check `config/middlewares.ts` in your Strapi project

### Images Not Loading
- Check that image URLs from API are accessible
- Verify Strapi media upload configuration
- Check Supabase/upload provider settings if using cloud storage

## Next Steps

1. **Create Tasks in Strapi**: Use the Strapi admin panel to create tasks with images
2. **User Authentication**: Implement user login/registration to track progress
3. **Progress Sync**: Sync game progress with backend
4. **Real Scoring**: Use the backend's image evaluation for accurate scoring

## Development vs Production

- **Development**: Use `http://localhost:1337` or local IP
- **Production**: Update `EXPO_PUBLIC_API_URL` to your production API URL
- Consider using environment-specific config files
