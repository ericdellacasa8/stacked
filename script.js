// Color palette for randomized layers
const COLOR_GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
  'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
  'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  'linear-gradient(135deg, #ff6e7f 0%, #bfe9ff 100%)',
  'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
  'linear-gradient(135deg, #f77062 0%, #fe5196 100%)',
  'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)',
  'linear-gradient(135deg, #fddb92 0%, #d1fdff 100%)',
  'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
  'linear-gradient(135deg, #f5576c 0%, #4ec5f1 100%)',
  'linear-gradient(135deg, #96fbc4 0%, #f9f586 100%)',
  'linear-gradient(135deg, #c471f5 0%, #fa71cd 100%)',
  'linear-gradient(135deg, #48c6ef 0%, #6f86d6 100%)',
  'linear-gradient(135deg, #feac5e 0%, #c779d0 100%)'
];

// Shuffle function to randomize color order
function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// Generate randomized color palette for a stack
function generateColorPalette() {
  return shuffleArray(COLOR_GRADIENTS);
}

// Storage Manager
const StorageManager = {
  STORAGE_KEY: 'stacked_apps',
  
  getStacks() {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },
  
  saveStacks(stacks) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(stacks));
  },
  
  addStack(stack) {
    const stacks = this.getStacks();
    stack.id = Date.now().toString();
    stack.createdAt = new Date().toISOString();
    stack.colorPalette = generateColorPalette();
    stacks.push(stack);
    this.saveStacks(stacks);
    return stack;
  },

  updateStack(stackId, updatedData) {
    const stacks = this.getStacks();
    const index = stacks.findIndex(s => s.id === stackId);
    if (index !== -1) {
      stacks[index] = { ...stacks[index], ...updatedData, updatedAt: new Date().toISOString() };
      this.saveStacks(stacks);
      return stacks[index];
    }
    return null;
  },

  deleteStack(stackId) {
    const stacks = this.getStacks();
    const filtered = stacks.filter(s => s.id !== stackId);
    this.saveStacks(filtered);
  }
};

// Dark Mode Manager
const DarkModeManager = {
  STORAGE_KEY: 'stacked_dark_mode',

  init() {
    const savedMode = localStorage.getItem(this.STORAGE_KEY);
    if (savedMode === 'dark') {
      this.enable();
    }
  },

  toggle() {
    if (document.documentElement.classList.contains('dark')) {
      this.disable();
    } else {
      this.enable();
    }
  },

  enable() {
    document.documentElement.classList.add('dark');
    localStorage.setItem(this.STORAGE_KEY, 'dark');
    document.getElementById('sunIcon').classList.remove('hidden');
    document.getElementById('moonIcon').classList.add('hidden');
  },

  disable() {
    document.documentElement.classList.remove('dark');
    localStorage.setItem(this.STORAGE_KEY, 'light');
    document.getElementById('sunIcon').classList.add('hidden');
    document.getElementById('moonIcon').classList.remove('hidden');
  }
};

// UI State
let layers = [];
let currentFilter = {
  search: '',
  sort: 'newest'
};
let editingStackId = null;
let currentDetailStack = null;

// DOM Elements
const addStackBtn = document.getElementById('addStackBtn');
const heroAddStackBtn = document.getElementById('heroAddStackBtn');
const emptyAddStackBtn = document.getElementById('emptyAddStackBtn');
const addStackModal = document.getElementById('addStackModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelBtn = document.getElementById('cancelBtn');
const addStackForm = document.getElementById('addStackForm');
const addLayerBtn = document.getElementById('addLayerBtn');
const layersContainer = document.getElementById('layersContainer');
const gallery = document.getElementById('gallery');
const emptyState = document.getElementById('emptyState');
const detailModal = document.getElementById('detailModal');
const closeDetailBtn = document.getElementById('closeDetailBtn');
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');
const darkModeToggle = document.getElementById('darkModeToggle');
const modalTitle = document.getElementById('modalTitle');
const submitBtn = document.getElementById('submitBtn');
const editStackBtn = document.getElementById('editStackBtn');
const deleteStackBtn = document.getElementById('deleteStackBtn');

// Modal Controls
function openAddStackModal(stack = null) {
  addStackModal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  layers = [];
  editingStackId = null;

  if (stack) {
    // Edit mode
    editingStackId = stack.id;
    modalTitle.textContent = 'Edit Stack';
    submitBtn.textContent = 'Update Stack';
    document.getElementById('projectName').value = stack.projectName;
    document.getElementById('projectDescription').value = stack.description || '';
    
    // Load existing layers
    stack.layers.forEach((layer, index) => {
      const layerId = Date.now() + Math.random() + index;
      layers.push({
        id: layerId,
        provider: layer.provider,
        use: layer.use
      });
    });
    
    // Small delay to ensure DOM is ready
    setTimeout(() => {
      renderLayers();
    }, 10);
  } else {
    // Add mode
    modalTitle.textContent = 'Add Stack';
    submitBtn.textContent = 'Publish Stack';
    addLayerBtn.click(); // Add first layer automatically
  }
}

function closeAddStackModal() {
  addStackModal.classList.add('hidden');
  document.body.style.overflow = 'auto';
  addStackForm.reset();
  layers = [];
  layersContainer.innerHTML = '';
  editingStackId = null;
}

function openDetailModal(stack) {
  currentDetailStack = stack;
  document.getElementById('detailProjectName').textContent = stack.projectName;
  document.getElementById('detailDescription').textContent = stack.description || 'No description provided.';
  
  const detailStack = document.getElementById('detailStack');
  detailStack.innerHTML = '';
  
  // Use the stack's saved color palette
  const colorPalette = stack.colorPalette || generateColorPalette();
  
  // Render layers in reverse order (top to bottom)
  stack.layers.slice().reverse().forEach((layer, index) => {
    const layerDiv = document.createElement('div');
    layerDiv.style.background = colorPalette[index % colorPalette.length];
    layerDiv.className = 'p-6 text-white';
    layerDiv.innerHTML = `
      <div class="font-bold text-xl">${escapeHtml(layer.provider)}</div>
      <div class="text-sm opacity-90 mt-2">${escapeHtml(layer.use)}</div>
    `;
    detailStack.appendChild(layerDiv);
  });
  
  detailModal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeDetailModal() {
  detailModal.classList.add('hidden');
  document.body.style.overflow = 'auto';
  currentDetailStack = null;
}

// Layer Management
function addLayer() {
  const layerId = Date.now() + Math.random();
  const layer = {
    id: layerId,
    provider: '',
    use: ''
  };
  layers.push(layer);
  renderLayers();
}

function removeLayer(layerId) {
  layers = layers.filter(l => l.id !== layerId);
  renderLayers();
}

function moveLayerUp(layerId) {
  const index = layers.findIndex(l => l.id === layerId);
  if (index > 0) {
    [layers[index], layers[index - 1]] = [layers[index - 1], layers[index]];
    renderLayers();
  }
}

function moveLayerDown(layerId) {
  const index = layers.findIndex(l => l.id === layerId);
  if (index < layers.length - 1) {
    [layers[index], layers[index + 1]] = [layers[index + 1], layers[index]];
    renderLayers();
  }
}

function renderLayers() {
  layersContainer.innerHTML = '';
  
  layers.forEach((layer, index) => {
    const layerDiv = document.createElement('div');
    layerDiv.className = 'border-2 border-gray-200 rounded-xl p-5 bg-white';
    
    layerDiv.innerHTML = `
      <div class="flex justify-between items-start mb-4">
        <span class="text-sm font-bold text-gray-700">Layer ${index + 1}</span>
        <div class="flex gap-2">
          <button 
            type="button"
            class="move-up-btn text-gray-400 hover:text-gray-600 transition-colors ${index === 0 ? 'opacity-30 cursor-not-allowed' : ''}"
            data-id="${layer.id}"
            ${index === 0 ? 'disabled' : ''}
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path>
            </svg>
          </button>
          <button 
            type="button"
            class="move-down-btn text-gray-400 hover:text-gray-600 transition-colors ${index === layers.length - 1 ? 'opacity-30 cursor-not-allowed' : ''}"
            data-id="${layer.id}"
            ${index === layers.length - 1 ? 'disabled' : ''}
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>
          <button 
            type="button"
            class="remove-layer-btn text-red-400 hover:text-red-600 transition-colors"
            data-id="${layer.id}"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </div>
      
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            Provider Name <span class="text-red-500">*</span>
          </label>
          <input 
            type="text" 
            class="provider-input w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent text-base"
            data-id="${layer.id}"
            value="${escapeHtml(layer.provider)}"
            placeholder="e.g., Vercel, Supabase, OpenAI"
            required
          />
        </div>
        
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            Use <span class="text-red-500">*</span>
          </label>
          <input 
            type="text" 
            class="use-input w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent text-base"
            data-id="${layer.id}"
            value="${escapeHtml(layer.use)}"
            placeholder="e.g., Frontend, Database, Auth, AI"
            required
          />
        </div>
      </div>
    `;
    
    layersContainer.appendChild(layerDiv);
  });
  
  // Attach event listeners
  document.querySelectorAll('.remove-layer-btn').forEach(btn => {
    btn.addEventListener('click', () => removeLayer(parseFloat(btn.dataset.id)));
  });
  
  document.querySelectorAll('.move-up-btn').forEach(btn => {
    btn.addEventListener('click', () => moveLayerUp(parseFloat(btn.dataset.id)));
  });
  
  document.querySelectorAll('.move-down-btn').forEach(btn => {
    btn.addEventListener('click', () => moveLayerDown(parseFloat(btn.dataset.id)));
  });
  
  document.querySelectorAll('.provider-input').forEach(input => {
    input.addEventListener('input', (e) => {
      const layer = layers.find(l => l.id === parseFloat(e.target.dataset.id));
      if (layer) layer.provider = e.target.value;
    });
  });
  
  document.querySelectorAll('.use-input').forEach(input => {
    input.addEventListener('input', (e) => {
      const layer = layers.find(l => l.id === parseFloat(e.target.dataset.id));
      if (layer) layer.use = e.target.value;
    });
  });
}

// Form Submission
function handleFormSubmit(e) {
  e.preventDefault();
  
  const projectName = document.getElementById('projectName').value.trim();
  const description = document.getElementById('projectDescription').value.trim();
  
  if (!projectName) {
    alert('Project name is required');
    return;
  }
  
  if (layers.length === 0) {
    alert('Please add at least one layer');
    return;
  }
  
  // Validate all layers have required fields
  for (const layer of layers) {
    if (!layer.provider.trim() || !layer.use.trim()) {
      alert('All layers must have both provider name and use filled in');
      return;
    }
  }
  
  const stackData = {
    projectName,
    description,
    layers: layers.map(l => ({
      provider: l.provider.trim(),
      use: l.use.trim()
    }))
  };

  if (editingStackId) {
    // Update existing stack
    StorageManager.updateStack(editingStackId, stackData);
  } else {
    // Add new stack
    StorageManager.addStack(stackData);
  }
  
  closeAddStackModal();
  renderGallery();
}

// Delete Stack
function handleDeleteStack() {
  if (!currentDetailStack) return;
  
  if (confirm(`Are you sure you want to delete "${currentDetailStack.projectName}"?`)) {
    StorageManager.deleteStack(currentDetailStack.id);
    closeDetailModal();
    renderGallery();
  }
}

// Edit Stack
function handleEditStack() {
  if (!currentDetailStack) return;
  closeDetailModal();
  openAddStackModal(currentDetailStack);
}

// Calculate card height based on number of layers
function getCardHeight(layerCount) {
  // Base height for card footer (name + layer count)
  const footerHeight = 80;
  
  // Calculate layer section height
  // For 1-5 layers: show all, 50px per layer
  // For 6+ layers: show 5 layers + "more" indicator
  const maxVisibleLayers = Math.min(layerCount, 5);
  const layerHeight = maxVisibleLayers * 50;
  const moreIndicatorHeight = layerCount > 5 ? 28 : 0;
  
  return layerHeight + moreIndicatorHeight + footerHeight;
}

// Gallery Rendering
function renderGallery() {
  let stacks = StorageManager.getStacks();
  
  // Apply search filter
  if (currentFilter.search) {
    const searchLower = currentFilter.search.toLowerCase();
    stacks = stacks.filter(stack => 
      stack.layers.some(layer => 
        layer.provider.toLowerCase().includes(searchLower)
      ) || stack.projectName.toLowerCase().includes(searchLower)
    );
  }
  
  // Apply sorting
  switch (currentFilter.sort) {
    case 'oldest':
      stacks.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      break;
    case 'layers-desc':
      stacks.sort((a, b) => b.layers.length - a.layers.length);
      break;
    case 'layers-asc':
      stacks.sort((a, b) => a.layers.length - b.layers.length);
      break;
    case 'newest':
    default:
      stacks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
  
  if (stacks.length === 0) {
    gallery.classList.add('hidden');
    emptyState.classList.remove('hidden');
    return;
  }
  
  gallery.classList.remove('hidden');
  emptyState.classList.add('hidden');
  gallery.innerHTML = '';
  
  stacks.forEach(stack => {
    const card = document.createElement('div');
    const cardHeight = getCardHeight(stack.layers.length);
    card.className = 'bg-white rounded-2xl overflow-hidden border border-gray-200 card-hover cursor-pointer shadow-md';
    card.style.height = `${cardHeight}px`;
    card.addEventListener('click', () => openDetailModal(stack));
    
    // Use the stack's saved color palette
    const colorPalette = stack.colorPalette || generateColorPalette();
    
    // Create mini stack visualization (max 5 layers shown)
    const displayLayers = stack.layers.slice().reverse().slice(0, 5);
    const stackHTML = displayLayers.map((layer, index) => {
      return `
        <div class="flex items-center px-4 text-white" style="background: ${colorPalette[index % colorPalette.length]}; height: 50px;">
          <div class="flex-1 min-w-0">
            <div class="font-semibold text-sm truncate">${escapeHtml(layer.provider)}</div>
            <div class="text-xs opacity-90 truncate">${escapeHtml(layer.use)}</div>
          </div>
        </div>
      `;
    }).join('');
    
    const moreLayersText = stack.layers.length > 5 
      ? `<div class="text-center text-xs text-gray-500 bg-gray-50" style="height: 28px; line-height: 28px;">+ ${stack.layers.length - 5} more layers</div>` 
      : '';
    
    card.innerHTML = `
      <div class="border-b border-gray-200">
        ${stackHTML}
        ${moreLayersText}
      </div>
      <div class="p-4">
        <h3 class="font-bold text-gray-900 text-lg truncate">${escapeHtml(stack.projectName)}</h3>
        <p class="text-sm text-gray-500 mt-1 font-medium">${stack.layers.length} layer${stack.layers.length !== 1 ? 's' : ''}</p>
      </div>
    `;
    
    gallery.appendChild(card);
  });
}

// Utility function to escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Event Listeners
addStackBtn.addEventListener('click', () => openAddStackModal());
heroAddStackBtn.addEventListener('click', () => openAddStackModal());
emptyAddStackBtn.addEventListener('click', () => openAddStackModal());
closeModalBtn.addEventListener('click', closeAddStackModal);
cancelBtn.addEventListener('click', closeAddStackModal);
closeDetailBtn.addEventListener('click', closeDetailModal);
addLayerBtn.addEventListener('click', addLayer);
addStackForm.addEventListener('submit', handleFormSubmit);
darkModeToggle.addEventListener('click', () => DarkModeManager.toggle());
editStackBtn.addEventListener('click', handleEditStack);
deleteStackBtn.addEventListener('click', handleDeleteStack);

// Search and filter
searchInput.addEventListener('input', (e) => {
  currentFilter.search = e.target.value.trim();
  renderGallery();
});

sortSelect.addEventListener('change', (e) => {
  currentFilter.sort = e.target.value;
  renderGallery();
});

// Close modals on background click
addStackModal.addEventListener('click', (e) => {
  if (e.target === addStackModal) {
    closeAddStackModal();
  }
});

detailModal.addEventListener('click', (e) => {
  if (e.target === detailModal) {
    closeDetailModal();
  }
});

// Initialize
DarkModeManager.init();
renderGallery();