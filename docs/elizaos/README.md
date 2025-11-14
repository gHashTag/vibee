# elizaOS Documentation

> Auto-updated documentation from https://docs.elizaos.ai
>
> Last updated: 2025-11-13

This directory contains automatically updated documentation from the elizaOS project.

## Available Documentation

- [Character Interface](character-interface.md) - Creating and configuring AI agents
- [Quickstart Guide](quickstart.md) - Get started in 3 minutes
- [Plugin Architecture](plugins-architecture.md) - Plugin system overview
- [Environment Variables](environment-variables.md) - Configuration and secrets
- [Create a Plugin](create-a-plugin.md) - Plugin development guide
- [Memory and State](memory-and-state.md) - Agent memory system

## Auto-Update Script

To update documentation, run:
```bash
./scripts/update-eliza-docs.sh
```

This script will:
1. Backup existing documentation
2. Fetch latest versions from docs.elizaos.ai
3. Convert to Markdown format
4. Update this index

## Notes

- Documentation is updated automatically but may require manual review
- Always refer to the official documentation at https://docs.elizaos.ai for the latest updates
- To disable auto-updates, remove or rename this script
