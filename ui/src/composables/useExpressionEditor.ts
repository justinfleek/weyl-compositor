import { ref, shallowRef } from 'vue';
import type { AnimatableProperty, PropertyExpression } from '@/types/project';

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
   */
  function applyExpression(expression: PropertyExpression) {
    if (currentProperty.value) {
      currentProperty.value.expression = expression;
    }
    closeExpressionEditor();
  }

  /**
   * Remove expression from the current property
   */
  function removeExpression() {
    if (currentProperty.value) {
      currentProperty.value.expression = undefined;
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
