import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
export default defineConfig({ output: 'server', adapter: node({ mode: 'standalone' }), site: process.env.SITE_URL || undefined, server: { host: '0.0.0.0' } });
