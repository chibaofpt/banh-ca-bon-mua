/**
 * app/page.tsx – Entry-only wrapper for the Home route.
 * Following the Pattern Rule: logic and styling are delegated to src/views/HomePage.
 */
import HomePage from '@/src/views/HomePage';

export default function Page() {
  return <HomePage />;
}
