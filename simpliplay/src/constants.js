// src/constants.js
const path = require('path');
const os = require('os');

module.exports = {
  APP_CONSTANTS: {
    VERSION: '2.0.4.4',
    GPU_ACCEL: 'enabled',
    SNAPSHOTS_DIR: path.join(os.homedir(), 'simpliplay-snapshots'),
    BAD_FILE_EXTENSIONS: ['.exe', '.bat', '.cmd', '.sh', '.msi', '.com', '.vbs', '.ps1', '.jar', '.scr']
  }
};