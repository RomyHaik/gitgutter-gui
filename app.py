#!/usr/bin/env python3
"""
Web application for GitHub Code Search
"""

from flask import Flask, render_template, request, jsonify
from github_code_search import GitHubCodeSearch
import json
import time

app = Flask(__name__)

# Initialize the GitHub search instance
searcher = GitHubCodeSearch()
searcher.set_token("")

@app.route('/')
def index():
    """Main page"""
    return render_template('index.html')

@app.route('/api/search', methods=['POST'])
def search():
    """API endpoint for code search"""
    try:
        data = request.get_json()
        query = data.get('query', '').strip()
        language = data.get('language', '').strip() or None
        sort = data.get('sort', 'indexed')  # Default to 'indexed' since that's what's selected in the form
        per_page = min(int(data.get('per_page', 10)), 30)  # Limit to 30 results
        file_filter_type = data.get('file_filter_type', '').strip()
        file_extensions_raw = data.get('file_extensions')
        file_extensions = file_extensions_raw.strip() if file_extensions_raw else ''
        check_config_files = data.get('check_config_files', False)  # New parameter
        
        if not query:
            return jsonify({'error': 'Query is required'}), 400
        
        # Build file extension filter
        file_filter = None
        if file_filter_type and file_extensions:
            extensions = [ext.strip().lower() for ext in file_extensions.split(',') if ext.strip()]
            if extensions:
                file_filter = {
                    'type': file_filter_type,
                    'extensions': extensions
                }
        
        # Perform search
        results = searcher.search_code(
            query=query,
            language=language,
            sort=sort,
            per_page=per_page,
            file_filter=file_filter,
            check_config_files=check_config_files
        )
        
        if results:
            # Process results for JSON response
            processed_results = []
            for item in results.get('items', []):
                processed_item = {
                    'repository': item['repository']['full_name'],
                    'file_path': item['path'],
                    'file_name': item['path'].split('/')[-1] if '/' in item['path'] else item['path'],
                    'language': item.get('language', 'Unknown'),
                    'size': item.get('size', 'Unknown'),
                    'updated_at': item.get('updated_at', 'Unknown'),
                    'html_url': item['html_url'],
                    'code_snippet': searcher._get_code_snippet_with_context(item),
                    'is_old': False,
                    'config_files': item.get('config_files', {})
                }
                
                # Check if result is older than 1 month
                if processed_item['updated_at'] and processed_item['updated_at'] != 'Unknown':
                    try:
                        from datetime import datetime, timedelta
                        from dateutil import parser
                        update_date = parser.parse(processed_item['updated_at'])
                        now_utc = datetime.utcnow().replace(tzinfo=update_date.tzinfo)
                        one_month_ago = now_utc - timedelta(days=30)
                        processed_item['is_old'] = update_date < one_month_ago
                    except:
                        pass
                
                processed_results.append(processed_item)
            
            return jsonify({
                'success': True,
                'total_count': results.get('total_count', 0),
                'results': processed_results
            })
        else:
            return jsonify({'error': 'Search failed'}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/commit-history', methods=['POST'])
def commit_history():
    """API endpoint for commit history"""
    try:
        data = request.get_json()
        repo_name = data.get('repository')
        file_path = data.get('file_path')
        max_commits = min(int(data.get('max_commits', 10)), 50)  # Limit to 50 commits
        
        if not repo_name or not file_path:
            return jsonify({'error': 'Repository and file path are required'}), 400
        
        # Get commit history
        commits_url = f"{searcher.base_url}/repos/{repo_name}/commits?path={file_path}&per_page={max_commits}"
        response = searcher.session.get(commits_url)
        
        if response.status_code == 200:
            commits = response.json()
            processed_commits = []
            
            for commit in commits:
                processed_commit = {
                    'sha': commit.get('sha', '')[:8],
                    'date': commit.get('commit', {}).get('author', {}).get('date', ''),
                    'message': commit.get('commit', {}).get('message', '').strip(),
                    'author': commit.get('commit', {}).get('author', {}).get('name', 'Unknown')
                }
                
                # Get file content for this commit
                try:
                    file_content = searcher._get_file_content_at_commit(repo_name, file_path, commit['sha'])
                    if file_content:
                        # Show first 20 lines
                        lines = file_content.split('\n')[:20]
                        processed_commit['content'] = '\n'.join(lines)
                        processed_commit['total_lines'] = len(file_content.split('\n'))
                    else:
                        processed_commit['content'] = ''
                        processed_commit['total_lines'] = 0
                except:
                    processed_commit['content'] = ''
                    processed_commit['total_lines'] = 0
                
                processed_commits.append(processed_commit)
            
            return jsonify({
                'success': True,
                'commits': processed_commits
            })
        else:
            return jsonify({'error': f'Failed to fetch commits: {response.status_code}'}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/repository-tree', methods=['POST'])
def repository_tree():
    """API endpoint for repository file tree"""
    try:
        data = request.get_json()
        repo_name = data.get('repository')
        path = data.get('path', '')
        
        if not repo_name:
            return jsonify({'error': 'Repository is required'}), 400
        
        # Get repository contents using GitHub API
        url = f"{searcher.base_url}/repos/{repo_name}/contents/{path}"
        response = searcher.session.get(url)
        
        if response.status_code == 200:
            contents = response.json()
            
            # Process the contents to create a tree structure
            tree_items = []
            for item in contents:
                tree_item = {
                    'name': item['name'],
                    'path': item['path'],
                    'type': item['type'],  # 'file' or 'dir'
                    'size': item.get('size', 0),
                    'download_url': item.get('download_url', ''),
                    'html_url': item.get('html_url', '')
                }
                tree_items.append(tree_item)
            
            # Sort: directories first, then files
            tree_items.sort(key=lambda x: (x['type'] != 'dir', x['name'].lower()))
            
            return jsonify({
                'success': True,
                'tree': tree_items,
                'path': path
            })
        else:
            return jsonify({'error': f'Failed to fetch repository tree: {response.status_code}'}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/file-content', methods=['POST'])
def file_content():
    """API endpoint for file content"""
    try:
        data = request.get_json()
        repo_name = data.get('repository')
        file_path = data.get('file_path')
        
        if not repo_name or not file_path:
            return jsonify({'error': 'Repository and file path are required'}), 400
        
        # Get file content using GitHub API
        url = f"{searcher.base_url}/repos/{repo_name}/contents/{file_path}"
        response = searcher.session.get(url)
        
        if response.status_code == 200:
            content_data = response.json()
            
            # Decode content if it's base64 encoded
            import base64
            content = content_data.get('content', '')
            if content_data.get('encoding') == 'base64':
                try:
                    content = base64.b64decode(content).decode('utf-8')
                except:
                    content = 'Failed to decode content'
            
            return jsonify({
                'success': True,
                'content': content,
                'size': content_data.get('size', 0),
                'encoding': content_data.get('encoding', '')
            })
        else:
            return jsonify({'error': f'Failed to fetch file content: {response.status_code}'}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/analyze', methods=['POST'])
def analyze_codebase():
    """API endpoint for codebase analysis"""
    try:
        data = request.get_json()
        repository = data.get('repository')
        file_path = data.get('file_path')
        search_string = data.get('search_string')
        
        if not repository or not search_string:
            return jsonify({'error': 'Repository and search string are required'}), 400
        
        # Perform codebase analysis
        analysis_result = perform_codebase_analysis(repository, search_string, file_path)
        
        return jsonify({
            'success': True,
            'analysis': analysis_result
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def perform_codebase_analysis(repository, search_string, original_file_path=None):
    """Perform comprehensive codebase analysis"""
    analysis = {
        'search_string': search_string,
        'repository': repository,
        'references': [],
        'renames': [],
        'declarations': [],
        'usages': [],
        'relationships': [],
        'file_analysis': {},
        'uml_data': {
            'classes': [],
            'methods': [],
            'properties': [],
            'relationships': []
        }
    }
    
    try:
        # Get all files in the repository
        all_files = get_all_repository_files(repository)
        
        # Analyze each file for references
        for file_info in all_files:
            if should_analyze_file(file_info['path']):
                file_analysis = analyze_file_for_references(
                    repository, 
                    file_info['path'], 
                    search_string,
                    original_file_path
                )
                
                if file_analysis['has_references']:
                    analysis['file_analysis'][file_info['path']] = file_analysis
                    analysis['references'].extend(file_analysis['references'])
                    analysis['renames'].extend(file_analysis['renames'])
                    analysis['declarations'].extend(file_analysis['declarations'])
                    analysis['usages'].extend(file_analysis['usages'])
        
        # Build relationships and UML data
        analysis['relationships'] = build_relationships(analysis)
        analysis['uml_data'] = build_uml_data(analysis)
        
        return analysis
        
    except Exception as e:
        print(f"Analysis error: {e}")
        return analysis

def get_all_repository_files(repository):
    """Get all files in the repository recursively"""
    files = []
    
    def get_files_recursive(path=''):
        try:
            url = f"{searcher.base_url}/repos/{repository}/contents/{path}"
            response = searcher.session.get(url)
            
            if response.status_code == 200:
                contents = response.json()
                
                for item in contents:
                    if item['type'] == 'file':
                        files.append({
                            'path': item['path'],
                            'name': item['name'],
                            'size': item.get('size', 0),
                            'download_url': item.get('download_url', '')
                        })
                    elif item['type'] == 'dir':
                        get_files_recursive(item['path'])
                        
                time.sleep(0.1)  # Rate limiting
                
        except Exception as e:
            print(f"Error getting files from {path}: {e}")
    
    get_files_recursive()
    return files

def should_analyze_file(file_path):
    """Determine if a file should be analyzed based on its extension"""
    code_extensions = {
        '.py', '.js', '.ts', '.jsx', '.tsx', '.java', '.cpp', '.c', '.h', '.hpp',
        '.cs', '.php', '.rb', '.go', '.rs', '.swift', '.kt', '.scala', '.clj',
        '.hs', '.ml', '.fs', '.vb', '.sql', '.r', '.m', '.mm', '.pl', '.sh',
        '.yaml', '.yml', '.json', '.xml', '.html', '.css', '.scss', '.sass'
    }
    
    file_ext = '.' + file_path.split('.')[-1].lower() if '.' in file_path else ''
    return file_ext in code_extensions

def analyze_file_for_references(repository, file_path, search_string, original_file_path=None):
    """Analyze a single file for references to the search string"""
    analysis = {
        'file_path': file_path,
        'has_references': False,
        'references': [],
        'renames': [],
        'declarations': [],
        'usages': [],
        'lines': []
    }
    
    try:
        # Get file content
        content = get_file_content(repository, file_path)
        if not content:
            return analysis
        
        lines = content.split('\n')
        analysis['lines'] = lines
        
        # Analyze each line
        for line_num, line in enumerate(lines, 1):
            line_analysis = analyze_line(line, line_num, search_string, file_path)
            
            if line_analysis['has_reference']:
                analysis['has_references'] = True
                analysis['references'].append(line_analysis)
                
                # Categorize the reference
                if line_analysis['type'] == 'rename':
                    analysis['renames'].append(line_analysis)
                elif line_analysis['type'] == 'declaration':
                    analysis['declarations'].append(line_analysis)
                elif line_analysis['type'] == 'usage':
                    analysis['usages'].append(line_analysis)
        
        return analysis
        
    except Exception as e:
        print(f"Error analyzing file {file_path}: {e}")
        return analysis

def analyze_line(line, line_num, search_string, file_path):
    """Analyze a single line for references to the search string"""
    analysis = {
        'line_num': line_num,
        'line': line,
        'file_path': file_path,
        'has_reference': False,
        'type': None,
        'context': None,
        'entity_name': None
    }
    
    # Check if the search string appears in this line
    if search_string.lower() in line.lower():
        analysis['has_reference'] = True
        
        # Determine the type of reference
        line_lower = line.lower()
        
        # Check for declarations (function, class, variable declarations)
        if any(keyword in line_lower for keyword in ['def ', 'class ', 'function ', 'var ', 'let ', 'const ', 'public ', 'private ', 'protected ']):
            analysis['type'] = 'declaration'
            analysis['entity_name'] = extract_entity_name(line, search_string)
            
        # Check for renames/assignments
        elif any(keyword in line_lower for keyword in ['=', ':=', '->', '=>', 'as ', 'alias ']):
            analysis['type'] = 'rename'
            analysis['entity_name'] = extract_entity_name(line, search_string)
            
        # Check for imports
        elif any(keyword in line_lower for keyword in ['import ', 'from ', 'require ', 'include ']):
            analysis['type'] = 'import'
            analysis['entity_name'] = extract_entity_name(line, search_string)
            
        # Default to usage
        else:
            analysis['type'] = 'usage'
            analysis['entity_name'] = extract_entity_name(line, search_string)
        
        # Extract context (surrounding code)
        analysis['context'] = extract_context(line, line_num, file_path)
    
    return analysis

def extract_entity_name(line, search_string):
    """Extract the entity name from a line"""
    # Simple extraction - look for the search string and surrounding context
    import re
    
    # Try to find function/class names
    patterns = [
        r'def\s+(\w+)',  # Python functions
        r'class\s+(\w+)',  # Classes
        r'function\s+(\w+)',  # JavaScript functions
        r'(\w+)\s*=',  # Variable assignments
        r'(\w+)\s*:',  # Type annotations
        r'(\w+)\s*\(',  # Function calls
    ]
    
    for pattern in patterns:
        match = re.search(pattern, line, re.IGNORECASE)
        if match and search_string.lower() in match.group(1).lower():
            return match.group(1)
    
    # Fallback: return the search string itself
    return search_string

def extract_context(line, line_num, file_path):
    """Extract context around the line"""
    # This would ideally get surrounding lines, but for now return the line itself
    return {
        'line': line.strip(),
        'line_num': line_num,
        'file_path': file_path
    }

def get_file_content(repository, file_path):
    """Get the content of a file"""
    try:
        url = f"{searcher.base_url}/repos/{repository}/contents/{file_path}"
        response = searcher.session.get(url)
        
        if response.status_code == 200:
            content_data = response.json()
            
            # Decode content if it's base64 encoded
            import base64
            content = content_data.get('content', '')
            if content_data.get('encoding') == 'base64':
                try:
                    content = base64.b64decode(content).decode('utf-8')
                except:
                    content = ''
            
            return content
        else:
            return None
            
    except Exception as e:
        print(f"Error getting file content for {file_path}: {e}")
        return None

def build_relationships(analysis):
    """Build relationships between different references"""
    relationships = []
    
    # Find relationships between declarations and usages
    declarations = analysis['declarations']
    usages = analysis['usages']
    renames = analysis['renames']
    
    # Map declarations to usages
    for decl in declarations:
        for usage in usages:
            if decl['entity_name'] == usage['entity_name']:
                relationships.append({
                    'type': 'declaration_usage',
                    'from': decl,
                    'to': usage,
                    'strength': 'strong'
                })
    
    # Map renames to original entities
    for rename in renames:
        for decl in declarations:
            if rename['entity_name'] != decl['entity_name']:
                relationships.append({
                    'type': 'rename',
                    'from': decl,
                    'to': rename,
                    'strength': 'medium'
                })
    
    return relationships

def build_uml_data(analysis):
    """Build UML diagram data from analysis results"""
    uml_data = {
        'classes': [],
        'methods': [],
        'properties': [],
        'relationships': []
    }
    
    # Extract classes from declarations
    for decl in analysis['declarations']:
        if 'class' in decl['line'].lower():
            uml_data['classes'].append({
                'name': decl['entity_name'],
                'file': decl['file_path'],
                'line': decl['line_num'],
                'type': 'class'
            })
        elif 'def' in decl['line'].lower() or 'function' in decl['line'].lower():
            uml_data['methods'].append({
                'name': decl['entity_name'],
                'file': decl['file_path'],
                'line': decl['line_num'],
                'type': 'method'
            })
        else:
            uml_data['properties'].append({
                'name': decl['entity_name'],
                'file': decl['file_path'],
                'line': decl['line_num'],
                'type': 'property'
            })
    
    # Build relationships for UML
    for rel in analysis['relationships']:
        uml_data['relationships'].append({
            'from': rel['from']['entity_name'],
            'to': rel['to']['entity_name'],
            'type': rel['type'],
            'strength': rel['strength']
        })
    
    return uml_data

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001) 