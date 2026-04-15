import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  // поддерживаемые языки
  locales: ['ua', 'ru', 'en'],

  // язык по умолчанию
  defaultLocale: 'ua'
});

export const config = {
  // перехватываем все страницы, кроме служебных (_next, api, статика, studio)
  matcher: ['/((?!_next|api|studio|[^?]*\\.(?:jpg|jpeg|gif|svg|png|webp|ico|css|js)).*?)']
};