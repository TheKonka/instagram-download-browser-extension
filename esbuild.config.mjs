import { argv } from 'node:process';
import { cp, readFile, writeFile, rmdir } from 'node:fs/promises';

import pkg from './package.json' with { type: 'json' };
import * as esbuild from 'esbuild';
import { sassPlugin } from 'esbuild-sass-plugin';

const platform = argv[2];

try {
   await rmdir(`dist/${platform}`, { recursive: true });
} catch (e) {}

const entryPoints = ['src/content/index.ts', 'src/popup/index.tsx', 'src/options/index.ts'];

if (platform === 'chrome') {
   entryPoints.push('src/background/chrome.ts', 'src/xhr.ts', 'src/inject.ts');
}
if (platform === 'firefox') {
   entryPoints.push('src/background/firefox.ts');
}

const ctx = await esbuild.context({
   entryPoints,
   outdir: `dist/${platform}`,
   bundle: true,
   plugins: [
      sassPlugin(),
      {
         name: 'copy-manifest',
         setup(build) {
            build.onEnd(async () => {
               await cp('public', `dist/${platform}`, { recursive: true });
               const contents = await readFile(`./src/manifest.${platform}.json`, { encoding: 'utf8' });
               const replacedContents = contents.replace(/__MSG_extVersion__/g, pkg.version);
               await writeFile(`dist/${platform}/manifest.json`, replacedContents, { encoding: 'utf8' });
               console.log('manifest copied and replaced successfully');
            });
         },
      },
   ],
});

ctx.watch();
