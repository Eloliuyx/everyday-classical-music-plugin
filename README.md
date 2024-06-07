# Everyday Classical Music Plugin

The **Everyday Classical Music Plugin** for Obsidian introduces a different piece of classical music each day with a YouTube link in your daily notes. They are the first 366 pieces (randomized) recommended by [this document](https://docs.google.com/document/d/18t_9MHZTENbmYdezAAj4LRM0-Eak_MYO1HssZW2FX1U/edit).

## Features (v1.0.0)

- Automatically adds a classical music piece to newly created daily notes.
- Fetches music pieces from a curated list based on the date, ensuring the same suggestion for the same date in different years.
- Provides an option to backfill all existing daily notes with music links.
- Allows removal of music links added before a specified date.

## Installation

1. **Clone the Repository:**
    ```sh
    git clone https://github.com/Eloliuyx/everyday-classical-music-plugin.git
    cd everyday-classical-music-plugin
    ```

2. **Install Dependencies:**
    ```sh
    npm install
    ```

3. **Build the Plugin:**
    ```sh
    npm run build
    ```

4. **Load the Plugin in Obsidian:**
    - Copy the contents of the `dist` folder to your Obsidian plugins directory.
    - Enable the plugin in Obsidian settings.

## Usage

### Default Behavior

By default, the plugin only adds music links to newly created daily notes. Existing notes remain unchanged.

### Settings

- **Backfill Existing Notes:**
  - Enable this setting to backfill all existing daily notes with available music pieces.

- **Remove Links Before Date:**
  - Enter a date in `YYYY-MM-DD` format to remove all music links added before this date.
  - Click the "Remove Links" button to perform the cleanup.

- **Feed the Markhor:**
  - Click the "Feed the Markhor 🦌🪽" button to support the plugin developer on Ko-fi.

## JSON Data File

The plugin uses a JSON file to fetch music pieces. Ensure your JSON file includes all dates for the year 2024. Here’s an example format:

```json
{
    "2024-01-01": {
        "name": "Symphonic Études, op. 13",
        "author": "Schumann",
        "link": "https://www.youtube.com/watch?v=CIWBd7-AP4Q"
    },
    "2024-01-02": {
        "name": "Nocturnes",
        "author": "Fauré",
        "link": "https://www.youtube.com/watch?v=sqw5B9B9j4M"
    }
    // Add other dates...
}
