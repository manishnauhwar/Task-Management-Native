// This is a stub file to satisfy the TypeScript requirement for Jest types
// Without changing any actual functionality in your project

declare module 'jest' {
  // Minimal stub to stop TypeScript from complaining
  export const fn: () => any;
  export const mock: (moduleName: string, factory?: any) => void;
} 