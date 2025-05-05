/**
 * Enhanced Trie implementation with frequency tracking and better text processing
 */
export class TrieNode {
    constructor() {
        this.children = {};
        this.isEndOfWord = false;
        this.fullSentence = "";
        this.frequency = 0; // Track how often this word/sentence appears
        this.lastUsed = 0;  // Timestamp for recency tracking
    }
}

export default class EnhancedTrie {
    constructor() {
        this.root = new TrieNode();
        this.totalInsertions = 0;
    }

    /**
     * Inserts a sentence into the trie with proper text processing
     * @param {string} sentence - The sentence to insert
     */
    insert(sentence) {
        if (!sentence || typeof sentence !== 'string') return;
        
        // Process the sentence to handle punctuation and standardize text
        const processedSentence = this.processSentence(sentence);
        
        let node = this.root;
        // Insert character by character
        for (const char of processedSentence) {
            if (!node.children[char]) {
                node.children[char] = new TrieNode();
            }
            node = node.children[char];
        }
        
        node.isEndOfWord = true;
        node.fullSentence = sentence.trim(); // Keep the original sentence with proper punctuation
        node.frequency++; // Increment frequency count
        node.lastUsed = Date.now(); // Update last used timestamp
        this.totalInsertions++;
    }

    /**
     * Autocompletes based on a prefix, returning ranked suggestions
     * @param {string} prefix - The prefix to find suggestions for
     * @param {number} limit - Maximum number of suggestions to return
     * @returns {Array} - Ranked list of suggestions
     */
    autocomplete(prefix, limit = 10) {
        if (!prefix) return [];
        
        // Process the prefix to match the trie structure
        const processedPrefix = this.processSentence(prefix);
        
        // Navigate to the node representing the prefix
        let node = this.root;
        for (const char of processedPrefix) {
            if (!node.children[char]) {
                return []; // No matches
            }
            node = node.children[char];
        }
        
        // Find all words from this node
        const suggestions = this.findAllWords(node);
        
        // Sort suggestions by frequency and recency
        return this.rankSuggestions(suggestions, limit);
    }

    /**
     * Process text for consistency in the trie
     * @param {string} text - Text to process
     * @returns {string} - Processed text
     */
    processSentence(text) {
        // Convert to lowercase for case-insensitive matching
        // Preserve spaces for better sentence structure
        return text.toLowerCase();
    }

    /**
     * Find all words/sentences from a given node
     * @param {TrieNode} node - Starting node
     * @returns {Array} - List of suggestion objects with text and metadata
     */
    findAllWords(node, results = []) {
        if (node.isEndOfWord) {
            results.push({
                text: node.fullSentence,
                frequency: node.frequency,
                lastUsed: node.lastUsed
            });
        }
        
        for (const char in node.children) {
            this.findAllWords(node.children[char], results);
        }
        
        return results;
    }

    /**
     * Rank suggestions by relevance
     * @param {Array} suggestions - List of suggestion objects
     * @param {number} limit - Maximum number to return
     * @returns {Array} - Ranked and limited suggestions
     */
    rankSuggestions(suggestions, limit) {
        // Sort by a combination of frequency and recency
        return suggestions
            .sort((a, b) => {
                // Primary sort by frequency
                const freqDiff = b.frequency - a.frequency;
                if (freqDiff !== 0) return freqDiff;
                
                // Secondary sort by recency (last used)
                return b.lastUsed - a.lastUsed;
            })
            .slice(0, limit) // Limit results
            .map(item => item.text); // Return just the text
    }

    /**
     * Record that a suggestion was selected to improve future rankings
     * @param {string} sentence - The selected sentence
     */
    recordSelection(sentence) {
        if (!sentence) return;
        
        const processedSentence = this.processSentence(sentence);
        let node = this.root;
        
        for (const char of processedSentence) {
            if (!node.children[char]) return; // Not found
            node = node.children[char];
        }
        
        if (node.isEndOfWord && node.fullSentence === sentence) {
            node.frequency++;
            node.lastUsed = Date.now();
        }
    }

    /**
     * Returns statistics about the trie
     * @returns {Object} - Statistics
     */
    getStats() {
        return {
            totalInsertions: this.totalInsertions,
            uniqueEntries: this.countUniqueEntries(),
            memoryEstimate: this.estimateMemoryUsage()
        };
    }

    /**
     * Count unique entries in the trie
     * @returns {number} - Count of unique entries
     */
    countUniqueEntries() {
        const count = { value: 0 };
        this.countNodes(this.root, count);
        return count.value;
    }

    /**
     * Helper method to count nodes
     */
    countNodes(node, count) {
        if (node.isEndOfWord) {
            count.value++;
        }
        
        for (const child in node.children) {
            this.countNodes(node.children[child], count);
        }
    }

    /**
     * Estimate memory usage of the trie
     * @returns {number} - Estimated bytes
     */
    estimateMemoryUsage() {
        // Rough estimate based on node structure
        const nodeSize = 200; // Bytes per node (approximate)
        return this.countTotalNodes() * nodeSize;
    }

    /**
     * Count total nodes in the trie
     * @returns {number} - Total node count
     */
    countTotalNodes() {
        const count = { value: 0 };
        this.countTotalNodesHelper(this.root, count);
        return count.value;
    }

    /**
     * Helper method to count all nodes
     */
    countTotalNodesHelper(node, count) {
        count.value++;
        for (const child in node.children) {
            this.countTotalNodesHelper(node.children[child], count);
        }
    }
}