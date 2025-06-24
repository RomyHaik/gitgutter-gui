// Global variables
let currentResults = [];
let allApiRoutes = [
    // Cloud Providers
    { text: 'AWS Lambda', query: 'lambda.amazonaws.com' },
    { text: 'Google Cloud Functions', query: 'cloudfunctions.googleapis.com' },
    { text: 'Azure Functions', query: 'azurewebsites.net' },
    
    // Payment Services
    { text: 'Stripe', query: 'api.stripe.com/v1' },
    { text: 'PayPal', query: 'api-m.paypal.com' },
    { text: 'Square', query: 'connect.squareup.com/v2' },
    
    // Authentication
    { text: 'Auth0', query: 'auth0.com/oauth' },
    { text: 'Firebase Auth', query: 'identitytoolkit.googleapis.com' },
    { text: 'Supabase Auth', query: 'supabase.com/auth/v1' },
    
    // Databases
    { text: 'MongoDB Atlas', query: 'mongodb+srv://' },
    { text: 'PostgreSQL', query: 'postgresql://' },
    { text: 'Supabase', query: 'supabase.com/rest/v1' },
    
    // Communication
    { text: 'Twilio', query: 'api.twilio.com/2010-04-01' },
    { text: 'SendGrid', query: 'api.sendgrid.com/v3' },
    { text: 'Discord', query: 'discord.com/api/v10' },
    
    // Storage
    { text: 'AWS S3', query: 's3.amazonaws.com' },
    { text: 'Google Cloud Storage', query: 'storage.googleapis.com/v1' },
    { text: 'Cloudinary', query: 'api.cloudinary.com/v1_1' },
    
    // Analytics
    { text: 'Google Analytics 4', query: 'analyticsdata.googleapis.com/v1beta' },
    { text: 'Mixpanel', query: 'api.mixpanel.com/2.0' },
    { text: 'Segment', query: 'api.segment.io/v1' },
    
    // Maps
    { text: 'Google Maps', query: 'maps.googleapis.com/maps/api' },
    { text: 'Mapbox', query: 'api.mapbox.com/v5' },
    
    // AI & ML
    { text: 'OpenAI', query: 'api.openai.com/v1' },
    { text: 'Anthropic', query: 'api.anthropic.com/v1' },
    { text: 'Hugging Face', query: 'api.huggingface.co/inference' },
    
    // Social Media
    { text: 'Twitter', query: 'api.twitter.com/2' },
    { text: 'Facebook', query: 'graph.facebook.com/v18.0' },
    { text: 'YouTube', query: 'www.googleapis.com/youtube/v3' },
    
    // Code Patterns
    { text: 'Bearer Token', query: 'Authorization: Bearer' },
    { text: 'API Key', query: 'X-API-Key' },
    { text: 'OAuth 2.0', query: 'OAuth 2.0' },
    { text: 'JWT', query: 'JWT token' },
    { text: 'CORS', query: 'Access-Control-Allow-Origin' },
    { text: 'GraphQL', query: 'GraphQL' },
    { text: 'REST API', query: 'REST API' }
];

// DOM elements
const searchForm = document.getElementById('searchForm');
const queryInput = document.getElementById('query');
const loading = document.getElementById('loading');
const results = document.getElementById('results');
const resultsList = document.getElementById('resultsList');
const resultsTitle = document.getElementById('resultsTitle');
const resultsCount = document.getElementById('resultsCount');
const error = document.getElementById('error');
const errorMessage = document.getElementById('errorMessage');
const commitModal = document.getElementById('commitModal');
const modalTitle = document.getElementById('modalTitle');
const commitLoading = document.getElementById('commitLoading');
const commitList = document.getElementById('commitList');
const feelingBored = document.getElementById('feelingBored');
const randomChips = document.getElementById('randomChips');
const detailsOverlay = document.getElementById('detailsOverlay');
const detailsTitle = document.getElementById('detailsTitle');
const detailsLoading = document.getElementById('detailsLoading');
const detailsContent = document.getElementById('detailsContent');

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    searchForm.addEventListener('submit', handleSearch);
    
    // Initialize random API chips
    generateRandomChips();
    
    // File filter interaction
    const fileFilterType = document.getElementById('file_filter_type');
    const fileExtensions = document.getElementById('file_extensions');
    
    fileFilterType.addEventListener('change', function() {
        if (this.value === 'include' || this.value === 'exclude') {
            fileExtensions.disabled = false;
            fileExtensions.focus();
        } else {
            fileExtensions.disabled = true;
            fileExtensions.value = '';
        }
    });
    
    // Close modal when clicking outside
    commitModal.addEventListener('click', function(e) {
        if (e.target === commitModal) {
            closeCommitModal();
        }
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && !commitModal.classList.contains('hidden')) {
            closeCommitModal();
        }
        if (e.key === 'Escape' && !detailsOverlay.classList.contains('hidden')) {
            closeDetailsOverlay();
        }
    });
    
    // Close details overlay when clicking outside
    detailsOverlay.addEventListener('click', function(e) {
        if (e.target === detailsOverlay) {
            closeDetailsOverlay();
        }
    });
});

// Handle search form submission
async function handleSearch(e) {
    e.preventDefault();
    
    const formData = new FormData(searchForm);
    const searchData = {
        query: formData.get('query'),
        language: formData.get('language'),
        sort: formData.get('sort'),
        per_page: formData.get('per_page'),
        file_filter_type: formData.get('file_filter_type'),
        file_extensions: formData.get('file_extensions'),
        check_config_files: formData.get('check_config_files') === 'on'
    };
    
    // Show loading
    showLoading();
    hideError();
    hideResults();
    
    try {
        const response = await fetch('/api/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(searchData)
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            currentResults = data.results;
            displayResults(data);
        } else {
            showError(data.error || 'Search failed');
        }
    } catch (err) {
        showError('Network error: ' + err.message);
    } finally {
        hideLoading();
    }
}

// Display search results
function displayResults(data) {
    const query = document.getElementById('query').value;
    resultsTitle.textContent = `Search Results for "${query}"`;
    resultsCount.textContent = `${data.total_count.toLocaleString()} total results`;
    
    resultsList.innerHTML = '';
    
    if (data.results.length === 0) {
        resultsList.innerHTML = '<p class="no-results">No results found. Try a different search query.</p>';
    } else {
        data.results.forEach((result, index) => {
            const resultElement = createResultElement(result, index);
            resultsList.appendChild(resultElement);
        });
    }
    
    showResults();
}

// Create a result element
function createResultElement(result, index) {
    const resultDiv = document.createElement('div');
    resultDiv.className = `result-item ${result.is_old ? 'old' : ''}`;
    
    // Format date
    const formattedDate = formatDate(result.updated_at);
    // Reverse the logic: newer than 30 days should be red (recent), older should be normal
    const dateClass = result.is_old ? 'result-date old' : 'result-date recent';
    
    // Create config file indicators
    let configIndicators = '';
    if (result.config_files) {
        const envFiles = result.config_files.env_files || [];
        const configFiles = result.config_files.config_files || [];
        
        if (envFiles.length > 0 || configFiles.length > 0) {
            configIndicators = '<div class="config-indicators">';
            
            if (envFiles.length > 0) {
                configIndicators += `<span class="config-chip env-chip">🔧 ${envFiles.length} env file${envFiles.length > 1 ? 's' : ''}</span>`;
            }
            
            if (configFiles.length > 0) {
                configIndicators += `<span class="config-chip config-chip">⚙️ ${configFiles.length} config file${configFiles.length > 1 ? 's' : ''}</span>`;
            }
            
            configIndicators += '</div>';
        }
    }
    
    resultDiv.innerHTML = `
        <div class="result-header">
            <div class="result-title">
                <h3>
                    <a href="${result.html_url}" target="_blank">
                        ${result.repository}/${result.file_path}
                    </a>
                </h3>
                <div class="result-meta">
                    <span><i class="fas fa-code"></i> ${result.language}</span>
                    <span><i class="fas fa-file"></i> ${result.file_name}</span>
                    <span class="${dateClass}"><i class="fas fa-clock"></i> ${formattedDate}</span>
                </div>
                ${configIndicators}
            </div>
            <div class="result-actions">
                <button class="btn btn-primary" onclick="viewCommitHistory('${result.repository}', '${result.file_path}')">
                    <i class="fas fa-history"></i> History
                </button>
                <button class="btn btn-secondary" onclick="viewDetails('${result.repository}', '${result.file_path}', ${index})">
                    <i class="fas fa-eye"></i> View
                </button>
            </div>
        </div>
        ${result.code_snippet ? `<div class="code-snippet">${highlightCodeSnippet(result.code_snippet)}</div>` : ''}
    `;
    
    return resultDiv;
}

// Highlight code snippet
function highlightCodeSnippet(snippet) {
    // Get the current search query to highlight
    const searchQuery = document.getElementById('query').value;
    
    if (!searchQuery) {
        return snippet
            .replace(/\n/g, '<br>')
            .replace(/\s{2,}/g, (match) => '&nbsp;'.repeat(match.length));
    }
    
    // Create a regex to match the search query (case insensitive)
    const regex = new RegExp(`(${escapeRegex(searchQuery)})`, 'gi');
    
    return snippet
        .replace(/\n/g, '<br>')
        .replace(/\s{2,}/g, (match) => '&nbsp;'.repeat(match.length))
        .replace(regex, '<span class="highlight">$1</span>');
}

// Utility function to escape regex special characters
function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Format date
function formatDate(dateString) {
    if (!dateString || dateString === 'Unknown') {
        return 'Unknown';
    }
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return dateString;
    }
}

// View commit history
async function viewCommitHistory(repository, filePath) {
    showCommitModal(repository, filePath);
    
    try {
        const response = await fetch('/api/commit-history', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                repository: repository,
                file_path: filePath,
                max_commits: 10
            })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            displayCommitHistory(data.commits, repository, filePath);
        } else {
            showCommitError(data.error || 'Failed to load commit history');
        }
    } catch (err) {
        showCommitError('Network error: ' + err.message);
    }
}

// Display commit history
function displayCommitHistory(commits, repository, filePath) {
    modalTitle.textContent = `Commit History: ${repository}/${filePath}`;
    
    commitList.innerHTML = '';
    
    if (commits.length === 0) {
        commitList.innerHTML = '<p class="no-commits">No commits found for this file.</p>';
    } else {
        commits.forEach((commit, index) => {
            const commitElement = createCommitElement(commit, index);
            commitList.appendChild(commitElement);
        });
    }
    
    hideCommitLoading();
    showCommitList();
}

// Create a commit element
function createCommitElement(commit, index) {
    const commitDiv = document.createElement('div');
    commitDiv.className = 'commit-item';
    
    const formattedDate = formatDate(commit.date);
    const contentPreview = commit.content ? commit.content.substring(0, 500) + (commit.content.length > 500 ? '...' : '') : '';
    
    commitDiv.innerHTML = `
        <div class="commit-header">
            <span class="commit-sha">${commit.sha}</span>
            <span class="commit-date">${formattedDate}</span>
        </div>
        <div class="commit-author">by ${commit.author}</div>
        <div class="commit-message">${escapeHtml(commit.message)}</div>
        ${contentPreview ? `
            <div class="commit-content">${escapeHtml(contentPreview)}</div>
            ${commit.total_lines > 20 ? `<div class="commit-more">... and ${commit.total_lines - 20} more lines</div>` : ''}
        ` : ''}
    `;
    
    return commitDiv;
}

// Show/hide functions
function showLoading() {
    loading.classList.remove('hidden');
}

function hideLoading() {
    loading.classList.add('hidden');
}

function showResults() {
    results.classList.remove('hidden');
    feelingBored.classList.add('hidden');
}

function hideResults() {
    results.classList.add('hidden');
    feelingBored.classList.remove('hidden');
}

function showError(message) {
    errorMessage.textContent = message;
    error.classList.remove('hidden');
}

function hideError() {
    error.classList.add('hidden');
}

function showCommitModal(repository, filePath) {
    modalTitle.textContent = `Loading: ${repository}/${filePath}`;
    commitModal.classList.remove('hidden');
    showCommitLoading();
    hideCommitList();
}

function closeCommitModal() {
    commitModal.classList.add('hidden');
}

function showCommitLoading() {
    commitLoading.classList.remove('hidden');
}

function hideCommitLoading() {
    commitLoading.classList.add('hidden');
}

function showCommitList() {
    commitList.classList.remove('hidden');
}

function hideCommitList() {
    commitList.classList.add('hidden');
}

function showCommitError(message) {
    commitList.innerHTML = `<div class="error">${escapeHtml(message)}</div>`;
    hideCommitLoading();
    showCommitList();
}

// Utility functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Global function for modal close (called from HTML)
function closeCommitModal() {
    commitModal.classList.add('hidden');
}

// Sidebar Functions
function toggleCategory(categoryId) {
    const category = document.getElementById(categoryId);
    const header = category.previousElementSibling;
    
    if (category.classList.contains('expanded')) {
        category.classList.remove('expanded');
        header.classList.remove('active');
    } else {
        category.classList.add('expanded');
        header.classList.add('active');
    }
}

function fillSearch(query) {
    const searchInput = document.getElementById('query');
    searchInput.value = query;
    searchInput.focus();
    
    // Optional: Auto-trigger search
    // document.getElementById('searchForm').dispatchEvent(new Event('submit'));
}

// Generate random API chips
function generateRandomChips() {
    randomChips.innerHTML = '';
    
    // Shuffle the array and take 10 random items
    const shuffled = [...allApiRoutes].sort(() => 0.5 - Math.random());
    const selectedRoutes = shuffled.slice(0, 10);
    
    selectedRoutes.forEach(route => {
        const chip = document.createElement('div');
        chip.className = 'api-chip';
        chip.textContent = route.text;
        chip.onclick = () => fillSearch(route.query);
        randomChips.appendChild(chip);
    });
}

// Refresh random chips
function refreshRandomChips() {
    generateRandomChips();
}

// View details overlay
async function viewDetails(repository, filePath, resultIndex) {
    showDetailsOverlay();
    
    // Get the result data from currentResults
    const result = currentResults[resultIndex];
    if (!result) {
        showDetailsError('Result not found');
        return;
    }
    
    // Set title to file name
    const fileName = result.file_name;
    detailsTitle.textContent = fileName;
    
    try {
        // Load repository file tree
        await loadRepositoryTree(repository, filePath);
        
        // Display the details
        displayDetails(result);
    } catch (err) {
        showDetailsError('Failed to load details: ' + err.message);
    }
}

// Load repository file tree
async function loadRepositoryTree(repository, highlightedFilePath, currentPath = '') {
    try {
        const response = await fetch('/api/repository-tree', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                repository: repository,
                path: currentPath
            })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            // If we have a highlighted file path, we need to build the full tree
            if (highlightedFilePath && !currentPath) {
                await buildFullTreeWithHighlight(repository, highlightedFilePath);
            } else {
                displayFileTree(data.tree, highlightedFilePath, repository, currentPath);
            }
        } else {
            document.getElementById('fileTree').innerHTML = '<p class="error">Failed to load file tree</p>';
        }
    } catch (err) {
        document.getElementById('fileTree').innerHTML = '<p class="error">Failed to load file tree: ' + err.message + '</p>';
    }
}

// Build full tree with automatic expansion to highlighted file
async function buildFullTreeWithHighlight(repository, highlightedFilePath) {
    try {
        // Get root contents
        const rootResponse = await fetch('/api/repository-tree', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                repository: repository,
                path: ''
            })
        });
        
        const rootData = await rootResponse.json();
        
        if (!rootResponse.ok || !rootData.success) {
            throw new Error('Failed to load root directory');
        }
        
        // Build the tree structure
        const treeStructure = await buildTreeStructure(repository, rootData.tree, highlightedFilePath);
        
        // Display the tree
        const treeHTML = displayTreeStructure(treeStructure, highlightedFilePath, repository);
        setFileTreeHTML(treeHTML);
        
    } catch (err) {
        document.getElementById('fileTree').innerHTML = '<p class="error">Failed to build tree: ' + err.message + '</p>';
    }
}

// Build tree structure recursively
async function buildTreeStructure(repository, items, highlightedFilePath) {
    const tree = [];
    
    for (const item of items) {
        const treeItem = {
            ...item,
            children: [],
            expanded: false
        };
        
        // Check if this item is in the path to the highlighted file
        if (highlightedFilePath.startsWith(item.path + '/')) {
            treeItem.expanded = true;
            
            // If it's a directory, load its contents
            if (item.type === 'dir') {
                try {
                    const response = await fetch('/api/repository-tree', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            repository: repository,
                            path: item.path
                        })
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok && data.success) {
                        treeItem.children = await buildTreeStructure(repository, data.tree, highlightedFilePath);
                    }
                } catch (err) {
                    console.error('Failed to load subdirectory:', err);
                }
            }
        }
        
        tree.push(treeItem);
    }
    
    return tree;
}

// Display tree structure
function displayTreeStructure(treeStructure, highlightedFilePath, repository, level = 0) {
    let treeHTML = '';
    
    treeStructure.forEach(item => {
        const isHighlighted = item.path === highlightedFilePath;
        const isConfigFile = isConfigFileType(item.name);
        const isEnvFile = isEnvFileType(item.name);
        
        let itemClass = item.type === 'dir' ? 'folder' : 'file';
        if (isConfigFile) itemClass += ' config-file';
        if (isEnvFile) itemClass += ' env-file';
        if (isHighlighted) itemClass += ' highlighted';
        if (item.expanded) itemClass += ' expanded';
        
        const icon = item.type === 'dir' ? 'fas fa-folder' : 'fas fa-file';
        const expandIcon = item.type === 'dir' ? (item.expanded ? 'fas fa-chevron-down' : 'fas fa-chevron-right') : '';
        
        const indent = '&nbsp;'.repeat(level * 4);
        
        treeHTML += `
            <div class="file-tree-item ${itemClass}" data-path="${item.path}" data-type="${item.type}">
                <div class="file-tree-item-content" onclick="handleTreeItemClick('${repository}', '${item.path}', '${item.type}', '${item.html_url}', this)">
                    ${indent}
                    ${item.type === 'dir' ? `<i class="tree-expand-icon ${expandIcon}"></i>` : '<span class="tree-spacer"></span>'}
                    <i class="${icon}"></i>
                    <span class="file-name">${item.name}</span>
                </div>
                ${item.children.length > 0 ? `<div class="file-tree-children">${displayTreeStructure(item.children, highlightedFilePath, repository, level + 1)}</div>` : ''}
            </div>
        `;
    });
    
    return treeHTML;
}

// Set file tree HTML
function setFileTreeHTML(html) {
    document.getElementById('fileTree').innerHTML = html;
}

// Fallback display file tree (for simple cases)
function displayFileTree(treeItems, highlightedFilePath, repository, currentPath = '') {
    let treeHTML = '';
    
    // Add breadcrumb navigation if we're in a subdirectory
    if (currentPath) {
        treeHTML += createBreadcrumbHTML(repository, currentPath);
    }
    
    // Add "back to root" option if we're in a subdirectory
    if (currentPath) {
        treeHTML += `
            <div class="file-tree-item folder" onclick="loadRepositoryTree('${repository}', '', '')">
                <i class="fas fa-level-up-alt"></i>
                <span>.. (back to root)</span>
            </div>
        `;
    }
    
    treeItems.forEach(item => {
        const isHighlighted = item.path === highlightedFilePath;
        const isConfigFile = isConfigFileType(item.name);
        const isEnvFile = isEnvFileType(item.name);
        
        let itemClass = item.type === 'dir' ? 'folder' : 'file';
        if (isConfigFile) itemClass += ' config-file';
        if (isEnvFile) itemClass += ' env-file';
        if (isHighlighted) itemClass += ' highlighted';
        
        const icon = item.type === 'dir' ? 'fas fa-folder' : 'fas fa-file';
        
        treeHTML += `
            <div class="file-tree-item ${itemClass}" 
                 onclick="handleFileTreeItemClick('${repository}', '${item.path}', '${item.type}', '${item.html_url}')">
                <i class="${icon}"></i>
                <span>${item.name}</span>
            </div>
        `;
    });
    
    setFileTreeHTML(treeHTML);
}

// Create breadcrumb HTML
function createBreadcrumbHTML(repository, currentPath) {
    const pathParts = currentPath.split('/').filter(part => part);
    let breadcrumbHTML = '<div class="file-tree-breadcrumb">';
    
    breadcrumbHTML += '<span class="breadcrumb-item" onclick="loadRepositoryTree(\'' + repository + '\', \'\', \'\')">root</span>';
    
    let accumulatedPath = '';
    pathParts.forEach((part, index) => {
        accumulatedPath += (accumulatedPath ? '/' : '') + part;
        const isLast = index === pathParts.length - 1;
        
        if (isLast) {
            breadcrumbHTML += '<span class="breadcrumb-separator">/</span>';
            breadcrumbHTML += '<span class="breadcrumb-item current">' + part + '</span>';
        } else {
            breadcrumbHTML += '<span class="breadcrumb-separator">/</span>';
            breadcrumbHTML += '<span class="breadcrumb-item" onclick="loadRepositoryTree(\'' + repository + '\', \'\', \'' + accumulatedPath + '\')">' + part + '</span>';
        }
    });
    
    breadcrumbHTML += '</div>';
    return breadcrumbHTML;
}

// Handle file tree item click (fallback)
async function handleFileTreeItemClick(repository, filePath, type, htmlUrl) {
    if (type === 'dir') {
        // Load subdirectory contents
        await loadRepositoryTree(repository, '', filePath);
    } else {
        // Open file in new tab
        window.open(htmlUrl, '_blank');
    }
}

// Handle tree item click (for new tree structure)
function handleTreeItemClick(repository, filePath, type, htmlUrl, element) {
    if (type === 'dir') {
        // Toggle expansion
        const treeItem = element.closest('.file-tree-item');
        const expandIcon = element.querySelector('.tree-expand-icon');
        const children = treeItem.querySelector('.file-tree-children');
        
        if (treeItem.classList.contains('expanded')) {
            // Collapse
            treeItem.classList.remove('expanded');
            expandIcon.className = 'tree-expand-icon fas fa-chevron-right';
            if (children) {
                children.style.display = 'none';
            }
        } else {
            // Expand
            treeItem.classList.add('expanded');
            expandIcon.className = 'tree-expand-icon fas fa-chevron-down';
            if (children) {
                children.style.display = 'block';
            } else {
                // Load children if not already loaded
                loadTreeItemChildren(repository, filePath, treeItem);
            }
        }
    } else {
        // Open file in new tab
        window.open(htmlUrl, '_blank');
    }
}

// Load tree item children
async function loadTreeItemChildren(repository, filePath, treeItem) {
    try {
        const response = await fetch('/api/repository-tree', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                repository: repository,
                path: filePath
            })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            const childrenHTML = displayTreeStructure(data.tree, '', repository, 1);
            const childrenDiv = document.createElement('div');
            childrenDiv.className = 'file-tree-children';
            childrenDiv.innerHTML = childrenHTML;
            treeItem.appendChild(childrenDiv);
        }
    } catch (err) {
        console.error('Failed to load children:', err);
    }
}

// Check if file is a config file
function isConfigFileType(filename) {
    const configExtensions = ['.config', '.cfg', '.conf', '.ini', '.yaml', '.yml', '.toml', '.json', '.xml'];
    const configNames = ['config', 'configuration', 'settings'];
    
    const extension = filename.substring(filename.lastIndexOf('.'));
    const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'));
    
    return configExtensions.includes(extension) || configNames.some(name => 
        nameWithoutExt.toLowerCase().includes(name.toLowerCase())
    );
}

// Check if file is an env file
function isEnvFileType(filename) {
    const envPatterns = ['.env', 'environment', 'env'];
    return envPatterns.some(pattern => 
        filename.toLowerCase().includes(pattern.toLowerCase())
    );
}

// Display details content
function displayDetails(result) {
    const searchQuery = document.getElementById('query').value;
    
    // Create config files HTML
    let configFilesHTML = '';
    if (result.config_files) {
        const envFiles = result.config_files.env_files || [];
        const configFiles = result.config_files.config_files || [];
        
        if (envFiles.length > 0 || configFiles.length > 0) {
            configFilesHTML = '<div class="details-section">';
            configFilesHTML += '<h4><i class="fas fa-cog"></i> Configuration Files</h4>';
            configFilesHTML += '<div class="config-files-list">';
            
            // Environment files
            envFiles.forEach(file => {
                configFilesHTML += createConfigFileHTML(file, 'env', result.repository);
            });
            
            // Config files
            configFiles.forEach(file => {
                configFilesHTML += createConfigFileHTML(file, 'config', result.repository);
            });
            
            configFilesHTML += '</div></div>';
        }
    }
    
    // Create the details content
    detailsContent.innerHTML = `
        <div class="details-section">
            <h4><i class="fas fa-code"></i> Code Snippet</h4>
            <div class="large-snippet">${highlightCodeSnippet(result.code_snippet || 'No code snippet available')}</div>
            <div class="details-actions">
                <button class="btn btn-primary" onclick="viewCommitHistory('${result.repository}', '${result.file_path}')">
                    <i class="fas fa-history"></i> History
                </button>
                <a href="${result.html_url}" target="_blank" class="btn btn-secondary">
                    <i class="fas fa-external-link-alt"></i> Open in GitHub
                </a>
            </div>
        </div>
        ${configFilesHTML}
        <div class="details-section">
            <h4><i class="fas fa-chart-line"></i> Analysis</h4>
            <div class="details-actions">
                <button class="btn btn-analyze" onclick="analyzeFile('${result.repository}', '${result.file_path}')">
                    <i class="fas fa-search"></i> Analyze
                </button>
            </div>
        </div>
    `;
    
    hideDetailsLoading();
    showDetailsContent();
}

// Create config file HTML
function createConfigFileHTML(filePath, type, repository) {
    const icon = type === 'env' ? '🔧' : '⚙️';
    const typeClass = type === 'env' ? 'env-file' : 'config-file';
    
    return `
        <div class="config-file-item ${typeClass}">
            <div class="config-file-header" onclick="toggleConfigFile(this)">
                <div class="config-file-info">
                    <span class="config-file-icon">${icon}</span>
                    <span class="config-file-name">${filePath}</span>
                </div>
                <div class="config-file-actions">
                    <button class="btn btn-primary" onclick="viewConfigFileHistory('${repository}', '${filePath}', event)">
                        <i class="fas fa-history"></i> History
                    </button>
                    <i class="fas fa-chevron-down expand-icon"></i>
                </div>
            </div>
            <div class="config-file-content">
                <div class="config-file-content-inner" data-repo="${repository}" data-file="${filePath}">
                    Loading content...
                </div>
            </div>
        </div>
    `;
}

// Toggle config file expansion
function toggleConfigFile(header) {
    const content = header.nextElementSibling;
    const icon = header.querySelector('.expand-icon');
    
    if (content.classList.contains('expanded')) {
        content.classList.remove('expanded');
        icon.style.transform = 'rotate(0deg)';
    } else {
        content.classList.add('expanded');
        icon.style.transform = 'rotate(180deg)';
        
        // Load content if not already loaded
        const contentInner = content.querySelector('.config-file-content-inner');
        if (contentInner.textContent === 'Loading content...') {
            loadConfigFileContent(contentInner);
        }
    }
}

// Load config file content
async function loadConfigFileContent(contentElement) {
    const repository = contentElement.dataset.repo;
    const filePath = contentElement.dataset.file;
    
    try {
        const response = await fetch('/api/file-content', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                repository: repository,
                file_path: filePath
            })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            contentElement.textContent = data.content;
        } else {
            contentElement.textContent = 'Failed to load content: ' + (data.error || 'Unknown error');
        }
    } catch (err) {
        contentElement.textContent = 'Failed to load content: ' + err.message;
    }
}

// View config file history
function viewConfigFileHistory(repository, filePath, event) {
    event.stopPropagation(); // Prevent triggering the toggle
    viewCommitHistory(repository, filePath);
}

// Analyze file (placeholder for future implementation)
async function analyzeFile(repository, filePath) {
    const searchString = document.getElementById('query').value;
    
    if (!searchString) {
        alert('Please enter a search query first to analyze.');
        return;
    }
    
    // Show analysis loading state
    showAnalysisLoading();
    
    try {
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                repository: repository,
                file_path: filePath,
                search_string: searchString
            })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            displayAnalysisResults(data.analysis);
        } else {
            showAnalysisError(data.error || 'Analysis failed');
        }
    } catch (err) {
        showAnalysisError('Network error: ' + err.message);
    }
}

// Show analysis loading state
function showAnalysisLoading() {
    const detailsContent = document.getElementById('detailsContent');
    detailsContent.innerHTML = `
        <div class="analysis-loading">
            <div class="spinner"></div>
            <p>Analyzing codebase...</p>
            <p class="analysis-status">Searching for references to "${document.getElementById('query').value}"</p>
        </div>
    `;
    showDetailsContent();
}

// Display analysis results
function displayAnalysisResults(analysis) {
    const detailsContent = document.getElementById('detailsContent');
    
    let analysisHTML = `
        <div class="analysis-results">
            <div class="analysis-header">
                <h4><i class="fas fa-chart-line"></i> Codebase Analysis</h4>
                <div class="analysis-summary">
                    <span class="summary-item">
                        <i class="fas fa-search"></i> ${analysis.references.length} references
                    </span>
                    <span class="summary-item">
                        <i class="fas fa-code"></i> ${analysis.declarations.length} declarations
                    </span>
                    <span class="summary-item">
                        <i class="fas fa-link"></i> ${analysis.usages.length} usages
                    </span>
                    <span class="summary-item">
                        <i class="fas fa-exchange-alt"></i> ${analysis.renames.length} renames
                    </span>
                </div>
            </div>
            
            <div class="analysis-tabs">
                <button class="tab-btn active" onclick="switchAnalysisTab('uml')">UML Diagram</button>
                <button class="tab-btn" onclick="switchAnalysisTab('references')">References</button>
                <button class="tab-btn" onclick="switchAnalysisTab('relationships')">Relationships</button>
            </div>
            
            <div class="tab-content">
                <div id="uml-tab" class="tab-panel active">
                    ${generateUMLDiagram(analysis.uml_data)}
                </div>
                
                <div id="references-tab" class="tab-panel">
                    ${generateReferencesList(analysis)}
                </div>
                
                <div id="relationships-tab" class="tab-panel">
                    ${generateRelationshipsList(analysis.relationships)}
                </div>
            </div>
        </div>
    `;
    
    detailsContent.innerHTML = analysisHTML;
    showDetailsContent();
}

// Generate UML diagram
function generateUMLDiagram(umlData) {
    if (umlData.classes.length === 0 && umlData.methods.length === 0) {
        return '<p class="no-uml-data">No UML data available for this analysis.</p>';
    }
    
    let umlHTML = '<div class="uml-diagram">';
    
    // Generate classes
    umlData.classes.forEach(cls => {
        umlHTML += `
            <div class="uml-class" data-class="${cls.name}">
                <div class="class-header">
                    <i class="fas fa-cube"></i>
                    <span class="class-name">${cls.name}</span>
                </div>
                <div class="class-body">
                    <div class="class-file">${cls.file}:${cls.line}</div>
                </div>
            </div>
        `;
    });
    
    // Generate methods
    umlData.methods.forEach(method => {
        umlHTML += `
            <div class="uml-method" data-method="${method.name}">
                <div class="method-header">
                    <i class="fas fa-cog"></i>
                    <span class="method-name">${method.name}</span>
                </div>
                <div class="method-body">
                    <div class="method-file">${method.file}:${method.line}</div>
                </div>
            </div>
        `;
    });
    
    // Generate relationships
    umlData.relationships.forEach(rel => {
        umlHTML += `
            <div class="uml-relationship" data-from="${rel.from}" data-to="${rel.to}">
                <div class="relationship-line ${rel.type} ${rel.strength}"></div>
                <div class="relationship-label">${rel.type}</div>
            </div>
        `;
    });
    
    umlHTML += '</div>';
    return umlHTML;
}

// Generate references list
function generateReferencesList(analysis) {
    if (analysis.references.length === 0) {
        return '<p class="no-references">No references found.</p>';
    }
    
    let referencesHTML = '<div class="references-list">';
    
    // Group by file
    const filesByPath = {};
    analysis.references.forEach(ref => {
        if (!filesByPath[ref.file_path]) {
            filesByPath[ref.file_path] = [];
        }
        filesByPath[ref.file_path].push(ref);
    });
    
    Object.keys(filesByPath).forEach(filePath => {
        const references = filesByPath[filePath];
        referencesHTML += `
            <div class="file-references">
                <div class="file-header">
                    <i class="fas fa-file-code"></i>
                    <span class="file-name">${filePath}</span>
                    <span class="reference-count">${references.length} references</span>
                </div>
                <div class="file-references-list">
        `;
        
        references.forEach(ref => {
            const typeIcon = getReferenceTypeIcon(ref.type);
            referencesHTML += `
                <div class="reference-item ${ref.type}">
                    <div class="reference-header">
                        <i class="${typeIcon}"></i>
                        <span class="reference-type">${ref.type}</span>
                        <span class="reference-line">Line ${ref.line_num}</span>
                    </div>
                    <div class="reference-content">
                        <code>${escapeHtml(ref.line)}</code>
                    </div>
                </div>
            `;
        });
        
        referencesHTML += `
                </div>
            </div>
        `;
    });
    
    referencesHTML += '</div>';
    return referencesHTML;
}

// Generate relationships list
function generateRelationshipsList(relationships) {
    if (relationships.length === 0) {
        return '<p class="no-relationships">No relationships found.</p>';
    }
    
    let relationshipsHTML = '<div class="relationships-list">';
    
    relationships.forEach(rel => {
        const strengthClass = rel.strength;
        relationshipsHTML += `
            <div class="relationship-item ${rel.type} ${strengthClass}">
                <div class="relationship-header">
                    <i class="fas fa-arrow-right"></i>
                    <span class="relationship-type">${rel.type}</span>
                    <span class="relationship-strength">${rel.strength}</span>
                </div>
                <div class="relationship-content">
                    <div class="relationship-from">
                        <strong>From:</strong> ${rel.from.entity_name} (${rel.from.file_path}:${rel.from.line_num})
                    </div>
                    <div class="relationship-to">
                        <strong>To:</strong> ${rel.to.entity_name} (${rel.to.file_path}:${rel.to.line_num})
                    </div>
                </div>
            </div>
        `;
    });
    
    relationshipsHTML += '</div>';
    return relationshipsHTML;
}

// Get reference type icon
function getReferenceTypeIcon(type) {
    const icons = {
        'declaration': 'fas fa-plus-circle',
        'usage': 'fas fa-play-circle',
        'rename': 'fas fa-exchange-alt',
        'import': 'fas fa-download'
    };
    return icons[type] || 'fas fa-circle';
}

// Switch analysis tabs
function switchAnalysisTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Update tab panels
    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');
}

// Show analysis error
function showAnalysisError(message) {
    const detailsContent = document.getElementById('detailsContent');
    detailsContent.innerHTML = `
        <div class="analysis-error">
            <i class="fas fa-exclamation-triangle"></i>
            <p>${message}</p>
        </div>
    `;
    showDetailsContent();
}

// Show/hide details overlay functions
function showDetailsOverlay() {
    detailsOverlay.classList.remove('hidden');
    showDetailsLoading();
    hideDetailsContent();
}

function closeDetailsOverlay() {
    detailsOverlay.classList.add('closing');
    setTimeout(() => {
        detailsOverlay.classList.remove('closing');
        detailsOverlay.classList.add('hidden');
    }, 300);
}

function showDetailsLoading() {
    detailsLoading.classList.remove('hidden');
}

function hideDetailsLoading() {
    detailsLoading.classList.add('hidden');
}

function showDetailsContent() {
    detailsContent.classList.remove('hidden');
}

function hideDetailsContent() {
    detailsContent.classList.add('hidden');
}

function showDetailsError(message) {
    detailsContent.innerHTML = `<div class="error"><i class="fas fa-exclamation-triangle"></i> ${message}</div>`;
    hideDetailsLoading();
    showDetailsContent();
} 