import type {APIRoute} from 'astro';
import {handleStudio} from '../../lib/vertex-studio';
export const prerender=false;
export const ALL:APIRoute=({request})=>handleStudio(request);
