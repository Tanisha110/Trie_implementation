/**
 * AppManager - Main application controller that coordinates all components
 */
import EnhancedTrie from './enhanced-trie.js';
import FuzzyMatcher from './fuzzy-matcher.js';
import DataManager from './data-manae ger.js';
import TrieVisualizer from './trie-visualizer.js';

class AppManager {
    constructor() {
        // Initialize components
        this.trie = new EnhancedTrie();
        this.fuzzyMatcher = new FuzzyMatcher(2);
        this.dataManager = new DataManager();
        
        // UI elements
        this.prefixInput = document.getElementById('prefixInput');
        this.resultsDiv = document.getElementById('results');
        this.fileInput = document.getElementById('fileInput');
        this.fileDropdown = document.getElementById('fileDropdown');
        
        // Initialize state
        this.currentDictionary = null;
        this.preferences = this.dataManager.loadPreferences();
        this.currentPage = 0;
        this.resultsPerPage = this.preferences.maxSuggestions || 5;
        this.uploadedFiles = [];
        
        // Initialize UI
        this.initUI();
        this.initEventListeners();
        this.initVisualizer();
        
        // Load dictionaries
        this.loadDictionaries();
    }
    
    /**
     * Initialize UI elements and add to DOM
     */
    initUI() {
        // Create UI elements for additional features
        this.createDictionaryPanel();
        this.createSettingsPanel();
        this.createVisualizerPanel();
        this.createStatisticsPanel();
        
        // Apply theme
        this.applyTheme(this.preferences.theme || 'light');
    }
    
    /**
     * Create panel for dictionary management
     */
    createDictionaryPanel() {
        // Create dictionary management container
        const dictionaryPanel = document.createElement('div');
        dictionaryPanel.className = 'card dictionary-panel';
        dictionaryPanel.innerHTML = `
            <div class="card-header">
                <h5>Dictionary Management</h5>
            </div>
            <div class="card-body">
                <div class="form-group">
                    <label for="dictionarySelect">Active Dictionary</label>
                    <select id="dictionarySelect" class="form-control custom-select">
                        <option value="default">Default Dictionary</option>
                    </select>
                </div>
                
                <div class="btn-group mt-2 mb-3 d-flex">
                    <button id="newDictionaryBtn" class="btn btn-primary flex-grow-1">
                        <i class="fas fa-plus"></i> New
                    </button>
                    <button id="importDictionaryBtn" class="btn btn-secondary flex-grow-1">
                        <i class="fas fa-file-import"></i> Import
                    </button>
                    <button id="exportDictionaryBtn" class="btn btn-secondary flex-grow-1">
                        <i class="fas fa-file-export"></i> Export
                    </button>
                    <button id="deleteDictionaryBtn" class="btn btn-danger flex-grow-1">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
                
                <div class="dictionary-info">
                    <div class="dictionary-words-count">Words: <span id="dictionaryWordsCount">0</span></div>
                    <div class="dictionary-last-modified">Last modified: <span id="dictionaryLastModified">Never</span></div>
                </div>
            </div>
        `;
        
        // Add panel to the DOM
        const container = document.querySelector('.container');
        container.appendChild(dictionaryPanel);
        
        // Store references to elements
        this.dictionarySelect = document.getElementById('dictionarySelect');
        this.dictionaryWordsCount = document.getElementById('dictionaryWordsCount');
        this.dictionaryLastModified = document.getElementById('dictionaryLastModified');
        
        // Initialize event listeners for dictionary management
        document.getElementById('newDictionaryBtn').addEventListener('click', () => this.createNewDictionary());
        document.getElementById('importDictionaryBtn').addEventListener('click', () => this.importDictionary());
        document.getElementById('exportDictionaryBtn').addEventListener('click', () => this.exportDictionary());
        document.getElementById('deleteDictionaryBtn').addEventListener('click', () => this.deleteDictionary());
        
        this.dictionarySelect.addEventListener('change', (e) => {
            this.loadDictionary(e.target.value);
        });
    }
    
    // Rest of the methods remain the same
    /* Methods omitted for brevity - they are the same as in the original file */
    
    createSettingsPanel() {
        // Create settings panel container
        const settingsPanel = document.createElement('div');
        settingsPanel.className = 'card settings-panel mt-3';
        settingsPanel.innerHTML = `
            <div class="card-header">
                <h5>Settings</h5>
            </div>
            <div class="card-body">
                <div class="form-group">
                    <label for="themeSelect">Theme</label>
                    <select id="themeSelect" class="form-control custom-select">
                        <option value="light" ${this.preferences.theme === 'light' ? 'selected' : ''}>Light</option>
                        <option value="dark" ${this.preferences.theme === 'dark' ? 'selected' : ''}>Dark</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="maxSuggestionsInput">Max Suggestions</label>
                    <input type="number" id="maxSuggestionsInput" class="form-control" 
                           min="1" max="20" value="${this.preferences.maxSuggestions || 5}">
                </div>
                
                <div class="form-check mb-2">
                    <input type="checkbox" class="form-check-input" id="fuzzyMatchingCheck" 
                           ${this.preferences.fuzzyMatchingEnabled ? 'checked' : ''}>
                    <label class="form-check-label" for="fuzzyMatchingCheck">Enable Fuzzy Matching</label>
                </div>
                
                <div class="form-group" id="fuzzyDistanceGroup" 
                     ${!this.preferences.fuzzyMatchingEnabled ? 'style="display:none;"' : ''}>
                    <label for="maxEditDistanceInput">Max Edit Distance</label>
                    <input type="number" id="maxEditDistanceInput" class="form-control" 
                           min="1" max="3" value="${this.preferences.maxEditDistance || 2}">
                </div>
                
                <div class="form-check">
                    <input type="checkbox" class="form-check-input" id="caseSensitiveCheck" 
                           ${this.preferences.caseSensitive ? 'checked' : ''}>
                    <label class="form-check-label" for="caseSensitiveCheck">Case Sensitive</label>
                </div>
                
                <button id="saveSettingsBtn" class="btn btn-primary mt-3">Save Settings</button>
            </div>
        `;
        
        // Add panel to the DOM
        const container = document.querySelector('.container');
        container.appendChild(settingsPanel);
        
        // Store references to elements
        this.themeSelect = document.getElementById('themeSelect');
        this.maxSuggestionsInput = document.getElementById('maxSuggestionsInput');
        this.fuzzyMatchingCheck = document.getElementById('fuzzyMatchingCheck');
        this.maxEditDistanceInput = document.getElementById('maxEditDistanceInput');
        this.caseSensitiveCheck = document.getElementById('caseSensitiveCheck');
        
        // Initialize event listeners for settings
        document.getElementById('saveSettingsBtn').addEventListener('click', () => this.saveSettings());
        
        this.fuzzyMatchingCheck.addEventListener('change', (e) => {
            document.getElementById('fuzzyDistanceGroup').style.display = e.target.checked ? 'block' : 'none';
        });
    }
    
    createVisualizerPanel() {
        // Create visualizer panel container
        const visualizerPanel = document.createElement('div');
        visualizerPanel.className = 'card visualizer-panel mt-3';
        visualizerPanel.innerHTML = `
            <div class="card-header">
                <h5>Trie Visualization</h5>
            </div>
            <div class="card-body">
                <div id="visualizerContainer" class="trie-visualizer-container"></div>
                <div class="form-group mt-3">
                    <label for="visualizePathInput">Visualize Path</label>
                    <div class="input-group">
                        <input type="text" id="visualizePathInput" class="form-control" placeholder="Enter prefix to visualize">
                        <div class="input-group-append">
                            <button id="visualizePathBtn" class="btn btn-primary">Visualize</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add panel to the DOM
        const container = document.querySelector('.container');
        container.appendChild(visualizerPanel);
        
        // Store references to elements
        this.visualizerContainer = document.getElementById('visualizerContainer');
        this.visualizePathInput = document.getElementById('visualizePathInput');
        
        // Initialize event listeners for visualizer
        document.getElementById('visualizePathBtn').addEventListener('click', () => {
            this.visualizePrefix(this.visualizePathInput.value);
        });
    }
    
    createStatisticsPanel() {
        // Create statistics panel container
        const statsPanel = document.createElement('div');
        statsPanel.className = 'card statistics-panel mt-3';
        statsPanel.innerHTML = `
            <div class="card-header">
                <h5>Statistics</h5>
            </div>
            <div class="card-body">
                <div class="stat-row">
                    <span class="stat-label">Total Words/Sentences:</span>
                    <span id="statTotalEntries" class="stat-value">0</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Unique Words/Sentences:</span>
                    <span id="statUniqueEntries" class="stat-value">0</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Memory Usage:</span>
                    <span id="statMemoryUsage" class="stat-value">0 KB</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Most Common Words:</span>
                    <div id="statCommonWords" class="stat-value common-words-list">
                        <span class="text-muted">No data</span>
                    </div>
                </div>
            </div>
        `;
        
        // Add panel to the DOM
        const container = document.querySelector('.container');
        container.appendChild(statsPanel);
        
        // Store references to elements
        this.statTotalEntries = document.getElementById('statTotalEntries');
        this.statUniqueEntries = document.getElementById('statUniqueEntries');
        this.statMemoryUsage = document.getElementById('statMemoryUsage');
        this.statCommonWords = document.getElementById('statCommonWords');
    }
    
    initVisualizer() {
        this.visualizer = new TrieVisualizer(this.visualizerContainer);
    }
    
    applyTheme(theme) {
        const body = document.body;
        const darkThemeClass = 'dark-theme';
        
        if (theme === 'dark') {
            body.classList.add(darkThemeClass);
        } else {
            body.classList.remove(darkThemeClass);
        }
        
        // Save preference
        this.preferences.theme = theme;
        this.dataManager.savePreferences(this.preferences);
    }
    
    initEventListeners() {
        // Input event for prefix input
        let timeoutId;
        this.prefixInput.addEventListener('input', () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                const input = this.prefixInput.value;
                
                // Get the last sentence after the last period
                const sentences = input.split('.');
                const lastSentence = sentences.pop().trim();
                
                if (lastSentence === '') {
                    this.resultsDiv.innerHTML = '<h4>Suggestions</h4>';
                    return;
                }
                
                this.updateSuggestions(lastSentence);
                
                // Update visualizer if path is being shown
                if (this.visualizePathInput.value === lastSentence) {
                    this.visualizePrefix(lastSentence);
                }
            }, 300); // Reduced delay for better responsiveness
        });
        
        // File input event
        this.fileInput.addEventListener('change', (event) => {
            const files = event.target.files;
            if (files.length > 0) {
                this.processFiles(files);
            }
        });
        
        // Upload button event
        const uploadBtn = document.getElementById('uploadBtn');
        if (uploadBtn) {
            uploadBtn.addEventListener('click', () => {
                this.fileInput.click();
            });
        }
    }
    
    processFiles(files) {
        // Process each file and add to current dictionary
        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target.result;
                const sentences = this.splitTextIntoSentences(text);
                
                // Add sentences to trie
                sentences.forEach(sentence => {
                    if (sentence.trim()) {
                        this.trie.insert(sentence.trim());
                    }
                });
                
                // Update UI
                this.updateDictionaryInfo();
                this.updateStatistics();
                this.updateVisualizer();
                
                // Save dictionary if active
                if (this.currentDictionary) {
                    this.saveDictionary();
                }
            };
            reader.readAsText(file);
        });
        
        // Update file dropdown
        this.uploadedFiles.push(...Array.from(files));
        this.updateFileDropdown();
    }
    
    splitTextIntoSentences(text) {
        // Improved sentence splitting logic
        return text.match(/[^.!?]*[.!?]/g) || [];
    }
    
    updateFileDropdown() {
        this.fileDropdown.innerHTML = '<option disabled selected>Uploaded files</option>';
        this.uploadedFiles.forEach((file) => {
            const option = document.createElement('option');
            option.textContent = file.name;
            this.fileDropdown.appendChild(option);
        });
    }
    
    updateSuggestions(prefix) {
        let results = [];
        
        // Get suggestions from trie
        if (this.preferences.fuzzyMatchingEnabled) {
            // Use fuzzy matching
            results = this.getFuzzySuggestions(prefix);
        } else {
            // Use exact matching
            results = this.trie.autocomplete(prefix);
        }
        
        // Update UI
        this.currentPage = 0;
        this.displaySuggestions(results, prefix);
    }
    
    getFuzzySuggestions(prefix) {
        if (!prefix) return [];
        
        // Generate variations of the prefix
        const variations = this.fuzzyMatcher.getVariations(prefix);
        const allResults = [];
        
        // Search for each variation
        variations.forEach(variation => {
            const results = this.trie.autocomplete(variation);
            allResults.push(...results);
        });
        
        // Remove duplicates
        const uniqueResults = [...new Set(allResults)];
        
        // Rank results by similarity to original prefix
        return this.fuzzyMatcher.rankMatches(prefix, uniqueResults);
    }
    
    displaySuggestions(results, prefix) {
        const startIndex = this.currentPage * this.resultsPerPage;
        const paginatedResults = results.slice(startIndex, startIndex + this.resultsPerPage);
        
        // Clear suggestions and add new ones with highlighting
        this.resultsDiv.innerHTML = '<h4>Suggestions</h4>';
        
        if (paginatedResults.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'no-results';
            noResults.textContent = 'No suggestions found';
            this.resultsDiv.appendChild(noResults);
            return;
        }
        
        paginatedResults.forEach(res => {
            const highlightedSuggestion = this.highlightMatch(res, prefix);
            const suggestionItem = document.createElement('div');
            suggestionItem.className = 'suggestion-item';
            suggestionItem.innerHTML = highlightedSuggestion;
            
            // Click event to insert suggestion
            suggestionItem.addEventListener('click', () => {
                const input = this.prefixInput;
                const sentences = input.value.split('.');
                sentences[sentences.length - 1] = res;
                input.value = sentences.join('.').trim();
                this.resultsDiv.innerHTML = '<h4>Suggestions</h4>'; // Clear suggestions
                
                // Record selection for learning
                this.trie.recordSelection(res);
                
                // Save dictionary if active
                if (this.currentDictionary) {
                    this.saveDictionary();
                }
            });
            
            this.resultsDiv.appendChild(suggestionItem);
        });
        
        // Add pagination controls
        this.addPaginationControls(results);
    }
    
    highlightMatch(text, match) {
        if (!match) return text;
        
        try {
            // Create RegExp for highlighting
            const pattern = new RegExp(`(${match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
            return text.replace(pattern, '<span class="highlight">$1</span>');
        } catch (e) {
            return text;
        }
    }
    
    addPaginationControls(results) {
        const totalPages = Math.ceil(results.length / this.resultsPerPage);
        
        if (totalPages <= 1) {
            return;
        }
        
        const paginationDiv = document.createElement('div');
        paginationDiv.className = 'pagination-controls';
        
        // Previous button
        if (this.currentPage > 0) {
            const prevButton = document.createElement('button');
            prevButton.className = 'btn btn-sm btn-outline-primary prev-button';
            prevButton.textContent = 'Previous';
            prevButton.addEventListener('click', () => {
                this.currentPage--;
                this.displaySuggestions(results, this.prefixInput.value.split('.').pop().trim());
            });
            paginationDiv.appendChild(prevButton);
        }
        
        // Page indicator
        const pageIndicator = document.createElement('span');
        pageIndicator.className = 'page-indicator';
        pageIndicator.textContent = `Page ${this.currentPage + 1} of ${totalPages}`;
        paginationDiv.appendChild(pageIndicator);
        
        // Next button
        if ((this.currentPage + 1) < totalPages) {
            const nextButton = document.createElement('button');
            nextButton.className = 'btn btn-sm btn-outline-primary next-button';
            nextButton.textContent = 'Next';
            nextButton.addEventListener('click', () => {
                this.currentPage++;
                this.displaySuggestions(results, this.prefixInput.value.split('.').pop().trim());
            });
            paginationDiv.appendChild(nextButton);
        }
        
        this.resultsDiv.appendChild(paginationDiv);
    }
    
    async loadDictionaries() {
        try {
            const dictionaries = await this.dataManager.getAllDictionaries();
            
            // Clear select options
            this.dictionarySelect.innerHTML = '<option value="default">Default Dictionary</option>';
            
            // Add dictionaries to select
            dictionaries.forEach(dict => {
                const option = document.createElement('option');
                option.value = dict.id;
                option.textContent = dict.name;
                this.dictionarySelect.appendChild(option);
            });
            
            // Load active dictionary if any
            if (this.preferences.activeDictionary) {
                this.dictionarySelect.value = this.preferences.activeDictionary;
                this.loadDictionary(this.preferences.activeDictionary);
            }
        } catch (error) {
            console.error('Error loading dictionaries:', error);
            this.showNotification('Error loading dictionaries', 'error');
        }
    }
    
    async loadDictionary(id) {
        try {
            if (id === 'default') {
                // Reset to default dictionary
                this.trie = new EnhancedTrie();
                this.currentDictionary = null;
                this.updateDictionaryInfo();
                this.updateStatistics();
                this.updateVisualizer();
                
                // Update preferences
                this.preferences.activeDictionary = 'default';
                this.dataManager.savePreferences(this.preferences);
                
                this.showNotification('Default dictionary loaded', 'success');
                return;
            }
            
            // Load dictionary from database
            const dictionary = await this.dataManager.getDictionary(id);
            if (!dictionary) {
                this.showNotification('Dictionary not found', 'error');
                return;
            }
            
            // Set trie data
            this.trie = new EnhancedTrie();
            this.trie.deserialize(dictionary.data);
            this.currentDictionary = dictionary;
            
            // Update UI
            this.updateDictionaryInfo();
            this.updateStatistics();
            this.updateVisualizer();
            
            // Update preferences
            this.preferences.activeDictionary = id;
            this.dataManager.savePreferences(this.preferences);
            
            this.showNotification(`Dictionary "${dictionary.name}" loaded`, 'success');
        } catch (error) {
            console.error('Error loading dictionary:', error);
            this.showNotification('Error loading dictionary', 'error');
        }
    }
    
    async saveDictionary() {
        if (!this.currentDictionary) {
            return;
        }
        
        try {
            // Update dictionary data
            this.currentDictionary.data = this.trie.serialize();
            this.currentDictionary.lastModified = new Date();
            this.currentDictionary.wordCount = this.trie.getSize();
            
            // Save to database
            await this.dataManager.updateDictionary(this.currentDictionary);
            
            // Update UI
            this.updateDictionaryInfo();
        } catch (error) {
            console.error('Error saving dictionary:', error);
            this.showNotification('Error saving dictionary', 'error');
        }
    }
    
    async createNewDictionary() {
        const name = prompt('Enter a name for the new dictionary:');
        if (!name) {
            return;
        }
        
        try {
            // Create new dictionary
            const newDict = {
                id: Date.now().toString(),
                name: name,
                data: new EnhancedTrie().serialize(),
                lastModified: new Date(),
                wordCount: 0
            };
            
            // Save to database
            await this.dataManager.addDictionary(newDict);
            
            // Reload dictionaries and select new one
            await this.loadDictionaries();
            this.dictionarySelect.value = newDict.id;
            this.loadDictionary(newDict.id);
            
            this.showNotification(`Dictionary "${name}" created`, 'success');
        } catch (error) {
            console.error('Error creating dictionary:', error);
            this.showNotification('Error creating dictionary', 'error');
        }
    }
    
    importDictionary() {
        // Create file input element
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';
        
        fileInput.addEventListener('change', async (event) => {
            const file = event.target.files[0];
            if (!file) {
                return;
            }
            
            try {
                const reader = new FileReader();
                reader.onload = async (e) => {
                    try {
                        const data = JSON.parse(e.target.result);
                        if (!data.name || !data.data) {
                            throw new Error('Invalid dictionary file');
                        }
                        
                        // Create new dictionary
                        const newDict = {
                            id: Date.now().toString(),
                            name: data.name,
                            data: data.data,
                            lastModified: new Date(),
                            wordCount: data.wordCount || 0
                        };
                        
                        // Save to database
                        await this.dataManager.addDictionary(newDict);
                        
                        // Reload dictionaries and select new one
                        await this.loadDictionaries();
                        this.dictionarySelect.value = newDict.id;
                        this.loadDictionary(newDict.id);
                        
                        this.showNotification(`Dictionary "${data.name}" imported`, 'success');
                    } catch (error) {
                        console.error('Error parsing dictionary file:', error);
                        this.showNotification('Invalid dictionary file', 'error');
                    }
                };
                reader.readAsText(file);
            } catch (error) {
                console.error('Error importing dictionary:', error);
                this.showNotification('Error importing dictionary', 'error');
            }
        });
        
        // Trigger file selection
        fileInput.click();
    }
    
    exportDictionary() {
        if (!this.currentDictionary) {
            this.showNotification('No dictionary selected', 'error');
            return;
        }
        
        try {
            // Create export data
            const exportData = {
                name: this.currentDictionary.name,
                data: this.trie.serialize(),
                wordCount: this.trie.getSize(),
                lastModified: new Date()
            };
            
            // Create download link
            const dataStr = JSON.stringify(exportData, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const downloadLink = document.createElement('a');
            downloadLink.href = url;
            downloadLink.download = `${this.currentDictionary.name}.json`;
            
            // Trigger download
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            
            this.showNotification('Dictionary exported successfully', 'success');
        } catch (error) {
            console.error('Error exporting dictionary:', error);
            this.showNotification('Error exporting dictionary', 'error');
        }
    }
    
    async deleteDictionary() {
        if (!this.currentDictionary) {
            this.showNotification('No dictionary selected', 'error');
            return;
        }
        
        const confirmDelete = window.confirm(`Are you sure you want to delete "${this.currentDictionary.name}"?`);
        if (!confirmDelete) {
            return;
        }
        
        try {
            // Delete from database
            await this.dataManager.deleteDictionary(this.currentDictionary.id);
            
            // Reload dictionaries and select default
            await this.loadDictionaries();
            this.dictionarySelect.value = 'default';
            this.loadDictionary('default');
            
            this.showNotification('Dictionary deleted', 'success');
        } catch (error) {
            console.error('Error deleting dictionary:', error);
            this.showNotification('Error deleting dictionary', 'error');
        }
    }
    
    saveSettings() {
        // Update preferences
        this.preferences.theme = this.themeSelect.value;
        this.preferences.maxSuggestions = parseInt(this.maxSuggestionsInput.value) || 5;
        this.preferences.fuzzyMatchingEnabled = this.fuzzyMatchingCheck.checked;
        this.preferences.maxEditDistance = parseInt(this.maxEditDistanceInput.value) || 2;
        this.preferences.caseSensitive = this.caseSensitiveCheck.checked;
        
        // Update components
        this.resultsPerPage = this.preferences.maxSuggestions;
        this.fuzzyMatcher.setMaxDistance(this.preferences.maxEditDistance);
        this.trie.setCaseSensitive(this.preferences.caseSensitive);
        
        // Apply theme
        this.applyTheme(this.preferences.theme);
        
        // Save to storage
        this.dataManager.savePreferences(this.preferences);
        
        this.showNotification('Settings saved', 'success');
    }
    
    updateDictionaryInfo() {
        if (this.currentDictionary) {
            this.dictionaryWordsCount.textContent = this.trie.getSize();
            
            const lastModified = new Date(this.currentDictionary.lastModified);
            this.dictionaryLastModified.textContent = lastModified.toLocaleString();
        } else {
            this.dictionaryWordsCount.textContent = this.trie.getSize();
            this.dictionaryLastModified.textContent = 'Never';
        }
    }
    
    updateStatistics() {
        // Update total entries
        this.statTotalEntries.textContent = this.trie.getTotalNodes();
        
        // Update unique entries
        this.statUniqueEntries.textContent = this.trie.getSize();
        
        // Update memory usage (rough estimate)
        const serialized = this.trie.serialize();
        const memoryUsage = Math.round(JSON.stringify(serialized).length / 1024);
        this.statMemoryUsage.textContent = `${memoryUsage} KB`;
        
        // Update most common words
        const commonWords = this.trie.getMostCommonWords(5);
        
        if (commonWords.length > 0) {
            this.statCommonWords.innerHTML = '';
            commonWords.forEach(word => {
                const wordSpan = document.createElement('span');
                wordSpan.className = 'common-word-item';
                wordSpan.textContent = `${word.text} (${word.count})`;
                this.statCommonWords.appendChild(wordSpan);
            });
        } else {
            this.statCommonWords.innerHTML = '<span class="text-muted">No data</span>';
        }
    }
    
    /**
     * Update trie visualizer
     */
    updateVisualizer() {
        // Update visualizer with current trie data
        this.visualizer.setTrie(this.trie);
        this.visualizer.render();
    }
    
    /**
     * Visualize a specific prefix path in the trie
     * @param {string} prefix - Prefix to visualize
     */
    visualizePrefix(prefix) {
        this.visualizer.setTrie(this.trie);
        this.visualizer.highlightPath(prefix);
        this.visualizer.render();
    }
    
    /**
     * Show notification to user
     * @param {string} message - Notification message
     * @param {string} type - Notification type ('success', 'error', 'info')
     */
    showNotification(message, type = 'info') {
        // Check if notification container exists
        let notifContainer = document.getElementById('notification-container');
        if (!notifContainer) {
            // Create container if it doesn't exist
            notifContainer = document.createElement('div');
            notifContainer.id = 'notification-container';
            document.body.appendChild(notifContainer);
        }
    
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;
    
        // Add close event
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.classList.add('notification-hiding');
            setTimeout(() => {
                notification.remove();
            }, 300);
        });
    
        // Add to container
        notifContainer.appendChild(notification);
    
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.classList.add('notification-hiding');
                setTimeout(() => {
                    notification.remove();
                }, 300);
            }
        }, 5000);
    }
}