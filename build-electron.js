const esbuild = require('esbuild')
const path = require('path')

const buildMain = async () => {
  await esbuild.build({
    entryPoints: [path.resolve(__dirname, 'src/main/index.ts')],
    bundle: true,
    platform: 'node',
    target: 'node18',
    outfile: path.resolve(__dirname, 'dist/main/index.js'),
    external: ['electron'],
    format: 'cjs',
    sourcemap: true,
    minify: process.env.NODE_ENV === 'production'
  })

  await esbuild.build({
    entryPoints: [path.resolve(__dirname, 'src/main/preload.ts')],
    bundle: true,
    platform: 'node',
    target: 'node18',
    outfile: path.resolve(__dirname, 'dist/main/preload.js'),
    external: ['electron'],
    format: 'cjs',
    sourcemap: true,
    minify: process.env.NODE_ENV === 'production'
  })

  console.log('Electron main process built successfully')
}

buildMain().catch(console.error)