# iThink - Minimalist Writing Application

A minimalist writing tool that displays one sentence at a time with smooth transitions and automatic saving.

## Features

- Single-sentence focus writing interface
- Dark theme with elegant typography
- Automatic saving
- Smooth transitions between sentences
- Up/Down arrow navigation

## Quick Start

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Run the Flask backend:
```bash
python app.py
```

3. Open `templates/index.html` in your web browser

## Deployment

### Backend Deployment (Render)

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set the following:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn app:app`
4. Update the API URL in `static/script.js` to match your Render URL

### Frontend Deployment (Netlify)

1. Create a new site on Netlify
2. Connect your GitHub repository
3. Set the publish directory to `/templates`
4. Set the build command to `cp -r ../static .`

## Usage

- Type your text in the input field
- Press Enter to save a sentence
- Use Up/Down arrow keys to navigate between sentences
- Text is automatically saved every 3 seconds 