/**
 * DataManager - Handles data persistence for the trie
 * Manages dictionaries, user preferences, and serialization
 */

class DataManager {
    constructor() {
        this.DB_NAME = 'trieAutocompleteDB';
        this.STORE_NAME = 'dictionaries';
        this.PREFERENCES_KEY = 'userPreferences';
        this.dbPromise = this.initDatabase();
    }

    /**
     * Initialize the IndexedDB database
     * @returns {Promise} - Promise resolving to database connection
     */
    async initDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, 1);
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create object stores if they don't exist
                if (!db.objectStoreNames.contains(this.STORE_NAME)) {
                    const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
                    store.createIndex('name', 'name', { unique: true });
                    store.createIndex('lastModified', 'lastModified', { unique: false });
                }
            };
            
            request.onsuccess = (event) => {
                resolve(event.target.result);
            };
            
            request.onerror = (event) => {
                console.error('IndexedDB error:', event.target.error);
                reject(event.target.error);
            };
        });
    }
    
    /**
     * Get a database connection
     * @returns {Promise} - Promise resolving to database connection
     */
    async getDB() {
        return this.dbPromise;
    }
    
    /**
     * Save a dictionary to the database
     * @param {Object} dictionary - Dictionary object with id, name, data
     * @returns {Promise} - Promise resolving when save completes
     */
    async saveDictionary(dictionary) {
        try {
            const db = await this.getDB();
            
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([this.STORE_NAME], 'readwrite');
                const store = transaction.objectStore(this.STORE_NAME);
                
                // Add timestamp
                dictionary.lastModified = new Date().getTime();
                
                const request = store.put(dictionary);
                
                request.onsuccess = () => resolve(dictionary);
                request.onerror = (event) => reject(event.target.error);
                
                transaction.oncomplete = () => resolve(dictionary);
                transaction.onerror = (event) => reject(event.target.error);
            });
        } catch (error) {
            console.error('Error saving dictionary:', error);
            throw error;
        }
    }
    
    /**
     * Load a dictionary from the database
     * @param {string} id - Dictionary ID
     * @returns {Promise} - Promise resolving to dictionary object
     */
    async loadDictionary(id) {
        try {
            const db = await this.getDB();
            
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([this.STORE_NAME], 'readonly');
                const store = transaction.objectStore(this.STORE_NAME);
                const request = store.get(id);
                
                request.onsuccess = (event) => {
                    resolve(event.target.result);
                };
                
                request.onerror = (event) => {
                    reject(event.target.error);
                };
            });
        } catch (error) {
            console.error('Error loading dictionary:', error);
            throw error;
        }
    }
    
    /**
     * Delete a dictionary from the database
     * @param {string} id - Dictionary ID
     * @returns {Promise} - Promise resolving when delete completes
     */
    async deleteDictionary(id) {
        try {
            const db = await this.getDB();
            
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([this.STORE_NAME], 'readwrite');
                const store = transaction.objectStore(this.STORE_NAME);
                const request = store.delete(id);
                
                request.onsuccess = () => resolve(true);
                request.onerror = (event) => reject(event.target.error);
            });
        } catch (error) {
            console.error('Error deleting dictionary:', error);
            throw error;
        }
    }
    
    /**
     * Get all dictionaries from the database
     * @returns {Promise} - Promise resolving to array of dictionaries
     */
    async getAllDictionaries() {
        try {
            const db = await this.getDB();
            
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([this.STORE_NAME], 'readonly');
                const store = transaction.objectStore(this.STORE_NAME);
                const request = store.getAll();
                
                request.onsuccess = (event) => {
                    resolve(event.target.result);
                };
                
                request.onerror = (event) => {
                    reject(event.target.error);
                };
            });
        } catch (error) {
            console.error('Error getting dictionaries:', error);
            throw error;
        }
    }
    
    /**
     * Save user preferences
     * @param {Object} preferences - User preferences object
     * @returns {Promise} - Promise resolving when save completes
     */
    async savePreferences(preferences) {
        try {
            localStorage.setItem(this.PREFERENCES_KEY, JSON.stringify(preferences));
            return preferences;
        } catch (error) {
            console.error('Error saving preferences:', error);
            throw error;
        }
    }
    
    /**
     * Load user preferences
     * @returns {Object} - User preferences object
     */
    loadPreferences() {
        try {
            const preferences = localStorage.getItem(this.PREFERENCES_KEY);
            return preferences ? JSON.parse(preferences) : this.getDefaultPreferences();
        } catch (error) {
            console.error('Error loading preferences:', error);
            return this.getDefaultPreferences();
        }
    }
    
    /**
     * Get default user preferences
     * @returns {Object} - Default preferences object
     */
    getDefaultPreferences() {
        return {
            theme: 'light',
            maxSuggestions: 5,
            fuzzyMatchingEnabled: true,
            maxEditDistance: 2,
            caseSensitive: false,
            activeDictionary: null
        };
    }
    
    /**
     * Export a dictionary to JSON file
     * @param {string} id - Dictionary ID
     * @returns {Promise} - Promise resolving to Blob of dictionary data
     */
    async exportDictionary(id) {
        try {
            const dictionary = await this.loadDictionary(id);
            if (!dictionary) {
                throw new Error('Dictionary not found');
            }
            
            const blob = new Blob([JSON.stringify(dictionary, null, 2)], {
                type: 'application/json'
            });
            
            return blob;
        } catch (error) {
            console.error('Error exporting dictionary:', error);
            throw error;
        }
    }
    
    /**
     * Import a dictionary from JSON file
     * @param {File} file - JSON file to import
     * @returns {Promise} - Promise resolving to imported dictionary
     */
    async importDictionary(file) {
        try {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                
                reader.onload = async (e) => {
                    try {
                        const dictionary = JSON.parse(e.target.result);
                        
                        // Validate dictionary structure
                        if (!dictionary.id || !dictionary.name || !dictionary.data) {
                            reject(new Error('Invalid dictionary format'));
                            return;
                        }
                        
                        // Generate new ID to avoid conflicts
                        dictionary.id = `imported_${Date.now()}`;
                        
                        // Save to database
                        const saved = await this.saveDictionary(dictionary);
                        resolve(saved);
                    } catch (error) {
                        reject(error);
                    }
                };
                
                reader.onerror = () => {
                    reject(new Error('Error reading file'));
                };
                
                reader.readAsText(file);
            });
        } catch (error) {
            console.error('Error importing dictionary:', error);
            throw error;
        }
    }
    
    /**
     * Convert trie to serializable format
     * @param {Object} trie - Trie object to serialize
     * @returns {Object} - Serialized trie data
     */
    serializeTrie(trie) {
        if (!trie || !trie.root) {
            return null;
        }
        
        const serializeNode = (node) => {
            const serialized = {
                children: {},
                isEndOfWord: node.isEndOfWord
            };
            
            if (node.isEndOfWord) {
                serialized.fullSentence = node.fullSentence;
                serialized.frequency = node.frequency || 1;
                serialized.lastUsed = node.lastUsed || Date.now();
            }
            
            for (const char in node.children) {
                serialized.children[char] = serializeNode(node.children[char]);
            }
            
            return serialized;
        };
        
        return {
            root: serializeNode(trie.root),
            totalInsertions: trie.totalInsertions || 0
        };
    }
    
    /**
     * Create trie from serialized data
     * @param {Object} data - Serialized trie data
     * @returns {Object} - Trie object
     */
    deserializeTrie(data) {
        if (!data || !data.root) {
            return new EnhancedTrie();
        }
        
        const trie = new EnhancedTrie();
        trie.totalInsertions = data.totalInsertions || 0;
        
        const deserializeNode = (serialized, node) => {
            node.isEndOfWord = serialized.isEndOfWord || false;
            
            if (serialized.isEndOfWord) {
                node.fullSentence = serialized.fullSentence || '';
                node.frequency = serialized.frequency || 1;
                node.lastUsed = serialized.lastUsed || Date.now();
            }
            
            for (const char in serialized.children) {
                node.children[char] = new TrieNode();
                deserializeNode(serialized.children[char], node.children[char]);
            }
        };
        
        deserializeNode(data.root, trie.root);
        return trie;
    }
}