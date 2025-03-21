# HYDRA-AI Frontend

HYDRA-AI is a modern AI chat application built with React, TypeScript, and Tailwind CSS. The project utilizes the latest web technology stack to provide a smooth, responsive user experience.

## Features

- 🔐 User authentication system
- 💬 Real-time AI chat functionality
- 🎨 Modern UI, using Tailwind CSS and Shadcn components
- 📱 Responsive design, compatible with various devices
- 🚀 Built with Vite, providing a fast development experience

## Tech Stack

- **Framework**: React 18
- **Routing**: React Router v7
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI / Shadcn
- **Build Tool**: Vite
- **Package Manager**: pnpm
- **Language**: TypeScript
- **Animation**: Framer Motion

## Development Environment Setup

### Prerequisites

- Node.js (Recommended v18+)
- pnpm (v10+)

### Installation

1. Clone the repository

```bash
git clone https://your-repository-url/hydra-front.git
cd hydra-front
```

2. Install dependencies

```bash
pnpm install
```

3. Configure environment variables

Create a `.env.local` file (or edit the existing one):

```
VITE_API_BASE_URL=your_api_endpoint
```

4. Start the development server

```bash
pnpm dev
```

The application will run on [http://localhost:5173](http://localhost:5173).

## Build and Deployment

### Production Build

```bash
pnpm build
```

The built files will be located in the `dist` directory.

### Deployment Process

#### Using Caddy Server (Recommended)

1. Install Caddy Server
   
   Please refer to the [Caddy official documentation](https://caddyserver.com/docs/install) for installation.

2. Configure Caddyfile

   Create or edit the Caddyfile:

   ```
   your-domain.com {
     root * /path/to/hydra-front/dist
     
     # Set up SPA routing
     try_files {path} {path}/ /index.html
     
     # Define static resource matcher
     @static {
       path *.css *.js *.ico *.gif *.jpg *.jpeg *.png *.svg *.webp *.woff *.woff2
     }
     
     # Static resource cache settings
     header @static Cache-Control "public, max-age=31536000, immutable"
     
     # HTML file cache settings
     @html {
       path *.html
     }
     header @html Cache-Control "no-cache, no-store, must-revalidate"
     
     # API proxy settings (if needed)
     reverse_proxy /api/* your_backend_api_server
     
     # Enable file server
     file_server
   }
   ```

3. Start Caddy Server

   ```bash
   caddy run
   ```

#### Using Docker Deployment

1. Use Dockerfile

   The project already includes a Dockerfile, which can be built directly:

   ```bash
   docker build -t hydra-front .
   docker run -d -p 80:80 hydra-front
   ```

2. Use docker-compose

   The project provides a docker-compose.yml file, which can be used to deploy both the frontend and backend:

   ```bash
   # Start the service
   docker-compose up -d
   
   # View logs
   docker-compose logs -f
   
   # Stop the service
   docker-compose down
   ```

   Note: Please adjust the configuration in docker-compose.yml according to your actual situation before using it.

## Environment Variables

- `VITE_API_BASE_URL`: API server base URL
- `VITE_BASE_URL`: Optional alternative API base URL (for development/testing)

## Project Structure

```
src/
├── components/       # Reusable components
├── contexts/         # React contexts
├── hooks/            # Custom React hooks
├── layouts/          # Layout components
├── lib/              # General utility functions
├── pages/            # Page components
├── types/            # TypeScript type definitions
├── App.tsx           # Main application component
├── Login.tsx         # Login page
├── index.css         # Global styles
└── main.tsx          # Application entry point
```

## Development Guide

### Adding a new page

1. Create a new page component in the `src/pages` directory
2. Add a new route to `src/App.tsx` for the new page

### Style Guide

The project uses Tailwind CSS, following these conventions:

- Use Tailwind classes for styling
- Use custom classes to extend Tailwind, such as `.text-shadow-white` and `.text-shadow-blue`

## Troubleshooting

### API connection issues

Ensure your `.env.local` file has the correct API endpoint configuration. For development, you may need to resolve CORS issues.

### Build failed

If the build fails, please try the following steps:

1. Delete the `node_modules` and `dist` directories
2. Reinstall dependencies: `pnpm install`
3. Rebuild: `pnpm build`

## Contribution

Welcome to contribute! Please follow the following steps:

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

[Apache 2.0](LICENSE) 