/**
 * Trie Visualizer - Creates a visual representation of the trie structure
 */
class TrieVisualizer {
    /**
     * Constructor
     * @param {HTMLElement} container - DOM element to render visualization in
     * @param {Object} options - Visualization options
     */
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            nodeRadius: 20,
            levelHeight: 60,
            horizontalSpacing: 40,
            maxDepth: 8,
            maxWidth: 1000,
            colors: {
                node: '#ff6347',
                endNode: '#ff4500',
                text: '#ffffff',
                line: '#cccccc',
                highlight: '#ffcc00'
            },
            ...options
        };
        
        this.svgNS = "http://www.w3.org/2000/svg";
        this.initialize();
    }
    
    /**
     * Initialize the visualization container
     */
    initialize() {
        // Clear container
        this.container.innerHTML = '';
        
        // Create SVG element
        this.svg = document.createElementNS(this.svgNS, "svg");
        this.svg.setAttribute("width", "100%");
        this.svg.setAttribute("height", "100%");
        this.svg.style.minHeight = "400px";
        
        // Create groups for different elements
        this.linesGroup = document.createElementNS(this.svgNS, "g");
        this.nodesGroup = document.createElementNS(this.svgNS, "g");
        
        this.svg.appendChild(this.linesGroup);
        this.svg.appendChild(this.nodesGroup);
        
        this.container.appendChild(this.svg);
        
        // Create zoom controls
        this.addZoomControls();
        
        // Add legend
        this.addLegend();
    }
    
    /**
     * Add zoom controls to the visualization
     */
    addZoomControls() {
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'trie-viz-controls';
        controlsDiv.style.position = 'absolute';
        controlsDiv.style.top = '10px';
        controlsDiv.style.right = '10px';
        controlsDiv.style.background = 'rgba(255,255,255,0.8)';
        controlsDiv.style.padding = '5px';
        controlsDiv.style.borderRadius = '5px';
        
        const zoomInBtn = document.createElement('button');
        zoomInBtn.textContent = '+';
        zoomInBtn.style.margin = '2px';
        zoomInBtn.onclick = () => this.zoom(1.2);
        
        const zoomOutBtn = document.createElement('button');
        zoomOutBtn.textContent = '-';
        zoomOutBtn.style.margin = '2px';
        zoomOutBtn.onclick = () => this.zoom(0.8);
        
        const resetBtn = document.createElement('button');
        resetBtn.textContent = 'Reset';
        resetBtn.style.margin = '2px';
        resetBtn.onclick = () => this.resetZoom();
        
        controlsDiv.appendChild(zoomInBtn);
        controlsDiv.appendChild(zoomOutBtn);
        controlsDiv.appendChild(resetBtn);
        
        this.container.style.position = 'relative';
        this.container.appendChild(controlsDiv);
    }
    
    /**
     * Add a legend explaining node types
     */
    addLegend() {
        const legendDiv = document.createElement('div');
        legendDiv.className = 'trie-viz-legend';
        legendDiv.style.position = 'absolute';
        legendDiv.style.bottom = '10px';
        legendDiv.style.left = '10px';
        legendDiv.style.background = 'rgba(255,255,255,0.8)';
        legendDiv.style.padding = '10px';
        legendDiv.style.borderRadius = '5px';
        legendDiv.style.fontSize = '12px';
        
        const regularNode = document.createElement('div');
        regularNode.style.display = 'flex';
        regularNode.style.alignItems = 'center';
        regularNode.style.marginBottom = '5px';
        
        const regularCircle = document.createElement('div');
        regularCircle.style.width = '15px';
        regularCircle.style.height = '15px';
        regularCircle.style.borderRadius = '50%';
        regularCircle.style.backgroundColor = this.options.colors.node;
        regularCircle.style.marginRight = '5px';
        
        regularNode.appendChild(regularCircle);
        regularNode.appendChild(document.createTextNode('Internal Node'));
        
        const endNode = document.createElement('div');
        endNode.style.display = 'flex';
        endNode.style.alignItems = 'center';
        
        const endCircle = document.createElement('div');
        endCircle.style.width = '15px';
        endCircle.style.height = '15px';
        endCircle.style.borderRadius = '50%';
        endCircle.style.backgroundColor = this.options.colors.endNode;
        endCircle.style.marginRight = '5px';
        
        endNode.appendChild(endCircle);
        endNode.appendChild(document.createTextNode('Word/Sentence End'));
        
        legendDiv.appendChild(regularNode);
        legendDiv.appendChild(endNode);
        
        this.container.appendChild(legendDiv);
    }
    
    /**
     * Apply zoom to the visualization
     * @param {number} factor - Zoom factor
     */
    zoom(factor) {
        const currentTransform = this.svg.getAttribute('viewBox');
        if (!currentTransform) {
            const bbox = this.svg.getBBox();
            const viewBox = `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`;
            this.svg.setAttribute('viewBox', viewBox);
            this.originalViewBox = viewBox;
            return;
        }
        
        const [x, y, width, height] = currentTransform.split(' ').map(Number);
        const newWidth = width / factor;
        const newHeight = height / factor;
        const newX = x + (width - newWidth) / 2;
        const newY = y + (height - newHeight) / 2;
        
        this.svg.setAttribute('viewBox', `${newX} ${newY} ${newWidth} ${newHeight}`);
    }
    
    /**
     * Reset zoom to original state
     */
    resetZoom() {
        if (this.originalViewBox) {
            this.svg.setAttribute('viewBox', this.originalViewBox);
        } else {
            this.svg.removeAttribute('viewBox');
        }
    }
    
    /**
     * Render the trie structure
     * @param {Object} trie - The trie to visualize
     * @param {string} [highlight] - Optional prefix to highlight
     */
    render(trie, highlight = '') {
        if (!trie || !trie.root) {
            console.error('Invalid trie object');
            return;
        }
        
        this.linesGroup.innerHTML = '';
        this.nodesGroup.innerHTML = '';
        
        // Calculate layout
        const layout = this.calculateLayout(trie.root, highlight);
        
        // Set SVG viewBox based on layout
        const maxX = Math.max(...layout.map(node => node.x)) + this.options.nodeRadius;
        const maxY = Math.max(...layout.map(node => node.y)) + this.options.nodeRadius;
        
        this.svg.setAttribute('viewBox', `0 0 ${maxX + 20} ${maxY + 50}`);
        this.originalViewBox = `0 0 ${maxX + 20} ${maxY + 50}`;
        
        // Draw lines first (so they're behind nodes)
        for (const node of layout) {
            if (node.parent) {
                this.drawLine(node.parent, node, node.isHighlighted);
            }
        }
        
        // Then draw nodes
        for (const node of layout) {
            this.drawNode(node);
        }
    }
    
    /**
     * Calculate the layout of nodes for visualization
     * @param {Object} root - Root node of the trie
     * @param {string} highlight - Prefix to highlight
     * @returns {Array} - Layout information for each node
     */
    calculateLayout(root, highlight = '') {
        const layout = [];
        const highlightChars = highlight.toLowerCase().split('');
        
        // Process nodes level by level (breadth-first)
        const processLevel = (node, x, y, level, path = '', parentLayout = null, isHighlighted = false) => {
            if (level > this.options.maxDepth) return;
            
            // Create layout info for this node
            const nodeLayout = {
                x,
                y,
                char: path.slice(-1) || 'root',
                isEnd: node.isEndOfWord,
                parent: parentLayout,
                isHighlighted: isHighlighted && (level <= highlightChars.length) && 
                               (level === 0 || path[level-1] === highlightChars[level-1])
            };
            
            layout.push(nodeLayout);
            
            // Process children
            const children = Object.keys(node.children);
            if (children.length > 0) {
                const totalWidth = Math.min(
                    this.options.maxWidth,
                    children.length * this.options.horizontalSpacing * Math.pow(1.5, level)
                );
                
                const startX = Math.max(0, x - totalWidth / 2);
                const spacing = totalWidth / children.length;
                
                children.forEach((char, index) => {
                    const childX = startX + index * spacing + spacing / 2;
                    const childY = y + this.options.levelHeight;
                    const childPath = path + char;
                    
                    // Check if this path is part of the highlight
                    let childHighlighted = isHighlighted;
                    if (level < highlightChars.length && char === highlightChars[level]) {
                        childHighlighted = true;
                    }
                    
                    processLevel(
                        node.children[char], 
                        childX, 
                        childY, 
                        level + 1, 
                        childPath, 
                        nodeLayout,
                        childHighlighted
                    );
                });
            }
        };
        
        // Start processing from root
        const startX = this.options.maxWidth / 2;
        const startY = this.options.nodeRadius + 10;
        
        processLevel(root, startX, startY, 0, '', null, highlight.length > 0);
        
        return layout;
    }
    
    /**
     * Draw a node on the visualization
     * @param {Object} node - Layout info for the node
     */
    drawNode(node) {
        // Create circle for node
        const circle = document.createElementNS(this.svgNS, "circle");
        circle.setAttribute("cx", node.x);
        circle.setAttribute("cy", node.y);
        circle.setAttribute("r", this.options.nodeRadius);
        circle.setAttribute("fill", node.isEnd ? this.options.colors.endNode : this.options.colors.node);
        
        if (node.isHighlighted) {
            circle.setAttribute("stroke", this.options.colors.highlight);
            circle.setAttribute("stroke-width", "3");
        }
        
        this.nodesGroup.appendChild(circle);
        
        // Create text label
        const text = document.createElementNS(this.svgNS, "text");
        text.setAttribute("x", node.x);
        text.setAttribute("y", node.y + 5);
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("fill", this.options.colors.text);
        text.setAttribute("font-size", "12px");
        text.textContent = node.char;
        
        this.nodesGroup.appendChild(text);
        
        // Add frequency indicator if this is an end node
        if (node.isEnd && node.frequency) {
            const freq = document.createElementNS(this.svgNS, "text");
            freq.setAttribute("x", node.x);
            freq.setAttribute("y", node.y + this.options.nodeRadius + 15);
            freq.setAttribute("text-anchor", "middle");
            freq.setAttribute("fill", "#666");
            freq.setAttribute("font-size", "10px");
            freq.textContent = `(${node.frequency})`;
            
            this.nodesGroup.appendChild(freq);
        }
    }
    
    /**
     * Draw a line connecting two nodes
     * @param {Object} from - Source node
     * @param {Object} to - Target node
     * @param {boolean} highlight - Whether to highlight this connection
     */
    drawLine(from, to, highlight) {
        const line = document.createElementNS(this.svgNS, "line");
        line.setAttribute("x1", from.x);
        line.setAttribute("y1", from.y);
        line.setAttribute("x2", to.x);
        line.setAttribute("y2", to.y);
        line.setAttribute("stroke", highlight ? this.options.colors.highlight : this.options.colors.line);
        line.setAttribute("stroke-width", highlight ? "2" : "1");
        
        this.linesGroup.appendChild(line);
    }
    
    /**
     * Highlight a path in the visualization
     * @param {string} prefix - Prefix to highlight
     */
    highlight(prefix) {
        // Re-render with highlight
        this.render(this.currentTrie, prefix);
    }
    
    /**
     * Clear the visualization
     */
    clear() {
        this.linesGroup.innerHTML = '';
        this.nodesGroup.innerHTML = '';
    }
}