export default {
  open: true,
  preserveSymlinks: true,
  nodeResolve: {
    preserveSymlinks: true,
    exportConditions: ['development', 'browser'],
  },
  appIndex: 'demo/index.html',
};
