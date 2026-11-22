# Assistant

An AI-powered web assistant built with Django and Ollama, designed to
provide an interactive chat experience with local language models, web
search capabilities, and conversation management.

## Overview

Assistant is a web-based AI chatbot that uses locally hosted language
models through Ollama. It provides users with an interface to interact
with AI models, manage conversations, search the web, and keep track of
their token usage.

The project combines local AI inference with online search capabilities
in a single application.

## Features

### AI Chat

-   Interactive AI-powered conversations.
-   Streaming responses for a real-time chat experience.
-   Support for multiple language models.
-   Separate models for general conversations and coding tasks.
-   Persistent conversation history.
-   Conversation titles generated from the first message.

### Web Search

-   Integrated web search using DuckDuckGo.
-   AI-assisted search query generation.
-   Automatic extraction of webpage content.
-   Search results can be included as context for AI responses.

### Conversation Management

-   Create and manage multiple conversations.
-   Pin important conversations.
-   Delete conversations.
-   Store messages and conversation history in the database.
-   Automatic compression of older conversation history to manage
    context length.

### User Management

-   User registration and authentication.
-   User profiles.
-   Profile editing.
-   Password reset functionality.
-   Individual token balances.

### Token Management

-   Token counting using the Qwen3 tokenizer.
-   Token consumption tracking.
-   Different token refill amounts for Free and Pro plans.
-   Token balance monitoring.

### Additional Features

-   Light and dark themes.
-   REST API built with Django REST Framework.
-   Bale bot integration.
-   Django administration panel.

## Technologies

  Technology                Purpose
  ------------------------- ----------------------------------------
  Python                    Main programming language
  Django                    Backend framework
  Django REST Framework     REST API
  Ollama                    Local AI model execution
  Qwen3 8B                  General-purpose AI model and tokenizer
  Qwen2.5 Coder 7B          Coding model
  Hugging Face Tokenizers   Token counting
  DuckDuckGo Search         Web search
  Trafilatura               Webpage content extraction
  Requests                  HTTP communication
  JavaScript                Frontend interactions
  HTML & CSS                User interface
  SQLite                    Database

## AI Models

The project is currently configured to use:

  Model                Purpose
  -------------------- ---------------------------------------------------
  `qwen3:8b`           General conversations and search-query generation
  `qwen2.5-coder:7b`   Programming and code-related conversations

Model names and related settings are configured in
`assistant/settings.py`.

## Project Structure

``` text
assistant/
├── api/
│   ├── migrations/
│   ├── __init__.py
│   ├── admin.py
│   ├── apps.py
│   ├── models.py
│   ├── serializers.py
│   ├── tests.py
│   ├── urls.py
│   └── views.py
│
├── assistant/
│   ├── __init__.py
│   ├── asgi.py
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
│
├── chatbot/
│   ├── management/
│   │   └── commands/
│   ├── migrations/
│   ├── templates/
│   ├── __init__.py
│   ├── admin.py
│   ├── apps.py
│   ├── exceptions.py
│   ├── forms.py
│   ├── models.py
│   ├── tests.py
│   ├── urls.py
│   ├── utils.py
│   └── views.py
│
├── home/
│   ├── migrations/
│   ├── templates/
│   ├── __init__.py
│   ├── admin.py
│   ├── apps.py
│   ├── forms.py
│   ├── models.py
│   ├── signals.py
│   ├── tests.py
│   ├── urls.py
│   └── views.py
│
├── models/
│   └── qwen3-8b/
│
├── static/
├── templates/
├── .env
├── .gitignore
├── manage.py
├── requirements.txt
├── LICENSE.md
└── README.md
```

## Installation

### Prerequisites

Make sure the following are installed:

-   Python
-   Git
-   Ollama

### 1. Clone the repository

``` bash
git clone https://github.com/Aghilzoori/assistant.git
cd assistant
```

### 2. Create a virtual environment

``` bash
python -m venv venv
```

Activate it:

**Linux / macOS**

``` bash
source venv/bin/activate
```

**Windows**

``` powershell
venv\Scripts\activate
```

### 3. Install dependencies

``` bash
pip install -r requirements.txt
```

### 4. Download the AI models

Make sure Ollama is installed and running, then download the configured
models:

``` bash
ollama pull qwen3:8b
ollama pull qwen2.5-coder:7b
```

### 5. Configure environment variables

Create a `.env` file in the project root.

``` env
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=127.0.0.1,localhost

EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-email-app-password

BOT_TOKEN=your-bale-bot-token
```

The email and Bale bot variables are only needed if you use those
integrations.

**Important:** Do not commit your real `.env` file or secret credentials
to Git.

### 6. Apply database migrations

``` bash
python manage.py migrate
```

### 7. Create an administrator account

``` bash
python manage.py createsuperuser
```

### 8. Start the development server

``` bash
python manage.py runserver
```

Open the application at:

``` text
http://127.0.0.1:8000/
```

## API

The project includes a REST API powered by Django REST Framework.

  Endpoint            Method   Description
  ------------------- -------- -------------------------------------------
  `/api/`             GET      API test endpoint
  `/api/get-users/`   GET      Retrieve the authenticated user's profile

The API endpoints may require authentication, depending on the
configured permissions and authentication settings.

## Management Commands

The project includes custom Django management commands.

### Run the Bale bot

``` bash
python manage.py bale_bot
```

### Update user token balances

``` bash
python manage.py token
```

The token command adds: - 321 tokens to Free-plan users. - 876 tokens to
active Pro-plan users.

The command does not schedule itself. Run it manually or configure an
external scheduler if periodic refills are required.

## Configuration Notes

-   AI model names are configured in `assistant/settings.py`.
-   Ollama must be available to the Django application.
-   The Qwen3 tokenizer files are stored under `models/qwen3-8b/`.
-   Web search requires an internet connection.
-   Email functionality requires valid SMTP credentials.
-   Bale bot functionality requires a valid bot token.

## License

This project is licensed under the MIT License. See
[LICENSE.md](LICENSE.md) for the full license text.

------------------------------------------------------------------------

Developed by [Aghil Zoori](https://github.com/Aghilzoori).
