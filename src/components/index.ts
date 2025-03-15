// src/components/index.ts
// Central export file for all components

//Layout
export { default as NavBar } from './layout/Navbar';
export { default as Footer } from './layout/Footer';
export { default as ScrollToTop } from './layout/ScrollToTop';
export { default as ToggleTheme } from './layout/ToggleTheme';

//Cards
export { default as CardServer } from './ui/Cards/SanityCards/AllCards/CardServer';
export { default as CardClient } from './ui/Cards/SanityCards/AllCards/CardClient';

//CategoryCard
export { default as CategoryCardServer } from './ui/Cards/SanityCards/Category/CategoryCardServer';
export { default as CategoryCardClient } from './ui/Cards/SanityCards/Category/CategoryCardClient';

//Weather
export { default as WeatherServer } from './ui/WeatherStats/WeatherServer';
export { default as WeatherClient } from './ui/WeatherStats/WeatherClient';

//Breadcrumbs
export { default as SlugBreadcrumb } from './ui/Breadcrumbs/SlugBreadcrumb';

//ShareButton
export { default as SlugShareButton } from './ui/ShareButtons/SlugShareButton';

//Modals
export { default as ImageModal } from './ui/Modals/ImageModal';