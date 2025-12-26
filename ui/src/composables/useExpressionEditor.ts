import { ref, shallowRef } from 'vue';
import type { AnimatableProperty, PropertyExpression } from '@/types/project';
import { useCompositorStore } from '@/stores/compositorStore';
import { setPropertyExpression, removePropertyExpression } from '@/stores/actions/keyframeActions';

// Global state for expression editor
const isVisible = ref(false);
const currentProperty = shallowRef<AnimatableProperty<any> | null>(null);
const currentLayerId = ref<string>('');
const currentPropertyPath = ref<string>('');

/**
 * Composable for global expression editor state
 * Use this to open the expression editor from any component
 */
export function useExpressionEditor() {
  /**
   * Open the expression editor for a specific property
   */
  function openExpressionEditor(
    property: AnimatableProperty<any>,
    layerId: string,
    propertyPath: string = ''
  ) {
    currentProperty.value = property;
    currentLayerId.value = layerId;
    currentPropertyPath.value = propertyPath;
    isVisible.value = true;
  }

  /**
   * Close the expression editor
   */
  function closeExpressionEditor() {
    isVisible.value = false;
  }

  /**
   * Apply expression to the current property
   * BUG-042 FIX: Use store action instead of direct mutation for undo/redo support
   */
  function applyExpression(expression: PropertyExpression) {
    if (currentLayerId.value && currentPropertyPath.value) {
      const store = useCompositorStore();
      setPropertyExpression(store, currentLayerId.value, currentPropertyPath.value, expression);
    }
    closeExpressionEditor();
  }

  /**
   * Remove expression from the current property
   * BUG-042 FIX: Use store action instead of direct mutation for undo/redo support
   */
  function removeExpression() {
    if (currentLayerId.value && currentPropertyPath.value) {
      const store = useCompositorStore();
      removePropertyExpression(store, currentLayerId.value, currentPropertyPath.value);
    }
    closeExpressionEditor();
  }

  return {
    // State
    isVisible,
    currentProperty,
    currentLayerId,
    currentPropertyPath,
    // Actions
    openExpressionEditor,
    closeExpressionEditor,
    applyExpression,
    removeExpression
  };
}
