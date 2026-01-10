# Contributing to ComfyUI Christmas Theme

First off, thank you for considering contributing to the ComfyUI Christmas Theme! Your help is greatly appreciated.

## How Can I Contribute?

There are many ways to contribute, from reporting bugs to suggesting new features or submitting pull requests.

### Reporting Bugs

If you encounter a bug, please open an issue on our [GitHub issue tracker](https://github.com/AEmotionStudio/ComfyUI-ChristmasTheme/issues). Please include the following information:

- A clear and descriptive title.
- A detailed description of the bug, including steps to reproduce it.
- Your ComfyUI version and browser information.
- Any relevant screenshots or error messages.

### Pull Requests

We welcome pull requests!

1. Fork the repository.
2. Create a new branch for your changes (`git checkout -b feature/your-feature-name`).
3. Make your changes and commit them with a clear and descriptive commit message.
4. Push your changes to your fork (`git push origin feature/your-feature-name`).
5. Open a pull request to the `main` branch of this repository.

## Development Setup

The project has recently migrated to **TypeScript** for improved stability and developer experience.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [pnpm](https://pnpm.io/) (preferred), npm, or yarn

### Setup Instructions

1.  Clone the repository into your `ComfyUI/custom_nodes` folder.
2.  Install dependencies:
    ```bash
    pnpm install
    ```

### Workflow Commands

| Command | Description |
| :--- | :--- |
| `pnpm run dev` | Watch mode: Automatically rebuilds TypeScript to JavaScript on change. |
| `pnpm run build` | One-time production build. |
| `pnpm run typecheck` | Run the TypeScript compiler to check for type errors. |
| `pnpm run test` | Run Unit and Integration tests using **Vitest**. |
| `pnpm run test:e2e` | Run End-to-End tests using **Playwright**. |

## Project Structure

- **`src/`**: Contains the TypeScript source code. **Always edit files here.**
- **`js/`**: Contains the compiled JavaScript files. (Do not edit these manually).
- **`tests/`**: Contains End-to-End test suites.
- **`__init__.py`**: ComfyUI entry point (Python).

## Code Style

- Use TypeScript for all new logic.
- Ensure all tests pass before submitting a PR.
- Document new features in the code and update the README if necessary.

Thank you for your contributions!
