# Assistant

An AI-powered web assistant built with Django and Ollama. It provides a
chat interface for locally hosted language models, optional web search,
conversation management, and per-user token tracking.

## Overview

Assistant is a Django-based web application that connects to Ollama for
local AI inference. Users can hold conversations, choose between
general-purpose and coding models, optionally include web search results
in AI responses, and manage their chat history.

## Features

### AI Chat

-   Stream AI responses as they are generated.
-   Use separate models for general conversations and coding tasks.
-   Save conversations and messages.
-   Start new conversations and revisit previous chats.

### Web Search

-   Search the web with DuckDuckGo.
-   Use an AI-generated search query based on the user's message.
-   Extract webpage text with Trafilatura.
-   Add extracted search results as context for the AI response.

### Conversation Management

-   Create and delete conversations.
-   Pin conversations.
-   Store chat messages in the database.
-   Compress older conversation history when it exceeds the configured
    context-length limit.

### Accounts and Profiles

-   Register and authenticate users.
-   Maintain a profile for each user.
-   Edit profile information.
-   Use Django's password-reset views.

### Token Usage and Plans

-   Count text tokens with the Qwen3 tokenizer.
-   Track token balances for users.
-   Define Free and Pro plans.
-   Provide different token refill amounts for Free and active Pro users
    through a custom management command.

### Other

-   Light and dark appearance options in the interface.
-   REST API endpoints using Django REST Framework.
-   Bale bot integration.
-   Django admin integration.

## Technology Stack

  Technology                   Role
  ---------------------------- --------------------------------------------
  Python                       Main programming language
  Django                       Web framework
  Django REST Framework        REST API
  Ollama                       Local model inference
  Qwen3 8B                     General-purpose model and tokenizer source
  Qwen2.5 Coder 7B             Coding model
  Hugging Face Tokenizers      Token counting
  DuckDuckGo Search (`ddgs`)   Web search
  Trafilatura                  Webpage content extraction
  Requests                     HTTP requests
  SQLite                       Default database
  HTML, CSS, JavaScript        Frontend

## Configured AI Models

The model names are configured in `assistant/settings.py`.

  Model                Use
  -------------------- ---------------------------------------------------
  `qwen3:8b`           General conversations and search-query generation
  `qwen2.5-coder:7b`   Coding-related conversations

You need to download the models separately through Ollama before using
them.

## Project Structure

The following tree reflects the files and directories currently present
in the repository:

``` text
assistant/
├── api/
│   ├── migrations/
│   │   └── __init__.py
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
│   │       ├── __init__.py
│   │       ├── bale_api.py
│   │       ├── bale_bot.py
│   │       └── token.py
│   ├── migrations/
│   │   ├── __init__.py
│   │   ├── 0001_initial.py
│   │   ├── 0002_alter_messages_text.py
│   │   ├── 0003_chat_messages_chat.py
│   │   ├── 0004_chat_pin.py
│   │   ├── 0005_alter_chat_options_alter_messages_options.py
│   │   ├── 0006_chat_user.py
│   │   ├── 0007_tokenizer.py
│   │   └── 0008_alter_tokenizer_tokenizer.py
│   ├── templates/
│   │   └── chatbot/
│   │       ├── chat.html
│   │       ├── plan.html
│   │       └── setting.html
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
│   │   ├── __init__.py
│   │   ├── 0001_initial.py
│   │   ├── 0002_profile_created_alter_profile_id.py
│   │   └── 0003_profile_plan_profile_pro_expires_at.py
│   ├── templates/
│   │   └── home/
│   │       ├── home.html
│   │       ├── login.html
│   │       ├── password_reset_complete.html
│   │       ├── password_reset_confirm.html
│   │       ├── password_reset_done.html
│   │       ├── password_reset_form.html
│   │       └── signup.html
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
│       ├── tokenizer.json
│       └── tokenizer_config.json
│
├── static/
│   ├── images/
│   │   ├── loading/
│   │   │   ├── loading1.svg
│   │   │   ├── loading2.svg
│   │   │   ├── loading3.svg
│   │   │   ├── loading4.svg
│   │   │   ├── loading5.svg
│   │   │   └── loading6.svg
│   │   ├── icon.svg
│   │   └── logo.svg
│   ├── js/
│   │   ├── chat.js
│   │   ├── home.js
│   │   ├── login.js
│   │   ├── password_reset_complete.js
│   │   ├── password_reset_confirm.js
│   │   ├── password_reset_done.js
│   │   ├── password_reset_form.js
│   │   ├── plan.js
│   │   ├── setting.js
│   │   └── signup.js
│   └── styles/
│       ├── chat.css
│       ├── home.css
│       ├── login.css
│       ├── main.css
│       ├── password_reset_complete.css
│       ├── password_reset_confirm.css
│       ├── password_reset_done.css
│       ├── password_reset_form.css
│       ├── plan.css
│       ├── setting.css
│       └── signup.css
│
├── templates/
│   └── index.html
│
├── .directory
├── .gitignore
├── LICENSE.md
├── README.md
├── manage.py
└── requirements.txt
```

### Main directories

-   `api/` --- API views, serializers, URL routes, and migrations.
-   `assistant/` --- Django project configuration and root URL routing.
-   `chatbot/` --- Chat functionality, chat models, AI integration
    utilities, templates, and custom management commands.
-   `home/` --- Home page, authentication-related views, user profiles,
    forms, signals, and templates.
-   `models/qwen3-8b/` --- Tokenizer files used for counting tokens.
-   `static/` --- Frontend CSS, JavaScript, icons, logos, and loading
    assets.
-   `templates/` --- Shared/base Django template files.

## Installation

### Prerequisites

Install the following before setting up the project:

-   Python
-   Git
-   Ollama

### 1. Clone the repository

``` bash
git clone https://github.com/Aghilzoori/assistant.git
cd assistant
```

### 2. Create and activate a virtual environment

``` bash
python -m venv venv
```

**Linux / macOS**

``` bash
source venv/bin/activate
```

**Windows**

``` powershell
venv\Scripts\activate
```

### 3. Install Python dependencies

``` bash
pip install -r requirements.txt
```

### 4. Download the Ollama models

Make sure Ollama is installed and running:

``` bash
ollama pull qwen3:8b
ollama pull qwen2.5-coder:7b
```

### 5. Configure environment variables

Create a `.env` file in the project root. The application reads
environment variables using `python-dotenv`.

``` env
SECRET_KEY=replace-with-a-secure-secret-key
DEBUG=True
ALLOWED_HOSTS=127.0.0.1,localhost

EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-email-app-password

BOT_TOKEN=your-bale-bot-token
```

Email and Bale bot credentials are needed only if you use those
integrations.

**Security:** Keep your real `.env` file and credentials private. Do not
commit secrets to the repository. For production, use a secure
`SECRET_KEY`, set `DEBUG=False`, and configure `ALLOWED_HOSTS` for your
deployment.

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

The project exposes API routes through Django REST Framework.

  Endpoint            Method   Description
  ------------------- -------- ------------------------------------------
  `/api/`             GET      API test endpoint
  `/api/get-users/`   GET      Returns the authenticated user's profile

Authentication and permissions depend on the API configuration.

## Custom Management Commands

The `chatbot` app contains custom Django management commands.

### Run the Bale bot

``` bash
python manage.py bale_bot
```

### Update token balances

``` bash
python manage.py token
```

The token command adds: - 321 tokens to users on the Free plan. - 876
tokens to users on an active Pro plan.

The command performs one update each time it is run. To refill tokens
periodically, schedule the command with an external scheduler.

## Configuration Notes

-   Model names and AI prompts are configured in
    `assistant/settings.py`.
-   Ollama must be running and accessible to the Django application.
-   The tokenizer files are located in `models/qwen3-8b/`.
-   Web search and webpage extraction require an internet connection.
-   Email features require valid SMTP credentials.
-   Bale bot integration requires a valid bot token.

## License

This project is licensed under the MIT License. See
[LICENSE.md](LICENSE.md) for the full license text.

------------------------------------------------------------------------

Developed by [Aghil Zoori](https://github.com/Aghilzoori).
