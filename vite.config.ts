import { defineConfig, lazyPlugins } from 'vite-plus';
import type { Plugin as VitePlugin } from 'vite-plus';
import path from 'path';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';

import mdx from '@mdx-js/rollup';
import remarkFrontmatter from 'remark-frontmatter';
import remarkMdxFrontmatter from 'remark-mdx-frontmatter';
import rehypePrettyCode from 'rehype-pretty-code';
import remarkGfm from 'remark-gfm';
import remarkDocs from './scripts/docs/remark-docs';
import { scanDocCounts } from './scripts/docs/doc-counts';

const mdxBase = mdx({
  providerImportSource: '@mdx-js/react',
  remarkPlugins: [remarkFrontmatter, [remarkMdxFrontmatter, { name: 'frontmatter', exportType: 'const' }], remarkGfm, remarkDocs],
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
}) as unknown as VitePlugin;

// `import source from './Page.mdx?raw'` must stay raw text (docs Code tabs read it), but @mdx-js/rollup
// strips the query before filtering, so skip `?raw` ids here and let Vite's raw loader handle them.
const mdxPlugin: VitePlugin = {
  ...mdxBase,
  enforce: 'pre',
  transform(this: unknown, ...args: [string, string]) {
    if (/[?&]raw\b/.test(args[1])) return null;
    return (mdxBase.transform as (...a: [string, string]) => unknown).apply(this, args);
  },
} as VitePlugin;

export default defineConfig({
  lint: {
    plugins: ['oxc', 'typescript', 'unicorn'],
    categories: {
      correctness: 'warn',
    },
    env: {
      builtin: true,
    },
    ignorePatterns: ['dist', 'src/types/api/**', 'src/types/api-v2/**'],
    overrides: [
      {
        files: ['**/*.{ts,tsx}'],
        rules: {
          'constructor-super': 'off',
          'for-direction': 'error',
          'getter-return': 'off',
          'no-async-promise-executor': 'error',
          'no-case-declarations': 'error',
          'no-class-assign': 'off',
          'no-compare-neg-zero': 'error',
          'no-cond-assign': 'error',
          'no-const-assign': 'off',
          'no-constant-binary-expression': 'error',
          'no-constant-condition': 'error',
          'no-control-regex': 'error',
          'no-debugger': 'error',
          'no-delete-var': 'error',
          'no-dupe-class-members': 'off',
          'no-dupe-else-if': 'error',
          'no-dupe-keys': 'off',
          'no-duplicate-case': 'error',
          'no-empty': 'off',
          'no-empty-character-class': 'error',
          'no-empty-pattern': 'error',
          'no-empty-static-block': 'error',
          'no-ex-assign': 'error',
          'no-extra-boolean-cast': 'error',
          'no-fallthrough': 'error',
          'no-func-assign': 'off',
          'no-global-assign': 'error',
          'no-import-assign': 'off',
          'no-invalid-regexp': 'error',
          'no-irregular-whitespace': 'error',
          'no-loss-of-precision': 'error',
          'no-misleading-character-class': 'error',
          'no-new-native-nonconstructor': 'off',
          'no-nonoctal-decimal-escape': 'error',
          'no-obj-calls': 'off',
          'no-prototype-builtins': 'off',
          'no-redeclare': 'off',
          'no-regex-spaces': 'error',
          'no-self-assign': 'error',
          'no-setter-return': 'off',
          'no-shadow-restricted-names': 'error',
          'no-sparse-arrays': 'error',
          'no-this-before-super': 'off',
          'no-undef': 'off',
          'no-unexpected-multiline': 'error',
          'no-unreachable': 'off',
          'no-unsafe-finally': 'error',
          'no-unsafe-negation': 'off',
          'no-unsafe-optional-chaining': 'error',
          'no-unused-labels': 'error',
          'no-unused-private-class-members': 'error',
          'no-unused-vars': 'off',
          'no-useless-backreference': 'error',
          'no-useless-catch': 'error',
          'no-useless-escape': 'error',
          'no-with': 'off',
          'require-yield': 'error',
          'use-isnan': 'error',
          'valid-typeof': 'error',
          'no-var': 'error',
          'prefer-const': 'error',
          'prefer-rest-params': 'error',
          'prefer-spread': 'error',
          'no-array-constructor': 'error',
          'no-unused-expressions': 'off',
          'typescript/ban-ts-comment': 'off',
          'typescript/no-duplicate-enum-values': 'error',
          'typescript/no-empty-object-type': 'off',
          'typescript/no-explicit-any': 'off',
          'typescript/no-extra-non-null-assertion': 'error',
          'typescript/no-misused-new': 'error',
          'typescript/no-namespace': 'error',
          'typescript/no-non-null-asserted-optional-chain': 'error',
          'typescript/no-require-imports': 'off',
          'typescript/no-this-alias': 'error',
          'typescript/no-unnecessary-type-constraint': 'error',
          'typescript/no-unsafe-declaration-merging': 'error',
          'typescript/no-unsafe-function-type': 'off',
          'typescript/no-wrapper-object-types': 'error',
          'typescript/prefer-as-const': 'error',
          'typescript/prefer-namespace-keyword': 'error',
          'typescript/triple-slash-reference': 'error',
          'react/rules-of-hooks': 'error',
          'react/exhaustive-deps': 'warn',
          'react/only-export-components': 'off',
        },
        plugins: ['react'],
        env: {
          es2020: true,
          browser: true,
        },
      },
    ],
    options: {
      typeAware: true,
      typeCheck: true,
    },
    jsPlugins: [
      {
        name: 'vite-plus',
        specifier: 'vite-plus/oxlint-plugin',
      },
    ],
    rules: {
      'vite-plus/prefer-vite-plus-imports': 'error',
    },
  },
  test: {
    // Vitest v4 compatibility: preserve mock call history.
    // Remove after tests no longer rely on calls from setup or earlier tests.
    // https://viteplus.dev/guide/vitest-v5#remove-unneeded-compatibility-settings
    // https://vitest.dev/guide/migration/#clearmocks-is-enabled-by-default
    clearMocks: false,
  },
  fmt: {
    tabWidth: 2,
    useTabs: false,
    jsxSingleQuote: false,
    semi: true,
    singleQuote: true,
    printWidth: 140,
    endOfLine: 'lf',
    arrowParens: 'always',
    sortPackageJson: false,
    sortTailwindcss: {},
    // *.hbs: DTO generator templates; formatting them as HTML corrupts generated output.
    // *.mdx: oxfmt mangles inline `export const` JSX blocks in component docs.
    // .claude/skills: vendored Taste skills; reformatting breaks their skills-lock.json hashes.
    ignorePatterns: ['**/*.hbs', '**/*.mdx', '.claude/skills/**'],
  },
  plugins: lazyPlugins(() => [mdxPlugin, react(), tailwindcss()]),
  // The docs site is dev-only; the landing page's component counts are baked in at build time instead.
  define: {
    __RSK_DOC_COUNTS__: JSON.stringify(scanDocCounts(path.resolve(__dirname, 'src/component-docs'))),
  },
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
