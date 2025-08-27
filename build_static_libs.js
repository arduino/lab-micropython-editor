const esbuild = require('esbuild');
const { execSync } = require('child_process');

// Build choo with browserify
// Building with esbuild would require more changes
// to the source and it works well so far
console.log('Building choo with browserify...');
execSync('browserify static_libs/build_choo.js -o ui/arduino/libs/choo.js', { stdio: 'inherit' });

// Build codemirror with esbuild
console.log('Building codemirror with esbuild...');
esbuild.build({
  entryPoints: ['static_libs/build_codemirror.js'],
  bundle: true,
  outfile: 'ui/arduino/libs/codemirror.js',
  format: 'iife',
  minify: false,
  platform: 'browser',
  target: 'es2018'
}).then(() => {
  console.log('Both builds complete!');
}).catch((error) => {
  console.error('CodeMirror build failed:', error);
  process.exit(1);
});