# Avatar Faces Plugin - MCP Integration

This plugin provides complete Model Context Protocol (MCP) integration for managing avatar faces through LoRA models.

## MCP Capabilities

- **LoRA Model Training**: Train custom face models using fal.ai
- **Flexible Model Access**: Access any fal.ai model endpoint through MCP
- **Face-Specific Generation**: Generate images with trained avatar faces
- **Multi-Model Support**: Works with flux-lora, flux-pro, flux-dev, and other fal.ai models

## Configuration

To enable MCP functionality in Crush:

1. Set `FAL_KEY` environment variable with valid fal.ai API key
2. Ensure `avatarFacesPlugin` is registered in plugin configuration
3. The plugin will automatically initialize MCP services when properly configured

## Integration Points

- `/face add` - Add new face to personal collection
- `/face train` - Train LoRA model for a face 
- `/face use` - Set default face for generation
- `/neurophoto` - Generate images with specific faces (MCP-enabled)