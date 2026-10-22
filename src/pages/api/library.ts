import type {APIRoute} from 'astro';
import {handleLibrary} from '../../lib/drive-library';
export const prerender=false;
export const ALL:APIRoute=({request})=>handleLibrary(request);
