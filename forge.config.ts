
import type { ForgeConfig } from '@electron-forge/shared-types';

const config: ForgeConfig = {
  packagerConfig: { asar: true },
  rebuildConfig: {},
  makers: [
    { name: '@electron-forge/maker-squirrel', config: { name: 'InfluenceOps' } },
  ],
};
export default config;
