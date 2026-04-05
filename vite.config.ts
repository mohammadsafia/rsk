import { defineConfig } from 'vite';
import type { Plugin as VitePlugin } from 'vite';
import path from 'path';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';

import mdx from '@mdx-js/rollup';
import remarkFrontmatter from 'remark-frontmatter';
import remarkMdxFrontmatter from 'remark-mdx-frontmatter';
import rehypePrettyCode from 'rehype-pretty-code';

const mdxPlugin = Object.assign(
  mdx({
    providerImportSource: '@mdx-js/react',
    remarkPlugins: [remarkFrontmatter, [remarkMdxFrontmatter, { name: 'frontmatter', exportType: 'const' }]],
    rehypePlugins: [
      [
        rehypePrettyCode,
        {
          theme: {
            light: 'github-light',
            dark: 'github-dark',
          },
          keepBackground: false,
        },
      ],
    ],
  }) as unknown as VitePlugin,
  { enforce: 'pre' as const },
);

export default defineConfig({
  plugins: [mdxPlugin, react(), tailwindcss()],
  server: {
    port: 3000,
    open: true,
  },

  resolve: {
    alias: [
      { find: '@api', replacement: path.resolve(__dirname, 'src/api') },
      { find: '@assets', replacement: path.resolve(__dirname, 'src/assets') },
      { find: '@app-config', replacement: path.resolve(__dirname, 'src/app-config') },
      { find: '@contexts', replacement: path.resolve(__dirname, 'src/lib/contexts') },
      { find: '@hooks', replacement: path.resolve(__dirname, 'src/lib/hooks') },
      { find: '@constants', replacement: path.resolve(__dirname, 'src/lib/constants') },
      { find: '@utils', replacement: path.resolve(__dirname, 'src/lib/utils') },
      { find: '@hoc', replacement: path.resolve(__dirname, 'src/lib/hoc') },
      { find: '@components', replacement: path.resolve(__dirname, 'src/components') },
      { find: '@pages', replacement: path.resolve(__dirname, 'src/pages') },
      { find: '@views', replacement: path.resolve(__dirname, 'src/views') },
      { find: '@layouts', replacement: path.resolve(__dirname, 'src/layouts') },
      { find: '@app-types', replacement: path.resolve(__dirname, 'src/types') },
      { find: '@routes', replacement: path.resolve(__dirname, 'src/routes') },
      { find: '@locales', replacement: path.resolve(__dirname, 'src/locales') },
      { find: '@component-docs', replacement: path.resolve(__dirname, 'src/component-docs') },
    ],
  },
});
