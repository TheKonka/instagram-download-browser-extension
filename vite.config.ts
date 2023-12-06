import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { resolve } from 'path';

export default defineConfig(({ command, mode }) => {
   return {
      appType: 'custom',
      base: './', // 开发或生产环境服务的公共基础路径
      build: {
         minify: false,
         target: 'esnext', // 配置构建的目标为 esnext
         outDir: 'dist', // 指定输出路径（相对于 项目根目录).
         emptyOutDir: true, // 清空输出目录
         rollupOptions: {
            input: {
               options: resolve(__dirname, 'src/options/index.html'),
               content: 'src/content/index.ts',
               background: `src/background.${mode}.ts`,
               xhr: 'src/xhr.ts',
            },
            output: {
               entryFileNames: '[name].js', // 配置生成的 JavaScript 文件的格式
            },
         },
      },
      plugins: [
         viteStaticCopy({
            targets: [
               {
                  src: `./src/manifest.${mode}.json`,
                  rename: 'manifest.json',
                  dest: '.',
               },
            ],
         }),
      ],
   };
});
