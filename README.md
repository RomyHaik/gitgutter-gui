# GitGutter GUI

A modern web-based interface for searching code across GitHub repositories using the GitHub API. Features a beautiful, responsive web interface with advanced search capabilities and real-time results.

## Features

- 🌐 **Web Interface**: Modern, responsive web application
- 🔍 **Advanced Search**: Search for code snippets across GitHub repositories
- 📅 **Date-Ordered Results**: Results are sorted by date (newest first)
- 🎨 **Beautiful UI**: Clean, modern interface with syntax highlighting
- 🔐 **Optional Authentication**: Use GitHub Personal Access Token for higher rate limits
- 🌐 **Language Filtering**: Filter results by programming language
- 📊 **Rich Information**: File details, repository info, and code previews
- ⚡ **Rate Limit Monitoring**: Track API usage and limits
- 🔧 **File Extension Filtering**: Include or exclude specific file types
- 📋 **Configuration File Detection**: Automatically detect config files in repositories
- 📈 **Commit History**: View file commit history and changes
- 🌳 **Repository Tree**: Browse repository file structure
- 🔗 **Code Analysis**: Analyze codebase relationships and dependencies

## Installation

1. **Clone or download this repository**

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the application**:
   ```bash
   python app.py
   ```

4. **Open your browser** and navigate to `http://localhost:5000`

## Usage

### Web Interface

1. **Start the server**:
   ```bash
   python app.py
   ```

2. **Open your browser** to `http://localhost:5000`

3. **Enter your search query** in the search box

4. **Optional**: Configure advanced filters:
   - Language filter
   - File extension filters
   - Sort options
   - Results per page

5. **Click "Search"** to find code snippets

### Example Search Queries

- `somecode` - Search for files containing "somecode"
- `function login` - Search for login functions
- `class User` - Search for User classes
- `import requests` - Search for Python files importing requests
- `console.log` - Search for JavaScript console.log statements

### Language Filters

You can filter results by programming language:
- `python` - Python files
- `javascript` - JavaScript files
- `java` - Java files
- `cpp` - C++ files
- `csharp` - C# files
- `go` - Go files
- `rust` - Rust files
- And many more...

## GitHub Personal Access Token (Recommended)

For better rate limits and access to private repositories, create a GitHub Personal Access Token:

1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate a new token with `public_repo` scope
3. Add the token to your environment variables or modify the app.py file

**Without a token**: 60 requests per hour
**With a token**: 5,000 requests per hour

## Advanced Features

### File Extension Filtering

You can include or exclude specific file extensions:
- **Include**: Only show files with specific extensions (e.g., `.py`, `.js`)
- **Exclude**: Hide files with specific extensions (e.g., `.config`, `.env`)

### Configuration File Detection

The application can automatically detect and highlight configuration files in repositories:
- Environment files (`.env`, `.env.local`, etc.)
- Configuration files (`.config`, `.ini`, `.yaml`, etc.)

### Commit History

View the commit history for any file:
- See recent commits
- View file changes over time
- Analyze code evolution

### Repository Tree

Browse the file structure of repositories:
- Navigate through directories
- View file sizes and types
- Access file contents directly

### Code Analysis

Analyze codebase relationships:
- Find references to specific code
- Understand dependencies
- Visualize code structure

## API Endpoints

The web application provides several API endpoints:

- `GET /` - Main search interface
- `POST /api/search` - Search for code
- `POST /api/commit-history` - Get file commit history
- `POST /api/repository-tree` - Get repository file tree
- `POST /api/analyze` - Analyze codebase relationships

## Configuration

### Environment Variables

You can configure the application using environment variables:

```bash
export GITHUB_TOKEN=your_github_token
export FLASK_ENV=development
export FLASK_DEBUG=1
```

### Customization

Modify `app.py` to customize:
- Default search parameters
- Rate limiting behavior
- UI configuration
- API endpoints

## Rate Limiting

GitHub API has rate limits:
- **Unauthenticated**: 60 requests per hour
- **Authenticated**: 5,000 requests per hour

The application displays your current rate limit status and handles rate limiting gracefully.

## Error Handling

The application handles various error scenarios:
- Network connectivity issues
- Invalid search queries
- Rate limit exceeded
- API errors
- Malformed responses

## Requirements

- Python 3.6+
- Flask
- requests
- python-dateutil
- colorama

## Development

### Running in Development Mode

```bash
export FLASK_ENV=development
export FLASK_DEBUG=1
python app.py
```

### Project Structure

```
gitgutter-gui/
├── app.py                 # Main Flask application
├── github_code_search.py  # GitHub API wrapper
├── templates/             # HTML templates
│   └── index.html        # Main search interface
├── static/               # Static assets
│   ├── style.css         # CSS styles
│   └── script.js         # JavaScript functionality
├── requirements.txt      # Python dependencies
└── README.md            # This file
```

## Troubleshooting

### Common Issues

1. **Rate limit exceeded**: Wait for the rate limit to reset or use a GitHub token
2. **No results found**: Try a different search query or remove language filters
3. **Network errors**: Check your internet connection
4. **Port already in use**: Change the port in app.py or kill the existing process

### Getting Help

If you encounter issues:
1. Check that all dependencies are installed
2. Verify your GitHub token is valid (if using one)
3. Try simpler search queries first
4. Check the browser console for JavaScript errors

## License

This project is under GNU GPL v3 License.

## Contributing

Feel free to submit issues, feature requests, or pull requests to improve this tool! 
