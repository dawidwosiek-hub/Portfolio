import type {APIRoute} from 'astro';
export const GET:APIRoute=()=>{const url=process.env.SITE_URL||import.meta.env.SITE_URL;return new Response(url?`User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${url.replace(/\/$/,'')}/sitemap.xml\n`:'User-agent: *\nDisallow: /\n',{headers:{'Content-Type':'text/plain'}});};
