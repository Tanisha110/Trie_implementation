class TrieNode {
    constructor() {
        this.children = {};
        this.isEndOfWord = false;
        this.fullSentence = "";
    }
}

class Trie {
    constructor() {
        this.root = new TrieNode();
    }

    insert(sentence) {
        let node = this.root;
        for (const char of sentence) {
            if (char === ' ') continue; // Ignore spaces
            if (!node.children[char]) {
                node.children[char] = new TrieNode();
            }
            node = node.children[char];
        }
        node.isEndOfWord = true;
        node.fullSentence = sentence;
    }

    autocomplete(prefix) {
        let node = this.root;
        for (const char of prefix) {
            if (char === ' ') continue; // Ignore spaces
            if (!node.children[char]) {
                return []; // No suggestions
            }
            node = node.children[char];
        }
        return this.findWords(node);
    }

    findWords(node) {
        const results = [];
        if (node.isEndOfWord) {
            results.push(node.fullSentence);
        }
        for (const child in node.children) {
            results.push(...this.findWords(node.children[child]));
        }
        return results;
    }
}

let trie = new Trie();
let currentPage = 0;
const resultsPerPage = 5;
let uploadedFiles = [];

// Event listener for file input
document.getElementById('fileInput').addEventListener('change', (event) => {
    const files = event.target.files;
    const fileDropdown = document.getElementById('fileDropdown');

    // If files were uploaded, add them to the uploadedFiles array and update the dropdown list
    if (files.length > 0) {
        uploadedFiles.push(...Array.from(files));

        // Clear the dropdown and add the filenames
        fileDropdown.innerHTML = '<option disabled selected>Uploaded files</option>';
        uploadedFiles.forEach((file) => {
            const option = document.createElement('option');
            option.textContent = file.name;
            fileDropdown.appendChild(option);
        });

        // Read the uploaded files and add their sentences to the trie
        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = function (e) {
                const sentences = splitText(e.target.result); // Split into sentences
                sentences.forEach(sentence => {
                    if (sentence.trim()) {
                        trie.insert(sentence.trim()); // Insert sentences into the trie
                    }
                });
            };
            reader.readAsText(file); // Read file as text
        });
    }
});

// Function to split text into sentences
function splitText(text) {
    return text.match(/[^.!?]*[.!?]/g) || [];
}

// Function to display suggestions in the results section
function displaySuggestions(results, prefix) {
    const resultsDiv = document.getElementById('results');
    const startIndex = currentPage * resultsPerPage;
    const paginatedResults = results.slice(startIndex, startIndex + resultsPerPage);

    // Clear suggestions and add new ones with highlighting
    resultsDiv.innerHTML = '<h4>Suggestions</h4>';
    paginatedResults.forEach(res => {
        const highlightedSuggestion = res.replace(new RegExp(`(${prefix})`, 'gi'), `<span class="highlight">$1</span>`);
        const suggestionItem = document.createElement('div');
        suggestionItem.className = 'suggestion-item';
        suggestionItem.innerHTML = highlightedSuggestion;

        // Click event to insert the selected suggestion into the input field
        suggestionItem.addEventListener('click', () => {
            const input = document.getElementById('prefixInput');
            const sentences = input.value.split('.');
            sentences[sentences.length - 1] = res;
            input.value = sentences.join('.').trim(); // Remove extra spaces, no additional period needed
            resultsDiv.innerHTML = '<h4>Suggestions</h4>'; // Clear suggestions after selection
        });

        resultsDiv.appendChild(suggestionItem);
    });

    // Next button if more results available
    const nextButton = document.createElement('button');
    nextButton.textContent = 'Next';
    nextButton.className = 'next-button';
    nextButton.onclick = () => {
        currentPage++;
        displaySuggestions(results, prefix);
    };

    // Previous button for navigating back
    const prevButton = document.createElement('button');
    prevButton.textContent = 'Previous';
    prevButton.className = 'prev-button';
    prevButton.onclick = () => {
        currentPage--;
        displaySuggestions(results, prefix);
    };

    if (startIndex + resultsPerPage < results.length) {
        resultsDiv.appendChild(nextButton);
    }

    if (currentPage > 0) {
        resultsDiv.insertBefore(prevButton, nextButton);
    }
}

// Event listener for input field changes
let timeoutId;
document.getElementById('prefixInput').addEventListener('input', () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
        const input = document.getElementById('prefixInput').value;
        const resultsDiv = document.getElementById('results');

        // Get the last sentence (after the last full stop)
        const sentences = input.split('.');
        const lastSentence = sentences.pop().trim();

        if (lastSentence === '') {
            resultsDiv.innerHTML = '<h4>Suggestions</h4>';
            return;
        }

        const results = trie.autocomplete(lastSentence);
        currentPage = 0;
        displaySuggestions(results, lastSentence);
    }, 1000); // Delay to prevent too many requests during typing
});
