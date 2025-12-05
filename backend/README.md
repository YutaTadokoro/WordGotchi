# Installation
Install the project dependencies and create the virtual environment:

`uv sync`

# Setup
Configure the environment variables by copying the example file.

`cp .env.example .env`

Please enter your Claude API key for `ANTHROPIC_API_KEY` and your Gemini API key for `GOOGLE_GENAI_API_KEY`.

# Running the App
Start the development server with hot-reloading enabled:

`uv run fastapi dev`

The application will be available at http://127.0.0.1:8000.

Add http://127.0.0.1:8000 to frontend/.env
