# Quickstart Guide

> Create and run your first elizaOS agent in 3 minutes

## Create Your First Agent

Let's create a project with our default Eliza character that can chat and take actions.

### Step 1: Create Your Project
Create a new elizaOS project using the interactive CLI:

```bash
elizaos create
```

### Step 2: Configure Your Project
During the interactive setup, you'll be prompted to make the following selections:

1. **Project Name**: Enter your desired project name
2. **Database**: Select `pglite` for a lightweight, local PostgreSQL option
3. **Model Provider**: Select `OpenAI` for this quickstart guide
4. **API Key**: You'll be prompted to enter your OpenAI API key

### Step 3: Navigate to Your Project
Change directory to your newly created project (replace with your project name):

```bash
cd my-eliza-project
```

### Step 4: Start Your Agent
Launch your elizaOS project:

```bash
elizaos start
```

Wait a few seconds for the server to start up.

### Step 5: Chat with Your Agent
Open your browser and navigate to:

```
http://localhost:3000
```

Start chatting with Eliza through the web interface!

## Environment Variables

Make sure these are set correctly in your `.env` file:

```
OPENAI_API_KEY=your-actual-api-key-here
PGLITE_DATA_DIR=/path/to/your/project/.eliza/.elizadb
```

## Troubleshooting

### API Key Issues
If you're getting authentication or configuration errors:

* OpenAI API key is missing, invalid, or has extra spaces/quotes
* Wrong OpenAI API key format (should start with `sk-`)
* OpenAI account has no credits remaining

### Database Connection Issues
If you're having database issues, check your `.env` file for the database path:

```
PGLITE_DATA_DIR=/path/to/your/project/.eliza/.elizadb
```

### Other Common Issues
**When in doubt, turn it off and on again:**

* Stop the server with `Ctrl+C`, then start it again with `elizaos start`
* Check the [installation guide](/installation) to confirm you installed everything correctly
