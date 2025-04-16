// Global custom type definitions
// This adds lightweight Jest type definitions without requiring full @types/jest

declare module 'jest' {
  // Just enough to satisfy TypeScript
  export interface Jest {
    fn: () => any;
    mock: any;
  }
  
  const jest: Jest;
  export default jest;
} 