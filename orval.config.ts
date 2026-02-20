import { defineConfig } from 'orval';

export default defineConfig({
  prixCarburants: {
    input: {
      target: 'https://api.prix-carburants.2aaz.fr/swagger.yaml',
    },
    output: {
      target: './src/api/endpoints.ts',
      schemas: './src/api/models',
      client: 'react-query',
      httpClient: 'fetch',
      baseUrl: 'https://api.prix-carburants.2aaz.fr',
    },
  },
});
