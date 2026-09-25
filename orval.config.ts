import { defineConfig } from 'orval'

export default defineConfig({
  viaplena: {
    input: {
      target: process.env.VIAPLENA_OPENAPI_URL ?? 'http://localhost:3000/openapi.json',
    },
    output: {
      mode: 'tags-split',
      target: './src/api/generated',
      schemas: './src/api/generated/models',
      client: 'react-query',
      httpClient: 'fetch',
      override: {
        mutator: { path: './src/api/fetcher.ts', name: 'viaplenaFetcher' },
        query: { useQuery: true, signal: true },
        operations: {
          findPoisNearby: {
            query: { useInfinite: true, useInfiniteQueryParam: 'cursor' },
          },
          searchPois: {
            query: { useInfinite: true, useInfiniteQueryParam: 'cursor' },
          },
          findPoisByCommune: {
            query: { useInfinite: true, useInfiniteQueryParam: 'cursor' },
          },
          findPoisByDepartment: {
            query: { useInfinite: true, useInfiniteQueryParam: 'cursor' },
          },
        },
      },
    },
  },
})
