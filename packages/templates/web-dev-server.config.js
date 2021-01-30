import rollupCommonJS from '@rollup/plugin-commonjs';
import { fromRollup } from '@web/dev-server-rollup';

const commonJS = fromRollup(rollupCommonJS);

export default {
  open: true,
  nodeResolve: true,
  appIndex: 'demo/index.html',
  plugins: [commonJS()],
};
