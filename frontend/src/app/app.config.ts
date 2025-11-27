import { ApplicationConfig, provideZoneChangeDetection, inject } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

// HTTP e Interceptor
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './auth.interceptor'; // <--- Importante

// Apollo e GraphQL
import { provideApollo } from 'apollo-angular';
import { HttpLink } from 'apollo-angular/http';
import { InMemoryCache } from '@apollo/client/core';

// Animações e Gráficos
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    
    // ATIVANDO O INTERCEPTOR AQUI:
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor]) 
    ),

    provideApollo(() => {
      const httpLink = inject(HttpLink);
      return {
        link: httpLink.create({ uri: 'http://localhost:8000/graphql' }),
        cache: new InMemoryCache(),
      };
    }),
    provideAnimationsAsync(),
    provideCharts(withDefaultRegisterables())
  ],
};