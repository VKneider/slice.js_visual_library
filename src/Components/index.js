// Entry point for the Slice.js Visual Components Library
// Exports all available components for consumption

// Visual Components
export * from './Visual';

// Service Components  
export * from './Service';

// Convenience export of all components grouped by category
import * as VisualComponents from './Visual/index.js';
import * as ServiceComponents from './Service/index.js';

export const components = {
  ...VisualComponents,
  ...ServiceComponents
};

// Export categories for easier access
export const categories = {
  Visual: VisualComponents,
  Service: ServiceComponents
};

export default components;