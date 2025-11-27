import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // 1. Tenta pegar o token salvo no navegador
  const token = localStorage.getItem('token');

  // 2. Se o token existir, clona a requisição e adiciona o cabeçalho Authorization
  if (token) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(authReq);
  }

  // 3. Se não tiver token, deixa a requisição passar normal (ex: Login)
  return next(req);
};