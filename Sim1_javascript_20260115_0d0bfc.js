// ===== GLOBAL STATE =====
let currentState = {
    placedComponents: [],
    formFactor: 'atx',
    socketType: 'lga1700',
    currentChallenge: 'beginner',
    gridSize: 24,
    draggingComponent: null,
    selectedComponent: null,
    compatibilityIssues: [],
    history: [],
    objectives: []
};

// ===== DOM ELEMENTS =====
const gridElement = document.getElementById('motherboardGrid');
const componentsListElement = document.getElementById('componentsList');
const compatibilityListElement = document.getElementById('compatibilityList');
const componentInfoElement = document.getElementById('componentInfo');
const componentCountElement = document.getElementById('componentCount');
const progressBarElement = document.querySelector('.progress-bar');
const progressTextElement = document.getElementById('progressText');
const challengeObjectivesElement = document.getElementById('challengeObjectives');
const historyLogElement = document.getElementById('historyLog');
const coordXElement = document.getElementById('coordX');
const coordYElement = document.getElementById('coordY');
const coordSquareElement = document.getElementById('coordSquare');
const footerMessageElement = document.getElementById('footerMessage');
const challengeSelectElement = document.getElementById('challengeSelect');
const formFactorSelectElement = document.getElementById('formFactorSelect');
const socketSelectElement = document.getElementById('socketSelect');

// ===== INITIALIZATION =====
function init() {
    generateGrid();
    populateComponents();
    loadChallenge('beginner');
    setupEventListeners();
    updateUI();
    addHistory('Simulator initialized. Ready to build!');
}

// ===== GRID GENERATION =====
function generateGrid() {
    gridElement.innerHTML = '';
    const formFactor = FORM_FACTORS[currentState.formFactor];
    
    // Update grid dimensions
    gridElement.style.gridTemplateColumns = `repeat(${formFactor.width}, 1fr)`;
    gridElement.style.gridTemplateRows = `repeat(${formFactor.height}, 1fr)`;
    gridElement.style.width = `${formFactor.width * 25}px`;
    gridElement.style.height = `${formFactor.height * 25}px`;
    
    // Create grid squares
    for (let y = 0; y < formFactor.height; y++) {
        for (let x = 0; x < formFactor.width; x++) {
            const square = document.createElement('div');
            square.className = 'grid-square';
            square.dataset.x = x;
            square.dataset.y = y;
            
            // Mark edges
            if (x === 0 || x === formFactor.width - 1 || 
                y === 0 || y === formFactor.height - 1) {
                square.classList.add('edge');
            }
            
            // Add event listeners
            square.addEventListener('mouseenter', () => {
                coordXElement.textContent = x;
                coordYElement.textContent = y;
                coordSquareElement.textContent = `${String.fromCharCode(65 + x)}${y + 1}`;
            });
            
            square.addEventListener('dragover', (e) => {
                e.preventDefault();
                if (currentState.draggingComponent) {
                    square.classList.add('hover');
                }
            });
            
            square.addEventListener('dragleave', () => {
                square.classList.remove('hover');
            });
            
            square.addEventListener('drop', (e) => {
                e.preventDefault();
                square.classList.remove('hover');
                
                if (currentState.draggingComponent) {
                    const component = COMPONENTS[currentState.draggingComponent];
                    placeComponent(component, x, y);
                }
            });
            
            gridElement.appendChild(square);
        }
    }
}

// ===== COMPONENT MANAGEMENT =====
function populateComponents() {
    componentsListElement.innerHTML = '';
    
    Object.values(COMPONENTS).forEach(component => {
        const div = document.createElement('div');
        div.className = 'component-item';
        div.draggable = true;
        div.dataset.componentId = component.id;
        
        div.innerHTML = `
            <i class="${component.icon}"></i>
            <div class="component-name">${component.name}</div>
            <div class="component-desc">${component.description}</div>
        `;
        
        div.addEventListener('dragstart', (e) => {
            currentState.draggingComponent = component.id;
            e.dataTransfer.setData('text/plain', component.id);
            updateFooterMessage(`Dragging: ${component.name}`);
        });
        
        div.addEventListener('click', () => {
            showComponentInfo(component);
        });
        
        componentsListElement.appendChild(div);
    });
}

function placeComponent(component, startX, startY) {
    // Check bounds
    const formFactor = FORM_FACTORS[currentState.formFactor];
    if (startX + component.width > formFactor.width || 
        startY + component.height > formFactor.height) {
        addHistory(`Cannot place ${component.name} - out of bounds`, 'error');
        return;
    }
    
    // Check for overlap
    for (let y = startY; y < startY + component.height; y++) {
        for (let x = startX; x < startX + component.width; x++) {
            if (isSquareOccupied(x, y)) {
                addHistory(`Cannot place ${component.name} - space occupied`, 'error');
                return;
            }
        }
    }
    
    // Add to placed components
    const placedComponent = {
        id: component.id,
        name: component.name,
        x: startX,
        y: startY,
        width: component.width,
        height: component.height,
        color: component.color
    };
    
    currentState.placedComponents.push(placedComponent);
    
    // Create visual element
    const element = document.createElement('div');
    element.className = `placed-component ${component.color}`;
    element.style.left = `${startX * 25}px`;
    element.style.top = `${startY * 25}px`;
    element.style.width = `${component.width * 25}px`;
    element.style.height = `${component.height * 25}px`;
    
    element.innerHTML = `
        <div style="font-size: ${Math.min(12, 100/component.name.length)}px">
            ${component.name}
        </div>
    `;
    
    element.draggable = true;
    element.dataset.componentIndex = currentState.placedComponents.length - 1;
    
    element.addEventListener('click', (e) => {
        e.stopPropagation();
        showComponentInfo(component);
        currentState.selectedComponent = placedComponent;
        highlightSelected(element);
    });
    
    element.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', 'move');
        element.style.opacity = '0.5';
    });
    
    element.addEventListener('dragend', () => {
        element.style.opacity = '1';
    });
    
    gridElement.appendChild(element);
    
    // Mark squares as occupied
    for (let y = startY; y < startY + component.height; y++) {
        for (let x = startX; x < startX + component.width; x++) {
            const square = getGridSquare(x, y);
            if (square) square.classList.add('occupied');
        }
    }
    
    addHistory(`Placed ${component.name} at (${startX}, ${startY})`);
    updateUI();
    checkCompatibility();
}

function isSquareOccupied(x, y) {
    return currentState.placedComponents.some(comp => {
        return x >= comp.x && x < comp.x + comp.width &&
               y >= comp.y && y < comp.y + comp.height;
    });
}

function getGridSquare(x, y) {
    return document.querySelector(`.grid-square[data-x="${x}"][data-y="${y}"]`);
}

// ===== CHALLENGE SYSTEM =====
function loadChallenge(challengeId) {
    currentState.currentChallenge = challengeId;
    currentState.placedComponents = [];
    currentState.objectives = [];
    
    const challenge = CHALLENGES[challengeId];
    
    // Update UI
    document.getElementById('challengeTitle').textContent = challenge.title;
    document.getElementById('challengeDescription').textContent = challenge.description;
    
    // Set form factor and socket
    formFactorSelectElement.value = challenge.formFactor;
    socketSelectElement.value = challenge.socketType;
    currentState.formFactor = challenge.formFactor;
    currentState.socketType = challenge.socketType;
    
    // Create objectives
    challenge.objectives.forEach(obj => {
        const component = COMPONENTS[obj.id];
        currentState.objectives.push({
            componentId: obj.id,
            requiredCount: obj.count,
            placedCount: 0,
            completed: false
        });
    });
    
    // If pre-placed errors exist, create them
    if (challenge.preplacedErrors) {
        createPreplacedErrors();
    }
    
    // Regenerate grid
    generateGrid();
    updateObjectivesDisplay();
    updateProgress();
    addHistory(`Loaded challenge: ${challenge.title}`);
}

function createPreplacedErrors() {
    // Place CPU too close to edge
    placeComponent(COMPONENTS.cpu, 1, 1);
    
    // Place RAM incorrectly (wrong arrangement)
    placeComponent({...COMPONENTS.ram, height: 5}, 6, 1);
    placeComponent({...COMPONENTS.ram, height: 5}, 7, 1);
    placeComponent({...COMPONENTS.ram, height: 5}, 8, 1);
    placeComponent({...COMPONENTS.ram, height: 5}, 9, 1);
    
    // Place PCIe slot that blocks SATA
    placeComponent(COMPONENTS.pcie16, 3, 8);
    
    // Place SATA ports that will be blocked
    placeComponent(COMPONENTS.sata, 20, 10);
    
    addHistory('Pre-placed components with intentional errors. Find and fix them!', 'warning');
}

function updateObjectivesDisplay() {
    challengeObjectivesElement.innerHTML = '';
    
    currentState.objectives.forEach((obj, index) => {
        const component = COMPONENTS[obj.componentId];
        const placedCount = currentState.placedComponents.filter(
            comp => comp.id === obj.componentId
        ).length;
        
        const div = document.createElement('div');
        div.className = `objective-item ${placedCount >= obj.requiredCount ? 'completed' : ''}`;
        
        div.innerHTML = `
            <i class="fas ${placedCount >= obj.requiredCount ? 'fa-check-circle completed' : 'fa-clock pending'}"></i>
            <span>${component.name}: ${placedCount}/${obj.requiredCount}</span>
        `;
        
        challengeObjectivesElement.appendChild(div);
        
        // Update objective state
        obj.placedCount = placedCount;
        obj.completed = placedCount >= obj.requiredCount;
    });
}

function updateProgress() {
    const totalObjectives = currentState.objectives.length;
    const completedObjectives = currentState.objectives.filter(obj => obj.completed).length;
    const progress = totalObjectives > 0 ? Math.round((completedObjectives / totalObjectives) * 100) : 0;
    
    progressBarElement.style.width = `${progress}%`;
    progressTextElement.textContent = `${progress}%`;
}

// ===== COMPATIBILITY CHECKING =====
function checkCompatibility() {
    currentState.compatibilityIssues = [];
    const formFactor = FORM_FACTORS[currentState.formFactor];
    
    // Check each placed component
    currentState.placedComponents.forEach(comp => {
        const component = COMPONENTS[comp.id];
        
        // Check clearance for CPU
        if (comp.id === 'cpu') {
            if (comp.x < 3 || comp.y < 3 || 
                comp.x + comp.width > formFactor.width - 3 ||
                comp.y + comp.height > formFactor.height - 3) {
                currentState.compatibilityIssues.push({
                    type: 'error',
                    message: `${component.name} too close to edge - needs cooler clearance`,
                    component: comp
                });
            }
        }
        
        // Check RAM arrangement
        if (comp.id === 'ram') {
            const allRAM = currentState.placedComponents.filter(c => c.id === 'ram');
            if (allRAM.length === 4) {
                // Check for proper spacing
                const sortedByX = allRAM.sort((a, b) => a.x - b.x);
                for (let i = 1; i < sortedByX.length; i++) {
                    if (sortedByX[i].x - (sortedByX[i-1].x + sortedByX[i-1].width) < 1) {
                        currentState.compatibilityIssues.push({
                            type: 'warning',
                            message: 'RAM slots too close together - may conflict with large coolers',
                            component: comp
                        });
                    }
                }
            }
        }
        
        // Check PCIe slot coverage
        if (comp.id === 'pcie16') {
            // Check if any M.2 slots would be covered
            currentState.placedComponents.forEach(otherComp => {
                if (otherComp.id === 'm2') {
                    if (otherComp.x >= comp.x && otherComp.x < comp.x + comp.width &&
                        otherComp.y >= comp.y && otherComp.y < comp.y + comp.height) {
                        currentState.compatibilityIssues.push({
                            type: 'error',
                            message: 'M.2 slot will be covered by GPU',
                            component: otherComp
                        });
                    }
                }
                
                // Check SATA port blockage
                if (otherComp.id === 'sata') {
                    if (otherComp.x >= comp.x - 1 && otherComp.x <= comp.x + comp.width &&
                        Math.abs(otherComp.y - comp.y) < 3) {
                        currentState.compatibilityIssues.push({
                            type: 'warning',
                            message: 'SATA ports may be difficult to access with GPU installed',
                            component: otherComp
                        });
                    }
                }
            });
        }
        
        // Check power connector placement
        if (comp.id === 'atx24') {
            if (comp.x < formFactor.width - 4) {
                currentState.compatibilityIssues.push({
                    type: 'warning',
                    message: '24-pin ATX connector not near edge - cable routing issues',
                    component: comp
                });
            }
        }
    });
    
    // Check form factor limits
    if (currentState.placedComponents.length > formFactor.maxComponents) {
        currentState.compatibilityIssues.push({
            type: 'error',
            message: `Too many components for ${formFactor.name} form factor`
        });
    }
    
    updateCompatibilityDisplay();
    updateObjectivesDisplay();
    updateProgress();
}

function updateCompatibilityDisplay() {
    compatibilityListElement.innerHTML = '';
    
    if (currentState.compatibilityIssues.length === 0) {
        const item = document.createElement('div');
        item.className = 'compatibility-item success';
        item.innerHTML = '<i class="fas fa-check-circle"></i> No compatibility issues detected';
        compatibilityListElement.appendChild(item);
        return;
    }
    
    currentState.compatibilityIssues.forEach(issue => {
        const item = document.createElement('div');
        item.className = `compatibility-item ${issue.type}`;
        
        const icon = issue.type === 'error' ? 'fa-exclamation-circle' : 
                    issue.type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle';
        
        item.innerHTML = `<i class="fas ${icon}"></i> ${issue.message}`;
        
        if (issue.component) {
            item.addEventListener('click', () => {
                highlightComponent(issue.component);
            });
            item.style.cursor = 'pointer';
        }
        
        compatibilityListElement.appendChild(item);
    });
}

// ===== UI UPDATES =====
function updateUI() {
    componentCountElement.textContent = currentState.placedComponents.length;
    updateFooterMessage(`${currentState.placedComponents.length} components placed`);
}

function showComponentInfo(component) {
    componentInfoElement.innerHTML = `
        <h3><i class="${component.icon}"></i> ${component.name}</h3>
        <p><strong>Description:</strong> ${component.description}</p>
        <p><strong>Dimensions:</strong> ${component.width * 0.5}" × ${component.height * 0.5}"</p>
        <p><strong>Category:</strong> ${component.category}</p>
        <p>${component.info}</p>
        ${component.requirements ? 
            `<p><strong>Requirements:</strong> ${JSON.stringify(component.requirements, null, 2).replace(/[{}"']/g, '')}</p>` : 
            ''}
    `;
}

function updateFooterMessage(message) {
    footerMessageElement.textContent = message;
}

function addHistory(message, type = 'info') {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const div = document.createElement('div');
    div.className = 'history-item';
    div.innerHTML = `<span style="color: #90e0ef">[${timeString}]</span> ${message}`;
    
    if (type === 'error') {
        div.style.color = '#ff6b6b';
    } else if (type === 'warning') {
        div.style.color = '#ffd166';
    }
    
    historyLogElement.prepend(div);
    
    // Keep only last 10 items
    const items = historyLogElement.querySelectorAll('.history-item');
    if (items.length > 10) {
        items[items.length - 1].remove();
    }
    
    currentState.history.push({ time: now, message, type });
}

function highlightComponent(component) {
    // Remove previous highlights
    document.querySelectorAll('.placed-component').forEach(el => {
        el.style.boxShadow = '';
    });
    
    // Find and highlight this component
    const index = currentState.placedComponents.indexOf(component);
    if (index !== -1) {
        const element = document.querySelector(`.placed-component[data-component-index="${index}"]`);
        if (element) {
            element.style.boxShadow = '0 0 0 3px #ffd700, 0 0 20px rgba(255, 215, 0, 0.5)';
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
}

function highlightSelected(element) {
    document.querySelectorAll('.placed-component').forEach(el => {
        el.style.boxShadow = '';
    });
    element.style.boxShadow = '0 0 0 3px #00b4d8, 0 0 20px rgba(0, 180, 216, 0.5)';
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    // Challenge selector
    challengeSelectElement.addEventListener('change', (e) => {
        loadChallenge(e.target.value);
    });
    
    // Form factor selector
    formFactorSelectElement.addEventListener('change', (e) => {
        currentState.formFactor = e.target.value;
        currentState.placedComponents = [];
        generateGrid();
        addHistory(`Changed form factor to ${FORM_FACTORS[e.target.value].name}`);
        checkCompatibility();
    });
    
    // Socket selector
    socketSelectElement.addEventListener('change', (e) => {
        currentState.socketType = e.target.value;
        addHistory(`Changed socket type to ${e.target.value.toUpperCase()}`);
    });
    
    // Compatibility check button
    document.getElementById('checkCompatibility').addEventListener('click', () => {
        checkCompatibility();
        addHistory('Ran compatibility check');
    });
    
    // Clear button
    document.getElementById('clearBtn').addEventListener('click', () => {
        if (confirm('Clear all components?')) {
            currentState.placedComponents = [];
            generateGrid();
            addHistory('Cleared all components');
            updateUI();
            checkCompatibility();
        }
    });
    
    // Hint button
    document.getElementById('hintBtn').addEventListener('click', () => {
        const challenge = CHALLENGES[currentState.currentChallenge];
        const hint = challenge.tips[Math.floor(Math.random() * challenge.tips.length)];
        addHistory(`Hint: ${hint}`, 'info');
        alert(`💡 Hint: ${hint}`);
    });
    
    // Submit button
    document.getElementById('submitBtn').addEventListener('click', () => {
        const issues = currentState.compatibilityIssues.filter(i => i.type === 'error');
        const completedObjectives = currentState.objectives.filter(obj => obj.completed).length;
        const totalObjectives = currentState.objectives.length;
        
        if (issues.length > 0) {
            alert(`❌ Design has ${issues.length} critical error(s). Fix them before submitting.`);
        } else if (completedObjectives < totalObjectives) {
            alert(`⚠️ ${totalObjectives - completedObjectives} objective(s) not completed. Keep working!`);
        } else {
            alert(`🎉 Excellent! Challenge completed successfully!\n\nAll ${totalObjectives} objectives met with no critical errors.`);
            addHistory('Challenge completed successfully!', 'success');
        }
    });
    
    // Footer buttons
    document.getElementById('saveBtn').addEventListener('click', () => {
        const design = {
            placedComponents: currentState.placedComponents,
            formFactor: currentState.formFactor,
            socketType: currentState.socketType,
            challenge: currentState.currentChallenge,
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('mbDesign', JSON.stringify(design));
        addHistory('Design saved to browser storage');
        alert('Design saved locally!');
    });
    
    document.getElementById('loadBtn').addEventListener('click', () => {
        const saved = localStorage.getItem('mbDesign');
        if (saved) {
            if (confirm('Load saved design? Current work will be lost.')) {
                const design = JSON.parse(saved);
                // Implementation for loading design
                addHistory('Loaded saved design');
            }
        } else {
            alert('No saved design found.');
        }
    });
    
    document.getElementById('printBtn').addEventListener('click', () => {
        window.print();
        addHistory('Printed design layout');
    });
    
    // Grid click to clear selection
    gridElement.addEventListener('click', (e) => {
        if (e.target.classList.contains('grid-square')) {
            document.querySelectorAll('.placed-component').forEach(el => {
                el.style.boxShadow = '';
            });
            currentState.selectedComponent = null;
            componentInfoElement.innerHTML = `
                <h3><i class="fas fa-info-circle"></i> Component Information</h3>
                <p>Click on a component or drag one from the left panel.</p>
            `;
        }
    });
}

// ===== START THE APPLICATION =====
document.addEventListener('DOMContentLoaded', init);