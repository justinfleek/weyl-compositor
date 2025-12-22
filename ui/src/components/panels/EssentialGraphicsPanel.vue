<template>
  <div class="essential-graphics-panel">
    <!-- Panel Header with Tabs -->
    <div class="panel-header">
      <div class="tabs">
        <button
          class="tab"
          :class="{ active: activeTab === 'browse' }"
          @click="activeTab = 'browse'"
        >
          Browse
        </button>
        <button
          class="tab"
          :class="{ active: activeTab === 'edit' }"
          @click="activeTab = 'edit'"
        >
          Edit
        </button>
      </div>
    </div>

    <!-- Browse Tab -->
    <div v-if="activeTab === 'browse'" class="tab-content browse-tab">
      <div class="search-bar">
        <input
          type="text"
          v-model="searchQuery"
          placeholder="Search templates..."
          class="search-input"
        />
      </div>

      <div class="templates-grid">
        <div
          v-for="template in filteredTemplates"
          :key="template.id"
          class="template-card"
          @click="selectTemplate(template)"
        >
          <div class="template-poster">
            <img v-if="template.posterImage" :src="template.posterImage" alt="" />
            <div v-else class="poster-placeholder">No Preview</div>
          </div>
          <div class="template-info">
            <span class="template-name">{{ template.name }}</span>
            <span class="template-author">{{ template.author || 'Unknown' }}</span>
          </div>
        </div>

        <div v-if="filteredTemplates.length === 0" class="no-templates">
          <p>No templates installed</p>
          <button class="btn-primary" @click="importTemplate">Import Template</button>
        </div>
      </div>
    </div>

    <!-- Edit Tab -->
    <div v-if="activeTab === 'edit'" class="tab-content edit-tab">
      <!-- Master Composition Selection -->
      <div v-if="!hasTemplate" class="no-master">
        <p class="message">Select a master composition to begin</p>
        <select v-model="selectedMasterCompId" class="comp-select">
          <option value="">-- Select Composition --</option>
          <option
            v-for="comp in compositions"
            :key="comp.id"
            :value="comp.id"
          >
            {{ comp.name }}
          </option>
        </select>
        <button
          class="btn-primary"
          :disabled="!selectedMasterCompId"
          @click="setMasterComposition"
        >
          Set Master Composition
        </button>
      </div>

      <!-- Template Editor -->
      <div v-else class="template-editor">
        <!-- Template Name -->
        <div class="template-name-section">
          <input
            type="text"
            v-model="templateName"
            placeholder="Template Name"
            class="template-name-input"
            @blur="updateTemplateName"
          />
          <button class="btn-icon" @click="clearMasterComposition" title="Clear Master">
            <span class="icon">×</span>
          </button>
        </div>

        <!-- Add Controls -->
        <div class="add-controls">
          <div class="add-dropdown">
            <button class="btn-secondary dropdown-trigger" @click="toggleAddMenu">
              + Add
            </button>
            <div v-if="showAddMenu" class="dropdown-menu">
              <button @click="addGroup">New Group</button>
              <button @click="addComment">New Comment</button>
              <div class="dropdown-divider"></div>
              <div class="dropdown-label">Add Property from Layer:</div>
              <div
                v-for="layer in activeCompLayers"
                :key="layer.id"
                class="layer-item"
              >
                <button
                  class="layer-button"
                  @click="showLayerProperties(layer)"
                >
                  {{ layer.name }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Properties List -->
        <div class="properties-list" @dragover.prevent @drop="handleDrop">
          <!-- Ungrouped Properties -->
          <div
            v-for="item in organizedProperties.ungrouped"
            :key="item.id"
            class="property-item"
            :class="{ selected: selectedPropertyId === item.id }"
            draggable="true"
            @dragstart="handleDragStart($event, item)"
            @click="selectProperty(item)"
          >
            <template v-if="isExposedProperty(item)">
              <ExposedPropertyControl
                :property="item"
                :layer="getLayerById(item.sourceLayerId)"
                @update="handlePropertyUpdate"
                @remove="removeProperty(item.id)"
              />
            </template>
            <template v-else>
              <CommentControl
                :comment="item"
                @update="handleCommentUpdate"
                @remove="removeComment(item.id)"
              />
            </template>
          </div>

          <!-- Groups -->
          <div
            v-for="{ group, items } in organizedProperties.groups"
            :key="group.id"
            class="property-group"
            :class="{ collapsed: !group.expanded }"
          >
            <div
              class="group-header"
              @click="toggleGroup(group.id)"
              draggable="true"
              @dragstart="handleGroupDragStart($event, group)"
            >
              <span class="expand-icon">{{ group.expanded ? '▼' : '▶' }}</span>
              <input
                type="text"
                v-model="group.name"
                class="group-name-input"
                @click.stop
                @blur="updateGroupName(group)"
              />
              <button
                class="btn-icon-small"
                @click.stop="removeGroup(group.id)"
                title="Remove Group"
              >
                ×
              </button>
            </div>
            <div v-if="group.expanded" class="group-content">
              <div
                v-for="item in items"
                :key="item.id"
                class="property-item"
                :class="{ selected: selectedPropertyId === item.id }"
                draggable="true"
                @dragstart="handleDragStart($event, item)"
                @click="selectProperty(item)"
              >
                <template v-if="isExposedProperty(item)">
                  <ExposedPropertyControl
                    :property="item"
                    :layer="getLayerById(item.sourceLayerId)"
                    @update="handlePropertyUpdate"
                    @remove="removeProperty(item.id)"
                  />
                </template>
                <template v-else>
                  <CommentControl
                    :comment="item"
                    @update="handleCommentUpdate"
                    @remove="removeComment(item.id)"
                  />
                </template>
              </div>
            </div>
          </div>
        </div>

        <!-- Layer Properties Picker Modal -->
        <div v-if="showPropertyPicker" class="property-picker-modal" @click.self="closePropertyPicker">
          <div class="picker-content">
            <div class="picker-header">
              <h3>Add Property from "{{ selectedLayerForPicker?.name }}"</h3>
              <button class="btn-icon" @click="closePropertyPicker">×</button>
            </div>
            <div class="picker-list">
              <div
                v-for="prop in exposableProperties"
                :key="prop.path"
                class="picker-item"
                @click="addPropertyFromPicker(prop)"
              >
                <span class="prop-name">{{ prop.name }}</span>
                <span class="prop-type">{{ prop.type }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Export Button -->
        <div class="export-section">
          <button class="btn-primary btn-export" @click="exportMOGRT">
            Export Motion Graphics Template
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useCompositorStore } from '@/stores/compositorStore';
import type {
  TemplateConfig,
  ExposedProperty,
  PropertyGroup,
  TemplateComment,
  InstalledTemplate
} from '@/types/essentialGraphics';
import {
  initializeTemplate,
  clearTemplate,
  addExposedProperty,
  removeExposedProperty,
  addPropertyGroup,
  removePropertyGroup,
  addComment,
  removeComment as removeCommentFn,
  updateComment as updateCommentFn,
  getExposableProperties,
  getOrganizedProperties,
  isExposedProperty as checkIsExposedProperty,
  exportMOGRT as exportMOGRTFn,
  validateTemplate
} from '@/services/essentialGraphics';
import type { Layer, Composition } from '@/types/project';
import ExposedPropertyControl from './ExposedPropertyControl.vue';
import CommentControl from './CommentControl.vue';

// Store
const store = useCompositorStore();

// State
const activeTab = ref<'browse' | 'edit'>('edit');
const searchQuery = ref('');
const selectedMasterCompId = ref('');
const showAddMenu = ref(false);
const selectedPropertyId = ref<string | null>(null);
const showPropertyPicker = ref(false);
const selectedLayerForPicker = ref<Layer | null>(null);
const installedTemplates = ref<InstalledTemplate[]>([]);

// Computed
const compositions = computed(() => Object.values(store.project.compositions));

const activeComposition = computed(() => store.activeComposition);

const activeCompLayers = computed(() => activeComposition.value?.layers || []);

const hasTemplate = computed(() => {
  return activeComposition.value?.templateConfig !== undefined;
});

const templateConfig = computed(() => {
  return activeComposition.value?.templateConfig;
});

const templateName = computed({
  get: () => templateConfig.value?.name || '',
  set: (value: string) => {
    if (templateConfig.value) {
      templateConfig.value.name = value;
    }
  }
});

const organizedProperties = computed(() => {
  if (!templateConfig.value) {
    return { ungrouped: [], groups: [] };
  }
  return getOrganizedProperties(templateConfig.value);
});

const exposableProperties = computed(() => {
  if (!selectedLayerForPicker.value) return [];
  return getExposableProperties(selectedLayerForPicker.value);
});

const filteredTemplates = computed(() => {
  if (!searchQuery.value) return installedTemplates.value;
  const query = searchQuery.value.toLowerCase();
  return installedTemplates.value.filter(t =>
    t.name.toLowerCase().includes(query) ||
    t.author?.toLowerCase().includes(query) ||
    t.tags?.some(tag => tag.toLowerCase().includes(query))
  );
});

// Methods
function setMasterComposition() {
  if (!selectedMasterCompId.value) return;

  const comp = store.project.compositions[selectedMasterCompId.value];
  if (!comp) return;

  comp.templateConfig = initializeTemplate(comp);
  store.pushHistory();
}

function clearMasterComposition() {
  if (!activeComposition.value) return;

  clearTemplate(activeComposition.value);
  store.pushHistory();
}

function updateTemplateName() {
  if (templateConfig.value) {
    templateConfig.value.modified = new Date().toISOString();
    store.pushHistory();
  }
}

function toggleAddMenu() {
  showAddMenu.value = !showAddMenu.value;
}

function addGroup() {
  if (!templateConfig.value) return;
  addPropertyGroup(templateConfig.value, 'New Group');
  showAddMenu.value = false;
  store.pushHistory();
}

function addCommentItem() {
  if (!templateConfig.value) return;
  addComment(templateConfig.value, 'Enter instructions here...');
  showAddMenu.value = false;
  store.pushHistory();
}

function showLayerProperties(layer: Layer) {
  selectedLayerForPicker.value = layer;
  showPropertyPicker.value = true;
  showAddMenu.value = false;
}

function closePropertyPicker() {
  showPropertyPicker.value = false;
  selectedLayerForPicker.value = null;
}

function addPropertyFromPicker(prop: { path: string; name: string; type: any }) {
  if (!templateConfig.value || !selectedLayerForPicker.value) return;

  addExposedProperty(
    templateConfig.value,
    selectedLayerForPicker.value.id,
    prop.path,
    prop.name,
    prop.type
  );

  closePropertyPicker();
  store.pushHistory();
}

function selectProperty(item: ExposedProperty | TemplateComment) {
  selectedPropertyId.value = item.id;
}

function removeProperty(propertyId: string) {
  if (!templateConfig.value) return;
  removeExposedProperty(templateConfig.value, propertyId);
  store.pushHistory();
}

function removeComment(commentId: string) {
  if (!templateConfig.value) return;
  removeCommentFn(templateConfig.value, commentId);
  store.pushHistory();
}

function toggleGroup(groupId: string) {
  if (!templateConfig.value) return;
  const group = templateConfig.value.groups.find(g => g.id === groupId);
  if (group) {
    group.expanded = !group.expanded;
  }
}

function updateGroupName(group: PropertyGroup) {
  if (!templateConfig.value) return;
  templateConfig.value.modified = new Date().toISOString();
  store.pushHistory();
}

function removeGroup(groupId: string) {
  if (!templateConfig.value) return;
  removePropertyGroup(templateConfig.value, groupId);
  store.pushHistory();
}

function handlePropertyUpdate(propertyId: string, updates: Partial<ExposedProperty>) {
  if (!templateConfig.value) return;
  const property = templateConfig.value.exposedProperties.find(p => p.id === propertyId);
  if (property) {
    Object.assign(property, updates);
    templateConfig.value.modified = new Date().toISOString();
    store.pushHistory();
  }
}

function handleCommentUpdate(commentId: string, text: string) {
  if (!templateConfig.value) return;
  updateCommentFn(templateConfig.value, commentId, text);
  store.pushHistory();
}

function getLayerById(layerId: string): Layer | undefined {
  return activeCompLayers.value.find(l => l.id === layerId);
}

function isExposedProperty(item: ExposedProperty | TemplateComment): item is ExposedProperty {
  return checkIsExposedProperty(item);
}

// Drag and Drop
let draggedItem: ExposedProperty | TemplateComment | PropertyGroup | null = null;

function handleDragStart(event: DragEvent, item: ExposedProperty | TemplateComment) {
  draggedItem = item;
  event.dataTransfer?.setData('text/plain', item.id);
}

function handleGroupDragStart(event: DragEvent, group: PropertyGroup) {
  draggedItem = group;
  event.dataTransfer?.setData('text/plain', group.id);
}

function handleDrop(event: DragEvent) {
  // TODO: Implement reordering logic
  draggedItem = null;
}

// Template Operations
function selectTemplate(template: InstalledTemplate) {
  // TODO: Apply template to current composition
  console.log('Selected template:', template.name);
}

function importTemplate() {
  // TODO: Open file picker for MOGRT import
  console.log('Import template');
}

async function exportMOGRT() {
  if (!activeComposition.value || !templateConfig.value) return;

  // Validate template
  const validation = validateTemplate(templateConfig.value, activeComposition.value);
  if (!validation.valid) {
    console.error('Template validation failed:', validation.errors);
    alert('Template validation failed:\n' + validation.errors.join('\n'));
    return;
  }

  if (validation.warnings.length > 0) {
    console.warn('Template warnings:', validation.warnings);
  }

  // Generate poster image (placeholder)
  const posterImage = ''; // TODO: Capture current frame

  // Export
  const blob = await exportMOGRTFn(
    activeComposition.value,
    store.project.assets,
    posterImage
  );

  if (!blob) {
    alert('Export failed');
    return;
  }

  // Download
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${templateConfig.value.name.replace(/\s+/g, '_')}.mogrt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Close menu when clicking outside
function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement;
  if (!target.closest('.add-dropdown')) {
    showAddMenu.value = false;
  }
}

// Lifecycle
import { onMounted, onUnmounted } from 'vue';

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.essential-graphics-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--weyl-surface-1, #121212);
  color: var(--weyl-text-primary, #e5e5e5);
}

.panel-header {
  padding: 8px;
  border-bottom: 1px solid var(--weyl-border-subtle, #2a2a2a);
}

.tabs {
  display: flex;
  gap: 4px;
}

.tab {
  flex: 1;
  padding: 8px 16px;
  background: var(--weyl-surface-2, #1a1a1a);
  border: none;
  border-radius: 4px;
  color: var(--weyl-text-secondary, #9ca3af);
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.15s ease;
}

.tab:hover {
  background: var(--weyl-surface-3, #222222);
}

.tab.active {
  background: var(--weyl-accent, #8b5cf6);
  color: white;
}

.tab-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

/* Browse Tab */
.search-bar {
  margin-bottom: 12px;
}

.search-input {
  width: 100%;
  padding: 8px 12px;
  background: var(--weyl-surface-2, #1a1a1a);
  border: 1px solid var(--weyl-border-subtle, #2a2a2a);
  border-radius: 4px;
  color: var(--weyl-text-primary, #e5e5e5);
  font-size: 13px;
}

.search-input::placeholder {
  color: var(--weyl-text-muted, #6b7280);
}

.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
}

.template-card {
  background: var(--weyl-surface-2, #1a1a1a);
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.template-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.template-poster {
  aspect-ratio: 16/9;
  background: var(--weyl-surface-0, #0a0a0a);
  display: flex;
  align-items: center;
  justify-content: center;
}

.template-poster img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.poster-placeholder {
  color: var(--weyl-text-muted, #6b7280);
  font-size: 11px;
}

.template-info {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.template-name {
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.template-author {
  font-size: 10px;
  color: var(--weyl-text-muted, #6b7280);
}

.no-templates {
  grid-column: 1 / -1;
  text-align: center;
  padding: 32px;
  color: var(--weyl-text-secondary, #9ca3af);
}

/* Edit Tab */
.no-master {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 32px 16px;
  text-align: center;
}

.message {
  color: var(--weyl-text-secondary, #9ca3af);
  margin: 0;
}

.comp-select {
  width: 100%;
  max-width: 300px;
  padding: 8px 12px;
  background: var(--weyl-surface-2, #1a1a1a);
  border: 1px solid var(--weyl-border-subtle, #2a2a2a);
  border-radius: 4px;
  color: var(--weyl-text-primary, #e5e5e5);
  font-size: 13px;
}

.template-editor {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.template-name-section {
  display: flex;
  gap: 8px;
}

.template-name-input {
  flex: 1;
  padding: 8px 12px;
  background: var(--weyl-surface-2, #1a1a1a);
  border: 1px solid var(--weyl-border-subtle, #2a2a2a);
  border-radius: 4px;
  color: var(--weyl-text-primary, #e5e5e5);
  font-size: 14px;
  font-weight: 500;
}

.add-controls {
  position: relative;
}

.add-dropdown {
  position: relative;
}

.dropdown-trigger {
  width: 100%;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  background: var(--weyl-surface-3, #222222);
  border: 1px solid var(--weyl-border-default, #333333);
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 100;
  max-height: 300px;
  overflow-y: auto;
}

.dropdown-menu button {
  display: block;
  width: 100%;
  padding: 8px 12px;
  background: none;
  border: none;
  color: var(--weyl-text-primary, #e5e5e5);
  text-align: left;
  cursor: pointer;
  font-size: 12px;
}

.dropdown-menu button:hover {
  background: var(--weyl-surface-4, #2a2a2a);
}

.dropdown-divider {
  height: 1px;
  background: var(--weyl-border-subtle, #2a2a2a);
  margin: 4px 0;
}

.dropdown-label {
  padding: 8px 12px 4px;
  font-size: 10px;
  color: var(--weyl-text-muted, #6b7280);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.layer-item {
  padding: 0;
}

.layer-button {
  padding-left: 24px;
}

/* Properties List */
.properties-list {
  flex: 1;
  min-height: 200px;
  border: 1px dashed var(--weyl-border-subtle, #2a2a2a);
  border-radius: 4px;
  padding: 8px;
}

.property-item {
  background: var(--weyl-surface-2, #1a1a1a);
  border-radius: 4px;
  margin-bottom: 4px;
  cursor: grab;
}

.property-item.selected {
  outline: 2px solid var(--weyl-accent, #8b5cf6);
}

.property-item:active {
  cursor: grabbing;
}

/* Groups */
.property-group {
  margin-bottom: 8px;
}

.group-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: var(--weyl-surface-2, #1a1a1a);
  border-radius: 4px;
  cursor: pointer;
}

.group-header:hover {
  background: var(--weyl-surface-3, #222222);
}

.expand-icon {
  font-size: 10px;
  color: var(--weyl-text-muted, #6b7280);
}

.group-name-input {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--weyl-text-primary, #e5e5e5);
  font-size: 12px;
  font-weight: 500;
}

.group-name-input:focus {
  outline: none;
  background: var(--weyl-surface-0, #0a0a0a);
  border-radius: 2px;
  padding: 2px 4px;
  margin: -2px -4px;
}

.group-content {
  padding: 8px;
  padding-left: 24px;
}

.property-group.collapsed .group-content {
  display: none;
}

/* Property Picker Modal */
.property-picker-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.picker-content {
  background: var(--weyl-surface-2, #1a1a1a);
  border-radius: 8px;
  width: 90%;
  max-width: 400px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--weyl-border-subtle, #2a2a2a);
}

.picker-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
}

.picker-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.picker-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.picker-item:hover {
  background: var(--weyl-surface-3, #222222);
}

.prop-name {
  font-size: 13px;
}

.prop-type {
  font-size: 10px;
  color: var(--weyl-text-muted, #6b7280);
  text-transform: uppercase;
}

/* Export Section */
.export-section {
  padding-top: 12px;
  border-top: 1px solid var(--weyl-border-subtle, #2a2a2a);
}

.btn-export {
  width: 100%;
}

/* Buttons */
.btn-primary {
  padding: 10px 16px;
  background: var(--weyl-accent, #8b5cf6);
  border: none;
  border-radius: 4px;
  color: white;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s ease;
}

.btn-primary:hover:not(:disabled) {
  background: var(--weyl-accent-hover, #a78bfa);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  padding: 8px 12px;
  background: var(--weyl-surface-2, #1a1a1a);
  border: 1px solid var(--weyl-border-default, #333333);
  border-radius: 4px;
  color: var(--weyl-text-primary, #e5e5e5);
  font-size: 12px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.btn-secondary:hover {
  background: var(--weyl-surface-3, #222222);
}

.btn-icon {
  width: 32px;
  height: 32px;
  padding: 0;
  background: var(--weyl-surface-2, #1a1a1a);
  border: 1px solid var(--weyl-border-subtle, #2a2a2a);
  border-radius: 4px;
  color: var(--weyl-text-secondary, #9ca3af);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.btn-icon:hover {
  background: var(--weyl-surface-3, #222222);
  color: var(--weyl-text-primary, #e5e5e5);
}

.btn-icon-small {
  width: 20px;
  height: 20px;
  padding: 0;
  background: none;
  border: none;
  color: var(--weyl-text-muted, #6b7280);
  cursor: pointer;
  font-size: 14px;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.group-header:hover .btn-icon-small {
  opacity: 1;
}

.btn-icon-small:hover {
  color: var(--weyl-text-primary, #e5e5e5);
}
</style>
