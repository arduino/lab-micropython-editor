const { execSync } = require('child_process');
const { arch, platform } = process;

console.log(`Building for ${platform}-${arch}`);

if (platform === 'linux' && arch === 'arm64') {
  // Configure npm for ARM64 cross-compilation
  process.env.npm_config_target_arch = 'arm64';
  process.env.npm_config_target_platform = 'linux';
  process.env.npm_config_arch = 'arm64';
  process.env.npm_config_disturl = 'https://electronjs.org/headers';
  process.env.npm_config_runtime = 'electron';
  
  try {
    // Force rebuild serialport for ARM64
    execSync('npx @electron/rebuild --arch=arm64', { stdio: 'inherit' });
  } catch (error) {
    console.warn('ARM64 rebuild failed, attempting alternative...');
    try {
      execSync('npm rebuild @serialport/bindings-cpp --build-from-source', { stdio: 'inherit' });
    } catch (e) {
      console.error('All rebuild attempts failed:', e.message);
    }
  }
} else {
  // Standard rebuild for other platforms
  try {
    execSync('npx @electron/rebuild', { stdio: 'inherit' });
  } catch (error) {
    console.warn('Standard rebuild failed:', error.message);
  }
}