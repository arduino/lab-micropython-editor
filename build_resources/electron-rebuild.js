const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');

console.log('System info:', {
  arch: process.arch,
  platform: process.platform,
  osArch: os.arch(),
  osType: os.type()
});

if (process.platform === 'linux' && (process.arch === 'arm64' || os.arch() === 'arm64')) {
  console.log('Configuring for ARM64 build...');
  
  const npmrcContent = `target_arch=arm64
target_platform=linux
disturl=https://electronjs.org/headers
runtime=electron
cache=/tmp/.npm
build_from_source=true`;
  
  fs.writeFileSync('.npmrc', npmrcContent);
  
  // Clear cached builds
  execSync('rm -rf node_modules/@serialport/bindings-cpp/build', { stdio: 'inherit' });
  
  try {
    execSync('npx @electron/rebuild --arch=arm64 --force', { 
      stdio: 'inherit',
      env: { 
        ...process.env, 
        TARGET_ARCH: 'arm64',
        npm_config_target_arch: 'arm64',
        ELECTRON_REBUILD_ARCH: 'arm64'
      }
    });
  } catch (error) {
    console.error('ARM64 rebuild failed');
    process.exit(1);
  }
} else {
  execSync('npx @electron/rebuild', { stdio: 'inherit' });
}