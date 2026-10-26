import type {APIRoute} from 'astro';
import html from '../../previews/odwroceni.html?raw';

// Unlisted review only. This does not add a published portfolio project.
export const GET:APIRoute = () => new Response(html, {
  headers: {
    'Content-Type': 'text/html; charset=utf-8',
    'X-Robots-Tag': 'noindex, nofollow, noarchive',
    'Cache-Control': 'private, no-store',
    'Referrer-Policy': 'no-referrer',
  },
});
