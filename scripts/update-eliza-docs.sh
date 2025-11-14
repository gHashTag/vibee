#!/bin/bash

# Script to update elizaOS documentation automatically
# Creates a backup of existing docs and fetches the latest version

set -e  # Exit on any error

echo "🔄 Starting elizaOS documentation update..."

# Define variables
DOCS_DIR="$(pwd)/docs/elizaos"
BACKUP_DIR="$(pwd)/docs/elizaos-backup-$(date +%Y%m%d_%H%M%S)"
TEMP_DIR="/tmp/elizaos-docs-update"

# Create backup of existing documentation
echo "📦 Creating backup of existing documentation..."
if [ -d "$DOCS_DIR" ]; then
    cp -r "$DOCS_DIR" "$BACKUP_DIR"
    echo "✅ Backup created at: $BACKUP_DIR"
else
    echo "⚠️  No existing docs directory found, skipping backup"
fi

# Create temp directory
mkdir -p "$TEMP_DIR"

# Define documentation pages to fetch
DOCS=(
    "https://docs.elizaos.ai/agents/character-interface"
    "https://docs.elizaos.ai/quickstart"
    "https://docs.elizaos.ai/plugins/architecture"
    "https://docs.elizaos.ai/projects/environment-variables"
    "https://docs.elizaos.ai/guides/create-a-plugin"
    "https://docs.elizaos.ai/agents/memory-and-state"
)

echo "📥 Fetching documentation pages..."

# Fetch each documentation page
for url in "${DOCS[@]}"; do
    echo "  Fetching: $url"

    # Extract filename from URL
    filename=$(echo "$url" | sed 's|.*/||' | sed 's|\?.*||')
    output_file="$TEMP_DIR/$filename.html"

    # Use curl to fetch content
    if curl -sL "$url" -o "$output_file"; then
        echo "  ✅ Downloaded: $filename"
    else
        echo "  ❌ Failed to download: $filename"
    fi
done

# Process HTML files and convert to Markdown
echo "🔄 Converting HTML to Markdown..."
for html_file in "$TEMP_DIR"/*.html; do
    if [ -f "$html_file" ]; then
        filename=$(basename "$html_file" .html)

        # Check if we have pandoc
        if command -v pandoc &> /dev/null; then
            echo "  Converting with pandoc: $filename"
            pandoc "$html_file" -t markdown -o "$DOCS_DIR/${filename}.md" \
                --wrap=none \
                --markdown-headings=atx \
                --reference-links
        else
            echo "  ⚠️  Pandoc not found, creating placeholder for: $filename"
            cat > "$DOCS_DIR/${filename}.md" << EOF
# $filename

> This page was automatically updated on $(date)
>
> To view the full content, visit: https://docs.elizaos.ai/${filename}

$(curl -sL "$url" | grep -o '<title[^>]*>[^<]*</title>' | sed 's/<[^>]*>//g' | head -1 || echo "Documentation")

## Content

The full documentation for this section is available at:
https://docs.elizaos.ai/${filename}

Please refer to the official documentation for the most up-to-date information.
EOF
        fi
    fi
done

# Update index
echo "📝 Creating documentation index..."
cat > "$DOCS_DIR/README.md" << EOF
# elizaOS Documentation

> Auto-updated documentation from https://docs.elizaos.ai
>
> Last updated: $(date)

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
\`\`\`bash
./scripts/update-eliza-docs.sh
\`\`\`

This script will:
1. Backup existing documentation
2. Fetch latest versions from docs.elizaos.ai
3. Convert to Markdown format
4. Update this index

## Notes

- Documentation is updated automatically but may require manual review
- Always refer to the official documentation at https://docs.elizaos.ai for the latest updates
- To disable auto-updates, remove or rename this script

EOF

# Cleanup
echo "🧹 Cleaning up temporary files..."
rm -rf "$TEMP_DIR"

echo ""
echo "✅ Documentation update complete!"
echo ""
echo "Summary:"
echo "  - Backup created at: $BACKUP_DIR"
echo "  - Documentation updated at: $DOCS_DIR"
echo "  - Index created at: $DOCS_DIR/README.md"
echo ""
echo "To review changes, run:"
echo "  diff -r $BACKUP_DIR $DOCS_DIR"
echo ""
echo "To disable auto-updates in the future, remove:"
echo "  ./scripts/update-eliza-docs.sh"
