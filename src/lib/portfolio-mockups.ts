import type {Quad} from './mockup-projection';
export type MockupLayer={src:string;width:number;height:number;quad:Quad;blend:'multiply'|'screen';disc?:boolean;occlusion?:string};
export type PortfolioMockup={base:string;alt:string;layers:MockupLayer[]};

// Points refer to the 1536×1024 studio photographs. Original artwork files stay intact.
const cdOcclusion=`data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1536" height="1024"><rect width="1536" height="1024" fill="white"/><ellipse cx="1166" cy="566" rx="323" ry="342" fill="black"/></svg>')}`;
export const portfolioMockups:Record<string,PortfolioMockup>={
  shiro:{base:'/media/mockups/sources/shiro-studio.png',alt:'Wizualizacja oryginalnych wizytówek SHIRO na białej powierzchni, obok czarnego kluczyka samochodowego.',layers:[
    {src:'/media/shiro/car-rental-source.png',width:1110,height:638,quad:[[107,470],[834,562],[773,971],[42,878]],blend:'multiply'},
    {src:'/media/shiro/mechanic-source.png',width:1110,height:638,quad:[[781,74],[1492,226],[1403,640],[686,487]],blend:'multiply'},
  ]},
  diverto:{base:'/media/mockups/sources/diverto-studio.png',alt:'Wizualizacja opakowania i płyty CD Diverto z oryginalną okładką oraz nadrukiem, w jasnym studiu.',layers:[
    {src:'/media/diverto/okladka-1536.webp',width:1536,height:1536,quad:[[187,143],[891,163],[888,861],[190,895]],blend:'multiply',occlusion:cdOcclusion},
    {src:'/media/diverto/nadruk-plyty-1536.webp',width:1536,height:1536,quad:[[850,229],[1483,229],[1483,901],[850,901]],blend:'multiply',disc:true},
  ]},
  olsen:{base:'/media/mockups/sources/olsen-studio.png',alt:'Wizualizacja czarnej kurtki OLSEN ułożonej na białym podeście, z oryginalnym projektem haftu na plecach.',layers:[
    {src:'/media/olsen/haft-tyl.png',width:1020,height:538,quad:[[551,270],[859,226],[884,389],[575,433]],blend:'screen'},
  ]},
};
