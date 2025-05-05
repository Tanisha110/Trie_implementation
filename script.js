// Import classes properly
import FuzzyMatcher from './fuzzy-matcher.js';
import EnhancedTrie from './enhanced-trie.js';

/**
 * Combines EnhancedTrie and FuzzyMatcher for fuzzy autocomplete
 */
class FuzzyTrieAutocomplete {
  constructor(maxDistance = 2) {
    this.fuzzyMatcher = new FuzzyMatcher(maxDistance);
    this.trie = new EnhancedTrie();
  }

  insert(sentence) {
    if (sentence && sentence.trim()) {
      this.trie.insert(sentence);
      return true;
    }
    return false;
  }

  autocomplete(query, limit = 10) {
    if (!query) return [];

    // Generate fuzzy variations of the query
    const variations = this.fuzzyMatcher.getVariations(query);
    const allSuggestions = [];

    // Collect suggestions for each variation
    variations.forEach(variation => {
      const suggestions = this.trie.autocomplete(variation, limit);
      allSuggestions.push(...suggestions);
    });

    // De-duplicate
    const uniqueSuggestions = [...new Set(allSuggestions)];

    // Rank final list by fuzzy similarity
    return this.fuzzyMatcher.rankMatches(query, uniqueSuggestions).slice(0, limit);
  }

  recordSelection(sentence) {
    this.trie.recordSelection(sentence);
  }
}

// --- Initialization & DOM Wiring ---
document.addEventListener('DOMContentLoaded', () => {
  const fuzzyAutocomplete = new FuzzyTrieAutocomplete(2);
  let currentPage = 0;
  const resultsPerPage = 5;

  // Get DOM elements
  const fileInput = document.getElementById('fileInput');
  const fileDropdown = document.getElementById('fileDropdown');
  const prefixInput = document.getElementById('prefixInput');
  const resultsDiv = document.getElementById('results');
  const uploadStatus = document.getElementById('upload-status');

  // Initialize with some example data
  const exampleSentences = [
    "The quick brown fox jumps over the lazy dog.",
    "Hello world, this is a test sentence.",
    "JavaScript is a programming language.",
    "Enhanced tries are useful for autocomplete features.",
    "Fuzzy matching allows for typo tolerance."
  ];
  
  exampleSentences.forEach(sentence => {
    fuzzyAutocomplete.insert(sentence);
  });

  // File upload handling
  fileInput.addEventListener('change', event => {
    const files = Array.from(event.target.files);
    
    if (files.length === 0) {
      uploadStatus.textContent = "No files selected";
      return;
    }
    
    uploadStatus.textContent = `Processing ${files.length} file(s)...`;
    
    // Clear and update dropdown
    fileDropdown.innerHTML = '<option disabled selected>Uploaded files</option>';
    
    let totalSentences = 0;
    let processedFiles = 0;
    
    files.forEach(file => {
      // Show in dropdown
      const opt = document.createElement('option');
      opt.textContent = file.name;
      fileDropdown.appendChild(opt);

      // Read and insert sentences
      const reader = new FileReader();
      reader.onload = e => {
        const content = e.target.result;
        // Split by sentence endings
        const sentences = content.split(/[.!?]/)
          .map(s => s.trim())
          .filter(s => s.length > 0)
          .map(s => s + ".");
        
        // Insert each sentence
        let insertedCount = 0;
        sentences.forEach(s => {
          if (fuzzyAutocomplete.insert(s)) {
            insertedCount++;
          }
        });
        
        totalSentences += insertedCount;
        processedFiles++;
        
        if (processedFiles === files.length) {
          uploadStatus.textContent = `Processed ${totalSentences} sentences from ${files.length} file(s)`;
          setTimeout(() => {
            uploadStatus.textContent = "";
          }, 3000);
        }
      };
      reader.onerror = () => {
        uploadStatus.textContent = `Error reading file: ${file.name}`;
      };
      reader.readAsText(file);
    });
  });

  // Render paginated suggestions
  function displaySuggestions(suggestions, query) {
    resultsDiv.innerHTML = '<h4>Suggestions</h4>';
    
    if (!suggestions || suggestions.length === 0) {
      resultsDiv.innerHTML += '<p>No suggestions found.</p>';
      return;
    }
    
    const start = currentPage * resultsPerPage;
    const pageItems = suggestions.slice(start, start + resultsPerPage);

    pageItems.forEach(text => {
      const div = document.createElement('div');
      div.className = 'suggestion-item';
      
      // Highlight match if possible
      try {
        div.innerHTML = text.replace(
          new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'),
          '<span class="highlight">$1</span>'
        );
      } catch (e) {
        div.textContent = text; // Fallback if regex fails
      }
      
      div.addEventListener('click', () => {
        // Replace last sentence in input or just set the value
        if (prefixInput.value.includes('.')) {
          const parts = prefixInput.value.split('.');
          parts[parts.length - 1] = text.replace(/\.$/, '');
          prefixInput.value = parts.join('.').trim();
        } else {
          prefixInput.value = text;
        }
        
        // Record this selection to improve future suggestions
        fuzzyAutocomplete.recordSelection(text);
        resultsDiv.innerHTML = '<h4>Suggestions</h4>';
      });
      
      resultsDiv.appendChild(div);
    });

    // Add pagination controls if needed
    if (suggestions.length > resultsPerPage) {
      const controls = document.createElement('div');
      controls.className = 'pagination-controls';

      if (currentPage > 0) {
        const prev = document.createElement('button');
        prev.textContent = 'Previous';
        prev.className = 'btn btn-sm btn-outline-primary mr-2';
        prev.onclick = () => {
          currentPage--;
          displaySuggestions(suggestions, query);
        };
        controls.appendChild(prev);
      }

      // Page indicator
      const pageIndicator = document.createElement('span');
      pageIndicator.className = 'mx-2';
      pageIndicator.textContent = `Page ${currentPage + 1} of ${Math.ceil(suggestions.length / resultsPerPage)}`;
      controls.appendChild(pageIndicator);

      if (start + resultsPerPage < suggestions.length) {
        const next = document.createElement('button');
        next.textContent = 'Next';
        next.className = 'btn btn-sm btn-outline-primary ml-2';
        next.onclick = () => {
          currentPage++;
          displaySuggestions(suggestions, query);
        };
        controls.appendChild(next);
      }

      resultsDiv.appendChild(controls);
    }
  }

  // Debounced input handling
  let timeoutId;
  prefixInput.addEventListener('input', () => {
    clearTimeout(timeoutId);
    
    timeoutId = setTimeout(() => {
      const text = prefixInput.value;
      // Get the last partial sentence (after the last period)
      const lastSentence = text.includes('.') ? 
        text.split('.').pop().trim() : 
        text.trim();
      
      if (!lastSentence) {
        resultsDiv.innerHTML = '<h4>Suggestions</h4>';
        return;
      }
      
      currentPage = 0;
      const suggestions = fuzzyAutocomplete.autocomplete(lastSentence, 50);
      displaySuggestions(suggestions, lastSentence);
    }, 300);
  });
});