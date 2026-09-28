import esbuild from 'esbuild';

try {
  esbuild.buildSync({
    entryPoints: ['server.ts'],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    packages: 'external',
    sourcemap: true,
    outfile: 'dist/server.cjs',
  });
  console.log('✓ server.ts successfully bundled to dist/server.cjs');
} catch (error) {
  console.error('Server bundle build failed:', error);
  process.exit(1);
}
