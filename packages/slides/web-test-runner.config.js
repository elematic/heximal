export default {
  port: 8004,
  preserveSymlinks: true,
  nodeResolve: {
    preserveSymlinks: true,
    exportConditions: ['development', 'browser'],
  },
  testFramework: {
    config: {
      ui: 'tdd',
      timeout: '2000',
    },
  },
};
