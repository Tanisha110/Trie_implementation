// Export the FuzzyMatcher class as default export
export default class FuzzyMatcher {
    /**
     * Constructor
     * @param {number} maxDistance - Maximum edit distance to consider a match
     */
    constructor(maxDistance = 2) {
        this.maxDistance = maxDistance;
    }

    /**
     * Gets all possible variations of a word within the edit distance
     * @param {string} word - The word to get variations for
     * @returns {Set} - Set of possible variations
     */
    getVariations(word) {
        // Start with the original word
        const variations = new Set([word]);
        
        // If the word is empty or maxDistance is 0, return early
        if (!word || this.maxDistance <= 0) return variations;
        
        // For each edit distance from 1 to maxDistance
        for (let i = 1; i <= this.maxDistance; i++) {
            const currentWords = [...variations];
            
            // For each current word
            for (const currentWord of currentWords) {
                // Add all possible variations at distance 1
                this.addEdits(currentWord, variations);
            }
        }
        
        return variations;
    }
    
    /**
     * Add all possible edits at distance 1 from the word
     * @param {string} word - The word to edit
     * @param {Set} variations - Set to add variations to
     */
    addEdits(word, variations) {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789 ';
        
        // Deletions
        for (let i = 0; i < word.length; i++) {
            variations.add(word.slice(0, i) + word.slice(i + 1));
        }
        
        // Transpositions
        for (let i = 0; i < word.length - 1; i++) {
            variations.add(
                word.slice(0, i) + 
                word[i + 1] + 
                word[i] + 
                word.slice(i + 2)
            );
        }
        
        // Replacements
        for (let i = 0; i < word.length; i++) {
            for (const char of chars) {
                variations.add(
                    word.slice(0, i) + 
                    char + 
                    word.slice(i + 1)
                );
            }
        }
        
        // Insertions
        for (let i = 0; i <= word.length; i++) {
            for (const char of chars) {
                variations.add(
                    word.slice(0, i) + 
                    char + 
                    word.slice(i)
                );
            }
        }
    }
    
    /**
     * Calculate Levenshtein distance between two strings
     * @param {string} s1 - First string
     * @param {string} s2 - Second string
     * @returns {number} - Edit distance
     */
    levenshteinDistance(s1, s2) {
        if (s1 === s2) return 0;
        if (!s1) return s2.length;
        if (!s2) return s1.length;
        
        const m = s1.length;
        const n = s2.length;
        
        // Create distance matrix
        let dp = Array(m + 1).fill().map(() => Array(n + 1).fill(0));
        
        // Initialize first row and column
        for (let i = 0; i <= m; i++) dp[i][0] = i;
        for (let j = 0; j <= n; j++) dp[0][j] = j;
        
        // Fill the matrix
        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
                dp[i][j] = Math.min(
                    dp[i - 1][j] + 1,          // deletion
                    dp[i][j - 1] + 1,          // insertion
                    dp[i - 1][j - 1] + cost    // substitution
                );
            }
        }
        
        return dp[m][n];
    }

    /**
     * Calculate similarity score between two strings (lower is better)
     * @param {string} original - Original string
     * @param {string} match - String to match
     * @returns {number} - Similarity score
     */
    calculateSimilarity(original, match) {
        // Normalize strings
        const s1 = original.toLowerCase();
        const s2 = match.toLowerCase();
        
        // Calculate edit distance
        const distance = this.levenshteinDistance(s1, s2);
        
        // Calculate similarity score (normalized by longer string length)
        const maxLen = Math.max(s1.length, s2.length);
        if (maxLen === 0) return 0;
        
        return distance / maxLen;
    }

    /**
     * Check if two strings match within the edit distance
     * @param {string} s1 - First string
     * @param {string} s2 - Second string
     * @returns {boolean} - Whether strings match
     */
    matches(s1, s2) {
        if (!s1 || !s2) return false;
        if (s1 === s2) return true;
        
        const distance = this.levenshteinDistance(s1.toLowerCase(), s2.toLowerCase());
        return distance <= this.maxDistance;
    }

    /**
     * Find the best matching variation of the query in the text
     * @param {string} query - Original query
     * @param {string} text - Text to search in
     * @param {Array} variations - Variations of the query
     * @returns {object} - Best match information
     */
    findBestMatchingVariation(query, text, variations = null) {
        if (!variations) {
            variations = this.getVariations(query);
        }
        
        let bestMatch = { 
            variation: query,
            distance: this.levenshteinDistance(query.toLowerCase(), text.toLowerCase())
        };
        
        for (const variation of variations) {
            if (variation === query) continue;
            
            const distance = this.levenshteinDistance(variation.toLowerCase(), text.toLowerCase());
            if (distance < bestMatch.distance) {
                bestMatch = { variation, distance };
            }
        }
        
        return bestMatch;
    }

    /**
     * Rank matches by similarity, preserving object structure and adding match info
     * @param {string} query - Query string
     * @param {Array} candidates - Candidate objects with 'text' property
     * @returns {Array} - Ranked candidates with match info
     */
    rankMatchesWithInfo(query, candidates) {
        if (!query || !candidates || candidates.length === 0) {
            return [];
        }
        
        // For each candidate, find the best matching variation
        const withScores = candidates.map(candidate => {
            const text = candidate.text || candidate;
            const variation = candidate.variation || query;
            
            // Find best matching variation (either the provided one or compute)
            const matchInfo = this.findBestMatchingVariation(query, text);
            const distance = matchInfo.distance;
            const score = distance / Math.max(query.length, text.length);
            
            return {
                ...candidate,
                score,
                matchInfo: {
                    distance,
                    matchedVariation: matchInfo.variation
                }
            };
        });
        
        // Sort by score (lower is better)
        return withScores.sort((a, b) => a.score - b.score);
    }

    /**
     * Rank matches by similarity
     * @param {string} query - Query string
     * @param {Array} candidates - Candidate strings
     * @returns {Array} - Ranked candidates
     */
    rankMatches(query, candidates) {
        if (!query || !candidates || candidates.length === 0) {
            return [];
        }
        
        // Calculate similarity for each candidate
        const withScores = candidates.map(candidate => ({
            text: candidate,
            score: this.calculateSimilarity(query, candidate)
        }));
        
        // Sort by score (lower is better)
        return withScores
            .sort((a, b) => a.score - b.score)
            .map(item => item.text);
    }
}