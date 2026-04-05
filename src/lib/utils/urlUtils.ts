type ExtractPathParams<Path extends string> = Path extends `${string}:${infer Param}/${infer Rest}`
  ? Param | ExtractPathParams<`/${Rest}`>
  : Path extends `${string}:${infer Param}`
    ? Param
    : never;

type ParamsFromPath<Path extends string> = {
  [K in ExtractPathParams<Path>]: string | number;
};

type PathBuilderParams<Path extends string> = {
  path: Path;
  pathParams?: ParamsFromPath<Path>;
  queryParams?: string;
};

type ConstructPlainRoutes<T> = {
  [K in keyof T]: T[K] extends string ? string : T[K] extends object ? ConstructPlainRoutes<T[K]> : T[K];
};

export const pathBuilder = <const Path extends string>(params: PathBuilderParams<Path>): string => {
  let result = params.path;

  for (const [key, value] of Object.entries(params.pathParams ?? {})) {
    result = result.replace(`:${key}`, encodeURIComponent(String(value))) as Path;
  }

  if (params.queryParams) {
    result = `${result}?${params.queryParams}` as Path;
  }

  return result;
};

export const removeReactRoutesParamFromPath = (route: string): string => {
  const firstParamIdx = route.indexOf('/:');

  if (firstParamIdx > -1) {
    route = route.slice(0, firstParamIdx);
  }

  return route;
};

export const constructPlainRoutes = <T extends Record<string, any>>(fullRoutes: T): ConstructPlainRoutes<T> => {
  const plainRoutes = {} as ConstructPlainRoutes<T>;

  for (const featureKey in fullRoutes) {
    plainRoutes[featureKey] = {} as any;

    for (const pageKey in fullRoutes[featureKey]) {
      const value = fullRoutes[featureKey][pageKey];

      if (typeof value === 'string') {
        (plainRoutes[featureKey] as any)[pageKey] = removeReactRoutesParamFromPath(value);
      } else if (typeof value === 'object' && value !== null) {
        (plainRoutes[featureKey] as any)[pageKey] = constructPlainRoutes(value);
      } else {
        (plainRoutes[featureKey] as any)[pageKey] = value;
      }
    }
  }

  return plainRoutes;
};
