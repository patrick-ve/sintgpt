# Nuxt 3 Starter Template 🚀

A modern, feature-rich Nuxt 3 starter template with TypeScript, testing setup, and best practices pre-configured.

## Features

- ⚡️ [Nuxt 3](https://nuxt.com) - The Vue Framework
- 🎨 [Nuxt UI](https://ui.nuxt.com) - UI Components
- 🎯 [TypeScript](https://www.typescriptlang.org) - Type Safety
- 🧪 [Vitest](https://vitest.dev) - Unit Testing
- 🎭 [Playwright](https://playwright.dev) - E2E Testing
- 📦 [VueUse](https://vueuse.org) - Collection of Vue Composition Utilities
- 🌙 [Color Mode](https://color-mode.nuxtjs.org) - Dark/Light Mode Support
- 🖼️ [Nuxt Image](https://image.nuxt.com) - Image Optimization
- 📝 [ESLint](https://eslint.org) - Code Linting
- 🐶 [Husky](https://typicode.github.io/husky) - Git Hooks

## Quick Start

```bash
# Clone the repository
git clone [your-repo-url]

# Install dependencies
yarn install

# Start development server
yarn dev

# Build for production
yarn build

# Preview production build
yarn preview
```

## Development

### Scripts

- `yarn dev` - Start development server
- `yarn build` - Build for production
- `yarn generate` - Generate static site
- `yarn preview` - Preview production build
- `yarn unit` - Run unit tests
- `yarn unit:ui` - Run unit tests with UI
- `yarn unit:coverage` - Run unit tests with coverage
- `yarn e2e` - Run E2E tests
- `yarn e2e:ui` - Run E2E tests with UI
- `yarn e2e:update` - Update E2E test snapshots

### Testing

This template includes both unit testing with Vitest and E2E testing with Playwright.

#### Unit Testing

```bash
# Run unit tests
yarn unit

# Run unit tests with UI
yarn unit:ui

# Run unit tests with coverage
yarn unit:coverage
```

#### E2E Testing

```bash
# Run E2E tests
yarn e2e

# Run E2E tests with UI
yarn e2e:ui

# Update E2E test snapshots
yarn e2e:update
```

## Project Structure

```
├── components/     # Vue components
├── composables/    # Vue composables
├── layouts/        # Page layouts
├── pages/         # Application pages
├── public/        # Static assets
├── server/        # Server-side code
├── stores/        # Pinia stores
└── types/         # TypeScript types
```

## Environment Variables

Create a `.env` file in the root directory:

```env
# Add your environment variables here
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
