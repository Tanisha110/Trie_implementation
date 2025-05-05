import { useState, useEffect, useRef } from 'react';

// Assume these are your existing JS modules
// Update the import paths according to your project structure
import FuzzyMatcher from './FuzzyMatcher';
import DataManager from './DataManager';
import EnhancedTrie from './EnhancedTrie';


export default function TrieManagerApp() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [dataItems, setDataItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const visualizerRef = useRef(null);
  
  // Initialize our modules
  useEffect(() => {
    const dataManager = new DataManager();
    const trie = new EnhancedTrie();
    const fuzzyMatcher = new FuzzyMatcher(trie);
    const appManager = new AppManager(dataManager, fuzzyMatcher);
    
    // Load initial data (example)
    const initialData = ['apple', 'banana', 'orange', 'pineapple', 'grape'];
    initialData.forEach(item => {
      dataManager.addItem(item);
      trie.insert(item);
    });
    
    setDataItems(initialData);
    
    // Initialize visualizer if needed
    if (visualizerRef.current) {
      const visualizer = new TrieVisualizer(trie);
      visualizer.attachTo(visualizerRef.current);
      visualizer.render();
    }
    
    // Cleanup function
    return () => {
      // Any cleanup needed for your JS modules
    };
  }, []);
  
  // Handle search
  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    if (term.trim() === '') {
      setSearchResults([]);
      return;
    }
    
    // Use your fuzzy matcher to find results
    // This is a placeholder - adjust according to your actual API
    const fuzzyMatcher = new FuzzyMatcher(new EnhancedTrie());
    dataItems.forEach(item => fuzzyMatcher.addToTrie(item));
    const results = fuzzyMatcher.search(term);
    setSearchResults(results);
  };
  
  // Add new item
  const handleAddItem = () => {
    if (searchTerm.trim() === '') return;
    
    if (!dataItems.includes(searchTerm)) {
      const newItems = [...dataItems, searchTerm];
      setDataItems(newItems);
      
      // Update your trie and data manager
      // This is a placeholder - adjust according to your actual API
      const dataManager = new DataManager();
      const trie = new EnhancedTrie();
      dataManager.addItem(searchTerm);
      trie.insert(searchTerm);
      
      // Update visualization
      if (visualizerRef.current) {
        const visualizer = new TrieVisualizer(trie);
        visualizer.render();
      }
      
      setSearchTerm('');
      setSearchResults([]);
    }
  };
  
  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Trie Manager Application</h1>
      
      <div className="mb-6">
        <div className="flex space-x-2">
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearch}
            placeholder="Search or add new item..."
            className="flex-1 p-2 border border-gray-300 rounded"
          />
          <button
            onClick={handleAddItem}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Add Item
          </button>
        </div>
        
        {searchResults.length > 0 && (
          <div className="mt-2 border border-gray-200 rounded bg-gray-50">
            <ul className="divide-y divide-gray-200">
              {searchResults.map((result, index) => (
                <li
                  key={index}
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => setSelectedItem(result)}
                >
                  {result}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded p-4">
          <h2 className="text-lg font-semibold mb-3">Data Items</h2>
          <ul className="divide-y divide-gray-200">
            {dataItems.map((item, index) => (
              <li
                key={index}
                className={`p-2 cursor-pointer ${
                  selectedItem === item ? 'bg-blue-100' : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedItem(item)}
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
        
        <div className="border rounded p-4">
          <h2 className="text-lg font-semibold mb-3">Trie Visualization</h2>
          <div 
            ref={visualizerRef}
            className="w-full h-64 bg-gray-50 border border-gray-200 rounded"
          >
            {/* The TrieVisualizer will render here */}
          </div>
        </div>
      </div>
      
      {selectedItem && (
        <div className="mt-6 p-4 border rounded bg-gray-50">
          <h2 className="text-lg font-semibold mb-2">Selected Item: {selectedItem}</h2>
          <div className="flex space-x-2">
            <button 
              className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
              onClick={() => {
                setDataItems(dataItems.filter(item => item !== selectedItem));
                setSelectedItem(null);
                // Also update your data structures here
              }}
            >
              Delete
            </button>
            <button 
              className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
              onClick={() => setSelectedItem(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}