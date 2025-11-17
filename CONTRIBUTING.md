# Contributing to Open Story Video Debug Tool

Thank you for your interest in contributing to the Open Story Video Debug Tool! This document provides guidelines and information for contributors.

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Git
- Basic knowledge of React, TypeScript, and Next.js

### Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/open-story-video.git
   cd open-story-video
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Copy environment variables:
   ```bash
   cp .env.example .env.local
   ```
5. Run the development server:
   ```bash
   npm run dev
   ```

## Development Guidelines

### Code Style

- Use TypeScript for type safety
- Follow the existing code structure and naming conventions
- Use Tailwind CSS for styling
- Keep components small and focused
- Write clear, descriptive commit messages

### Project Structure

```
src/
├── app/              # Next.js app router pages
├── components/       # React components
├── stores/          # MobX state management
├── lib/             # Utility functions
└── utils/           # Helper functions
```

### Component Guidelines

- Use functional components with hooks
- Implement proper TypeScript types
- Add comments for complex logic
- Include error handling where appropriate
- Use MobX for state management when needed

## Submitting Changes

### Branch Naming

Use descriptive branch names:
- `feature/character-regeneration`
- `bugfix/api-error-handling`
- `docs/update-readme`

### Commit Messages

Follow conventional commits:
- `feat: add character confirmation step`
- `fix: resolve video export error`
- `docs: update installation guide`

### Pull Request Process

1. Update the README.md with details of changes if applicable
2. Update the documentation if needed
3. Ensure your PR description clearly describes the problem and solution
4. Link any relevant issues
5. Include screenshots for UI changes if applicable

## Testing

Before submitting, please:

1. Test your changes thoroughly
2. Check the browser console for errors
3. Test responsive design on different screen sizes
4. Verify all existing functionality still works

## Reporting Issues

When reporting bugs, please include:

- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Browser and OS information
- Screenshots if applicable

## Feature Requests

Feature requests are welcome! Please:

- Check existing issues first
- Provide clear description of the feature
- Explain the use case and benefits
- Consider if it aligns with project goals

## Code Review

All contributions require code review. Reviewers will check:

- Code quality and style
- TypeScript types
- Performance considerations
- Security implications
- Documentation completeness

## Community

- Be respectful and constructive
- Help others with their contributions
- Share knowledge and experience
- Follow the [Code of Conduct](CODE_OF_CONDUCT.md)

## Questions?

If you have questions about contributing:

- Check existing documentation
- Search existing issues
- Create a discussion in the repository
- Contact maintainers directly

Thank you for contributing to Open Story Video Debug Tool! 🎉