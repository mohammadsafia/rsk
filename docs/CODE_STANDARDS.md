# Code Standards

This is the complete frontend code standards checklist for RSK. Every `.ts`/`.tsx` file in the codebase must pass these rules. Standards are grouped into 12 categories.

---

## 1. Imports

| # | Rule | Wrong | Correct |
|---|------|-------|---------|
| 1.1 | Use path aliases, never deep relative imports | `import X from '../../../components/ui/button'` | `import { Button } from '@components/ui'` |
| 1.2 | UI components from barrel only | `import { Button } from '@components/ui/button'` | `import { Button } from '@components/ui'` |
| 1.3 | Shared components from barrel only | `import { Card } from '@components/shared/card/Card'` | `import { Card } from '@components/shared'` |
| 1.4 | Custom icons from `@assets/icons` barrel | `import Icon from '@assets/icons/MyIcon'` | `import { MyIcon } from '@assets/icons'` |
| 1.5 | Groups separated by one empty line, in strict order | Mixed/unordered groups | See order below |

### Import order

```
1. React & core (react, react-router-dom)
2. Third-party (zod, react-hook-form, framer-motion, etc.)
3. UI components (@components/ui barrel)
4. Shared components (@components/shared barrel)
5. View components (@views/*)
6. Contexts, then hooks (@contexts, @hooks/*)
7. Utils, constants, config (@utils, @constants, @app-config)
8. Icons (lucide-react, then @assets/icons)
9. Types (import type { ... } from '@app-types')
```

---

## 2. Types

| # | Rule | Wrong | Correct |
|---|------|-------|---------|
| 2.1 | Use `type` not `interface` (unless extension/merging required) | `interface Props {}` | `type Props = {}` |
| 2.2 | No `any`, no implicit types, no unsafe casting | `data: any` | `data: UserDto` |
| 2.3 | Status/type fields use enums or type literals, never raw `string` | `status: string` | `status: 'active' \| 'inactive'` |
| 2.4 | Exported functions have explicit return types, EXCEPT React Query hooks | Adding return type to query hook | Omit return type on hooks |
| 2.5 | DTOs follow naming: `ForReadDto`, `ForCreateDto`, `ForUpdateDto`, `ListDto`, `ParamsDto` | `UserResponse`, `CreateUserPayload` | `UserForReadDto`, `UserForCreateDto` |
| 2.6 | DTOs live in `src/types/` and export through barrel | DTO defined inline | DTO in `src/types/api/` with barrel export |
| 2.7 | Feature-specific Zod schemas in `src/views/<feature>/` not `src/types/` | Schema in `src/types/` | Schema in `src/views/feature/schemas.ts` |
| 2.8 | Use `import type` for type-only imports | `import { UserDto } from '@app-types'` | `import type { UserDto } from '@app-types'` |

---

## 3. API Layer

| # | Rule | Wrong | Correct |
|---|------|-------|---------|
| 3.1 | Endpoints in `ApiEndpoints.ts` as plain strings | Function callbacks | `LIST: '/users'` |
| 3.2 | Request functions defined above handler, referenced by name | Inline arrow in handler | `request: getUsersList` |
| 3.3 | `queryKey` is a string, not an array | `queryKey: ['users', 'list']` | `queryKey: 'users/list'` |
| 3.4 | Handler in `src/api/handlers/` with typed request + handler object | API call in component | Proper handler file |
| 3.5 | Every API response fully typed | `HttpClient.get(url)` | `HttpClient.get<ResultDto<UserDto>>(url)` |
| 3.6 | Use `pathBuilder` for URL params | `` `/users/${id}` `` | `pathBuilder(ApiEndpoints.USERS.BY_ID, { id })` |

---

## 4. React Query Hooks

| # | Rule | Wrong | Correct |
|---|------|-------|---------|
| 4.1 | Queries in `hooks/queries/`, mutations in `hooks/mutations/` | Hook in component | Separate hook file |
| 4.2 | Wrap string queryKey in array | `queryKey: handler.queryKey` | `queryKey: [handler.queryKey]` |
| 4.3 | No explicit return type on hooks | `): UseQueryResult<...>` | Omit return type |
| 4.4 | Parameterized queries: add params to key + guard with `enabled` | Missing `enabled: !!id` | `enabled: enabled && !!id` |
| 4.5 | Mutations invalidate correct queries on success | No invalidation | `queryClient.invalidateQueries(...)` |
| 4.6 | No server state duplicated in `useState` | `const [users, setUsers] = useState(data)` | Use query data directly |

---

## 5. Components

| # | Rule | Wrong | Correct |
|---|------|-------|---------|
| 5.1 | Pages contain logic directly — no wrapper Views | `<CommunitiesView />` in page | Logic in page itself |
| 5.2 | Views only for reusable components across multiple pages | Single-use wrapper | Reused by 2+ pages |
| 5.3 | Shared components use compound pattern (`FC & { Sub: FC }`) | Monolithic shared component | `MyCard.Header`, `MyCard.Body` |
| 5.4 | Break components at ~150 lines of JSX | 300-line return block | Extract sub-components |
| 5.5 | Before creating, check `ui/`, `shared/`, `forms/`, `tables/` | New button component | Use existing `Button` |
| 5.6 | No business logic in UI components | API call in Button | Logic in page, pass handler |
| 5.7 | No inline SVG — move to `src/assets/icons/` with barrel | `<svg>...</svg>` in JSX | `import { MyIcon } from '@assets/icons'` |

---

## 6. Conditional Rendering

| # | Rule | Wrong | Correct |
|---|------|-------|---------|
| 6.1 | Always use `Conditional` component | `{show && <X />}` | `<Conditional.If condition={show}><X /></Conditional.If>` |
| 6.2 | Use `fallback` prop for else-case | `{x ? <A/> : <B/>}` | `<Conditional.If condition={x} fallback={<B/>}><A/></Conditional.If>` |

---

## 7. Forms

| # | Rule | Wrong | Correct |
|---|------|-------|---------|
| 7.1 | All forms use reusable Form component with FormProvider | Raw `useForm` + `<form>` | FormProvider-based Form |
| 7.2 | Inputs use existing form component wrappers | `<input {...register('name')} />` | `<FormInput name="name" />` |
| 7.3 | Zod schema in `views/<feature>/schemas.ts` | Schema inline in component | Separate schema file |

---

## 8. Styling & Tokens

| # | Rule | Wrong | Correct |
|---|------|-------|---------|
| 8.1 | Theme-aware classes only | `bg-white`, `text-slate-900` | `bg-background`, `text-foreground` |
| 8.2 | Use `cn()` for conditional classes | `` className={`base ${x ? 'a' : ''}`} `` | `className={cn('base', x && 'a')}` |
| 8.3 | Tailwind scale values, not arbitrary pixels | `p-[24px]`, `gap-[32px]` | `p-6`, `gap-8` |
| 8.4 | No hardcoded hex/rgb — use CSS tokens | `#3B82F6` | Token from design system |
| 8.5 | No CSS files or style tags — Tailwind only | `<style>` or `.css` import | Tailwind utility classes |
| 8.6 | New tokens need both light and dark mode in `index.css` | Token without dark variant | `:root` + `.dark` values |

---

## 9. File Organization

| # | Rule | Wrong | Correct |
|---|------|-------|---------|
| 9.1 | Folder names kebab-case | `CommunityCard/` | `community-card/` |
| 9.2 | Each view component in own folder with `index.ts` barrel | Flat files | `community-card/CommunityCard.tsx` + `index.ts` |
| 9.3 | No new folder structures outside defined architecture | `src/helpers/` | Use existing `src/lib/utils/` |

---

## 10. Component Internal Order

Before the component function, define in this order:
1. Component-specific types (props interfaces, local types)
2. Constants and helper functions used by the component

Inside the component function, hooks and logic must follow this exact order:

```
1.  Core hooks (useNavigate, useParams, useLocation)
2.  Context hooks (useTheme, useAuth)
3.  Shared utility hooks (useToast, useAppTranslation)
4.  Query/mutation hooks
5.  Refs (useRef)
6.  Component state (useState)
7.  Computed values (useMemo)
8.  Callbacks (useCallback, handle* prefix)
9.  Effects (useEffect — runs-once first, every-render last)
10. JSX return
```

---

## 11. Date/Time & i18n

| # | Rule | Wrong | Correct |
|---|------|-------|---------|
| 11.1 | Use `useDate`/`useTime` hooks, never custom formatters | `const fmt = (d) => ...` | `const { formatDate } = useDate()` |
| 11.2 | Use `useAppTranslation(ns)` for all user-facing strings | Hardcoded `"Submit"` | `t('submit')` |

---

## 12. General

| # | Rule | Wrong | Correct |
|---|------|-------|---------|
| 12.1 | No TODOs or placeholders in shipped code | `// TODO: fix later` | Complete implementation |
| 12.2 | No new dependencies without explicit instruction | `npm install lodash` | Use existing utils |
| 12.3 | Event handlers named `handle*` | `onClickDelete` | `handleDelete` |
| 12.4 | Errors surfaced via toast, never silently swallowed | Empty `catch {}` | `toast({ title: error.message })` |
| 12.5 | Route pages use `React.lazy` | Direct import | `const Page = lazy(() => import(...))` |
