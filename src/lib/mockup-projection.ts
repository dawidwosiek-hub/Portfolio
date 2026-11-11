export type Point=readonly [number,number];
export type Quad=readonly [Point,Point,Point,Point];

// Project the four corners of the original flat artwork onto a photographed plane.
// The source image itself is never redrawn or resampled in this calculation.
export function projectArtwork(width:number,height:number,target:Quad):number[]{
  if(width<=0||height<=0)throw new Error('Artwork dimensions must be positive.');
  const source:Quad=[[0,0],[width,0],[width,height],[0,height]];
  const rows=source.flatMap(([x,y],i)=>{
    const [u,v]=target[i];
    return [[x,y,1,0,0,0,-u*x,-u*y,u],[0,0,0,x,y,1,-v*x,-v*y,v]];
  });
  for(let col=0;col<8;col++){
    let pivot=col;
    for(let row=col+1;row<8;row++)if(Math.abs(rows[row][col])>Math.abs(rows[pivot][col]))pivot=row;
    if(Math.abs(rows[pivot][col])<1e-10)throw new Error('The photographed artwork plane is degenerate.');
    [rows[col],rows[pivot]]=[rows[pivot],rows[col]];
    const factor=rows[col][col];
    for(let i=col;i<=8;i++)rows[col][i]/=factor;
    for(let row=0;row<8;row++)if(row!==col){
      const multiplier=rows[row][col];
      for(let i=col;i<=8;i++)rows[row][i]-=multiplier*rows[col][i];
    }
  }
  const [a,b,c,d,e,f,g,h]=rows.map(row=>row[8]);
  return [a,d,0,g,b,e,0,h,0,0,1,0,c,f,0,1];
}

export function artworkTransform(width:number,height:number,target:Quad):string{
  return `matrix3d(${projectArtwork(width,height,target).map(value=>Number(value.toPrecision(14))).join(',')})`;
}
