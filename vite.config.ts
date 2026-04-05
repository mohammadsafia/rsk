import { defineConfig } from 'vite';
import type { Plugin as VitePlugin } from 'vite';
import path from 'path';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';
import { sentryVitePlugin } from '@sentry/vite-plugin';

const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN;
const sentryOrg = process.env.SENTRY_ORG;
const sentryProject = process.env.SENTRY_PROJECT;
const sentryRelease = process.env.SENTRY_RELEASE;

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
          theme: 'github-light',
          keepBackground: false,
        },
      ],
    ],
  }) as unknown as VitePlugin,
  { enforce: 'pre' as const },
);

export default defineConfig({
  plugins: [
    mdxPlugin,
    react(),
    tailwindcss(),

    // IMPORTANT: keep Sentry plugin LAST
    ...(sentryAuthToken
      ? [
          sentryVitePlugin({
            org: sentryOrg,
            project: sentryProject,
            authToken: sentryAuthToken,
            release: {
              name: sentryRelease,
            },
            // Optional but recommended
            sourcemaps: {
              filesToDeleteAfterUpload: ['./dist/**/*.map'],
            },
          }),
        ]
      : []),
  ],

  base: '/med-legal/',

  server: {
    port: 3000,
    open: true,
  },

  resolve: {
    alias: [
      // ✅ EXISTING path aliases (backward compatibility - DO NOT REMOVE)
      { find: 'App', replacement: path.resolve(__dirname, './src/App') },
      { find: 'api', replacement: path.resolve(__dirname, './src/api') },
      { find: 'app-constants', replacement: path.resolve(__dirname, './src/app-constants') },
      { find: 'assets', replacement: path.resolve(__dirname, './src/assets') },
      { find: 'components', replacement: path.resolve(__dirname, './src/components') },
      { find: 'config', replacement: path.resolve(__dirname, './src/config') },
      { find: 'context', replacement: path.resolve(__dirname, './src/context') },
      { find: 'hooks', replacement: path.resolve(__dirname, './src/hooks') },
      { find: 'layout', replacement: path.resolve(__dirname, './src/layout') },
      { find: 'lib', replacement: path.resolve(__dirname, './src/lib') },
      { find: 'locales', replacement: path.resolve(__dirname, './src/locales') },
      { find: 'pages', replacement: path.resolve(__dirname, './src/pages') },
      { find: 'router', replacement: path.resolve(__dirname, './src/router') },
      { find: 'schemas', replacement: path.resolve(__dirname, './src/schemas') },
      { find: 'stores', replacement: path.resolve(__dirname, './src/stores') },
      { find: 'themes', replacement: path.resolve(__dirname, './src/themes') },
      { find: 'types', replacement: path.resolve(__dirname, './src/types') },
      { find: 'utils', replacement: path.resolve(__dirname, './src/utils') },

      // ✅ NEW @ prefix aliases (for template/new code)
      { find: '@api', replacement: path.resolve(__dirname, 'src/api') },
      { find: '@assets', replacement: path.resolve(__dirname, 'src/assets') },
      { find: '@app-config', replacement: path.resolve(__dirname, 'src/app-config') },
      { find: '@contexts', replacement: path.resolve(__dirname, 'src/lib/contexts') },
      { find: '@hooks', replacement: path.resolve(__dirname, 'src/lib/hooks') },
      { find: '@constants', replacement: path.resolve(__dirname, 'src/lib/constants') },
      { find: '@utils', replacement: path.resolve(__dirname, 'src/lib/utils') },
      { find: '@hoc', replacement: path.resolve(__dirname, 'src/lib/hoc') },
      { find: '@components', replacement: path.resolve(__dirname, 'src/components_v2') },
      { find: '@pages', replacement: path.resolve(__dirname, 'src/pages') },
      { find: '@views', replacement: path.resolve(__dirname, 'src/views') },
      { find: '@layouts', replacement: path.resolve(__dirname, 'src/layouts') },
      { find: '@app-types', replacement: path.resolve(__dirname, 'src/types') },
      { find: '@routes', replacement: path.resolve(__dirname, 'src/routes') },
      { find: '@locales', replacement: path.resolve(__dirname, 'src/locales') },
      { find: '@component-docs', replacement: path.resolve(__dirname, 'src/component-docs') },
    ],
  },
  build: {
    sourcemap: sentryAuthToken ? 'hidden' : false,
  },
});
