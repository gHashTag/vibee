# MCP Integration in Vibee

This document explains how Model Context Protocol (MCP) integration works in the Vibee project and how to make it "light up green in crush".

## Understanding MCP in Vibee

The Vibee project implements a complete Model Context Protocol (MCP) integration through the `avatarFacesPlugin`. This plugin provides:

- Full LoRA model training capabilities through fal.ai
- Flexible access to any fal.ai model endpoint
- Integration with Model Context Protocol for enhanced AI image generation
- Face-specific generation using trained LoRA models

## How Crush Recognizes MCP Integration

For Crush to light up MCP functionality in green, the following elements must be present:

1. **Service Declaration**: The service must properly declare itself as an MCP service
2. **Plugin Registration**: The plugin must be registered with the correct service type identifiers
3. **Configuration**: Environment variables and settings should be configured to enable MCP features

## Current Implementation Status

### Existing MCP Features:
- ✅ `FalMcpService` service that interfaces with fal.ai 
- ✅ `avatarFacesPlugin` properly registered in both `index.ts` and `character.ts`
- ✅ Support for LoRA model training and usage
- ✅ Support for multiple fal.ai models (flux-lora, flux-pro, etc.)

### Required Enhancements to Light Up in Crush:

## Enhancement: Add MCP Metadata Configuration

To make the system light up green in Crush, we need to ensure the following:

1. Update the `avatarFacesPlugin` configuration with proper MCP identification
2. Add environment variable documentation
3. Create clear integration guidelines

## Implementation Steps:

1. **Update Plugin Export**:
   - Ensure plugin properly declares MCP service types
   - Add documentation about MCP capability

2. **Environment Configuration**:
   - Required environment variable: `FAL_KEY`
   - Add to `.env.example` file for visibility

3. **Documentation Addition**:
   - Create clear mention of MCP capabilities in documentation
   - Explain how Crush identifies MCP integrations

## Environment Setup

To enable MCP functionality in Crush:

```bash
# In your .env file
FAL_KEY=your_fal_ai_api_key_here
```

For the integration to be recognized by Crush, it must be configured with:

1. A valid `FAL_KEY` for fal.ai access
2. The `avatarFacesPlugin` properly registered in the main plugin configuration
3. All associated services properly initialized

## Testing MCP Recognition

To verify Crush recognizes the MCP integration:

1. Start the Vibee application
2. Check that the `FAL_KEY` is in the environment
3. Confirm that `avatarFacesPlugin` is loaded
4. Look for logs indicating MCP service initialization