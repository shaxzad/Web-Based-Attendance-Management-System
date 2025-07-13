# Frontend Development Rules

## TypeScript
- Use strict TypeScript configuration
- Define proper interfaces for all API responses
- Use type guards for runtime type checking
- Prefer `const` over `let` when possible
- Use proper generic types for reusable components

## React Components
- Use functional components with hooks
- Implement proper error boundaries
- Use React.memo for performance optimization when needed
- Follow the single responsibility principle
- Use proper prop types and default values

## State Management
- Use TanStack Query for server state management
- Use React hooks for local component state
- Implement proper loading and error states
- Use optimistic updates where appropriate
- Cache API responses efficiently

## UI/UX Guidelines
- Use Chakra UI components consistently
- Implement dark mode support
- Ensure responsive design for all screen sizes
- Use proper accessibility attributes
- Follow consistent spacing and typography

## Routing
- Use TanStack Router for navigation
- Implement proper route guards for protected routes
- Use lazy loading for route components
- Handle 404 pages gracefully
- Implement proper breadcrumbs

## Code Quality Standards
- Use Biome for linting and formatting
- Enable strict TypeScript checks
- Use ESLint rules for React best practices
- Write JSDoc comments for complex functions
- Use proper error handling with try-catch

## File Organization
```
frontend/src/
├── components/       # Reusable UI components
├── hooks/           # Custom React hooks
├── routes/          # Route components
├── client/          # API client and types
├── theme/           # Chakra UI theme configuration
└── utils/           # Utility functions
```

## Component Structure
- Keep components small and focused
- Use composition over inheritance
- Implement proper prop validation
- Use custom hooks for reusable logic
- Follow consistent naming conventions

## Performance Guidelines
- Use lazy loading for route components
- Implement proper memoization
- Optimize bundle size with code splitting
- Use React DevTools for performance profiling
- Minimize re-renders with proper dependencies

## Accessibility
- Use semantic HTML elements
- Implement proper ARIA attributes
- Ensure keyboard navigation support
- Provide alt text for images
- Test with screen readers 