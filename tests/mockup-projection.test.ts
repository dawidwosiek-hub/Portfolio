import {test} from 'node:test';
import assert from 'node:assert/strict';
import {projectArtwork} from '../src/lib/mockup-projection';
import {portfolioMockups} from '../src/lib/portfolio-mockups';

test('all four original artwork corners meet their photographed corners',()=>{
  for(const scene of Object.values(portfolioMockups))for(const layer of scene.layers){
    const m=projectArtwork(layer.width,layer.height,layer.quad);
    const corners=[[0,0],[layer.width,0],[layer.width,layer.height],[0,layer.height]];
    corners.forEach(([x,y],i)=>{
      const denominator=m[3]*x+m[7]*y+m[15];
      const u=(m[0]*x+m[4]*y+m[12])/denominator;
      const v=(m[1]*x+m[5]*y+m[13])/denominator;
      assert.ok(Math.abs(u-layer.quad[i][0])<.001,`${layer.src} corner ${i}: x`);
      assert.ok(Math.abs(v-layer.quad[i][1])<.001,`${layer.src} corner ${i}: y`);
    });
  }
});
