import { ApplicationConfig, provideZoneChangeDetection, inject } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

// Importações necessárias para conectar com o Python
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideApollo } from 'apollo-angular';
import { HttpLink } from 'apollo-angular/http';
import { InMemoryCache } from '@apollo/client/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),

    // 1. Habilita o cliente HTTP (essencial para o Apollo funcionar)
    provideHttpClient(withFetch()),

    // 2. Configura o Apollo Client
    provideApollo(() => {
      const httpLink = inject(HttpLink);

      return {
        link: httpLink.create({
          // O endereço do seu backend Python (FastAPI/Strawberry)
          uri: 'http://localhost:8000/graphql',
        }),
        // Cache em memória: O Apollo guarda resultados de queries para não
        // precisar ir ao servidor toda vez (deixa o app super rápido)
        cache: new InMemoryCache(),
      };
    }),
    provideAnimationsAsync(),
    provideCharts(withDefaultRegisterables()),
  ],
};