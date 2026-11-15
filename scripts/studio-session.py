"""Compose exact client rasters onto blank photographed products.

Render to staging first. Review contact sheets before running --apply.
Requires Pillow, numpy, scipy and opencv-python-headless. No model receives art.
"""
from pathlib import Path
import argparse, hashlib, json, math, shutil, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps
from scipy.ndimage import gaussian_filter
try:
    import cv2
except ImportError:
    sys.path.insert(0, '/tmp/nadx-image-libs')
    import cv2

ROOT=Path(__file__).resolve().parent.parent
ASSETS=ROOT/'assets/studio-session'
PUBLIC=ROOT/'public/media'
STAGE=Path('/tmp/nadx-studio-staging')
DIM=json.loads((ASSETS/'original-dimensions.json').read_text())
PRESET={'background':'#f0f0f0','range':['#ececec','#f4f4f4'],'white_balance_kelvin':5500,'light':'large softbox upper-left','shadow':'neutral contact, down-right','apparel_camera':'90-degree overhead','paper_camera':'fixed photographed surface per product family','artwork':'original raster only; homography, screen/multiply, low-amplitude fabric displacement'}
INPUTS={};PLANES=[];SCENES={};EXPORTS={}
def source(name):
    snapshot=ASSETS/'originals'/name
    p=snapshot if snapshot.exists() else PUBLIC/name
    INPUTS[str(p.relative_to(ROOT))]=hashlib.sha256(p.read_bytes()).hexdigest()
    return Image.open(p).convert('RGBA')
def base(name,protect=()):
    im=Image.open(ASSETS/'bases'/f'{name}.png').convert('RGB')
    a=np.asarray(im).astype(np.float32)
    lum=a.mean(axis=2);weight=np.clip((lum-110)/70,0,1)
    target=np.clip(240+.25*(lum-240),236,244)
    mask=Image.new('L',im.size)
    draw=ImageDraw.Draw(mask)
    for quad in protect:draw.polygon([tuple(p) for p in quad],fill=255)
    weight*=1-np.asarray(mask)/255
    # Calibrate blank scenes only; never globally grade the placed artwork.
    a=a*(1-weight[:,:,None])+target[:,:,None]*weight[:,:,None]
    return Image.fromarray(np.uint8(np.clip(a,0,255)))
def fit(im,size):
    if im.size==size:return im.copy()
    return ImageOps.pad(im,size,method=Image.Resampling.LANCZOS,color=(240,240,240),centering=(.5,.5))
def warp(art,quad,size):
    w,h=art.size
    src=np.array([[0,0],[w,0],[w,h],[0,h]],dtype=np.float32)
    dst=np.array(quad,dtype=np.float32)
    matrix=cv2.getPerspectiveTransform(src,dst)
    PLANES.append({'source_size':[w,h],'quad':quad,'matrix':matrix.tolist()})
    return cv2.warpPerspective(np.asarray(art),matrix,size,flags=cv2.INTER_CUBIC,borderMode=cv2.BORDER_CONSTANT)
def place(im,art,quad,blend='multiply',cloth=False,embroidery=False,occlusion=None):
    bg=np.asarray(im).astype(np.float32)
    layer=warp(art,quad,im.size).astype(np.float32)
    if cloth:
        lum=bg.mean(axis=2)
        folds=gaussian_filter(lum,3)-gaussian_filter(lum,24)
        dx=np.clip(gaussian_filter(folds,2)*.055,-1.25,1.25)
        dy=np.clip(gaussian_filter(folds,3)*.035,-.9,.9)
        yy,xx=np.mgrid[:im.height,:im.width].astype(np.float32)
        layer=cv2.remap(layer,xx+dx.astype(np.float32),yy+dy.astype(np.float32),cv2.INTER_CUBIC,borderMode=cv2.BORDER_CONSTANT)
        shade=np.clip(1+folds*.007,.84,1.05)
        if embroidery:
            # Shading of the existing thread image, not a replacement of its design.
            shade*=.965+.035*np.cos((xx+yy*.26)*math.pi)
        layer[:,:,:3]*=shade[:,:,None]
    alpha=np.clip(layer[:,:,3:4]/255,0,1)
    fg=np.clip(layer[:,:,:3],0,255)
    if blend=='screen':fg=255-(255-bg)*(255-fg)/255
    elif blend=='multiply':fg=bg*fg/255
    if occlusion is not None:alpha*=np.asarray(occlusion)[:,:,None]/255
    return Image.fromarray(np.uint8(np.clip(bg*(1-alpha)+fg*alpha,0,255)))
def box(x,y,w,h):return [[x,y],[x+w,y],[x+w,y+h],[x,y+h]]
def remember(name,im):
    SCENES[name]=im.convert('RGB');(STAGE/'scenes').mkdir(parents=True,exist_ok=True)
    im.convert('RGB').save(STAGE/'scenes'/f'{name}.png')
    return im
def export(name,files):
    im=SCENES[name]
    for rel in files:
        rel=str(rel)
        old=DIM.get('public/media/'+rel)
        if not old:raise ValueError('Missing original dimensions: '+rel)
        dest=STAGE/'public/media'/rel;dest.parent.mkdir(parents=True,exist_ok=True)
        rendered=(ImageOps.fit(im,(old['width'],old['height']),method=Image.Resampling.LANCZOS) if name in ['shiro-mechanic','shiro-rental','shiro-voucher-front','shiro-voucher-rewers','shiro-znak'] else fit(im,(old['width'],old['height'])))
        rendered.save(dest,'WEBP',quality=94,method=6)
        EXPORTS[rel]={'scene':name,'width':old['width'],'height':old['height'],'sha256':hashlib.sha256(dest.read_bytes()).hexdigest()}
def matching(folder,prefixes):
    return [str(p.relative_to(PUBLIC)) for p in (PUBLIC/folder).glob('*.webp') if any(p.name.startswith(prefix) for prefix in prefixes)]
def paper(art):
    q=[[445,55],[1236,205],[1080,925],[259,767]]
    return place(base('paper',[q]),art,q)
def paper_board(art):
    # Place source drawings/photographs as real printed documentation, without
    # redrawing their lettering or claiming that a visualization is a photo.
    q=[[170,210],[1425,322],[1373,813],[110,704]]
    canvas=Image.new('RGBA',(2280,1000),(245,245,245,255))
    fitted=ImageOps.contain(art,(2180,900),method=Image.Resampling.LANCZOS)
    canvas.alpha_composite(fitted,((2280-fitted.width)//2,(1000-fitted.height)//2))
    # A calibrated paper face over the photographed card retains real thickness.
    return place(base('single-voucher',[q]),canvas,q,blend='multiply')

def render():
    # Clothing: same camera and physical bases for every brand.
    garment={
      'kurtka':('jacket',box(476,296,122,38),box(1005,314,294,155)),
      'bluza':('hoodie',box(478,440,120,38),box(1004,400,294,155)),
      'koszulka':('tshirt',box(484,340,118,37),box(1005,283,312,163)),
    }
    for kind,(blank,front,back) in garment.items():
        dtf=kind=='koszulka'
        for variant in ([1,2] if dtf else [1]):
            im=base(blank)
            im=place(im,source('olsen/dtf-przod.png' if dtf else 'olsen/haft-przod.png'),front,blend='normal' if dtf else 'screen',cloth=True,embroidery=not dtf)
            rear='olsen/dtf-tyl-alternatywa.png' if variant==2 else ('olsen/dtf-tyl.png' if dtf else 'olsen/haft-tyl.png')
            im=place(im,source(rear),back,blend='normal' if dtf else 'screen',cloth=True,embroidery=not dtf)
            name=f'olsen-{kind}'+('-02' if variant==2 else '')
            remember(name,im)
        export('olsen-'+kind,matching('olsen',[kind+'-baza-']))
    cap=place(base('cap'),source('olsen/haft-czapka.png'),[[521,390],[874,428],[848,542],[510,504]],blend='screen',cloth=True,embroidery=True)
    remember('olsen-czapka',cap);export('olsen-czapka',matching('olsen',['czapka-baza-']))
    export('olsen-kurtka',matching('mockups',['olsen-studio-v1']))
    export('olsen-kurtka',matching('olsen',['ulozenie-','prezentacja-']))
    # Source SVGs remain available unchanged through fullSrc; on-page raster
    # thumbnails now show the exact design on real fabric rather than templates.
    for prefix,scene in [('kurtka-projekt-','olsen-kurtka'),('bluza-projekt-','olsen-bluza'),('czapka-projekt-','olsen-czapka'),('koszulka-dtf-projekt-','olsen-koszulka'),('koszulka-dtf-alternatywa-projekt-','olsen-koszulka-02')]:
        export(scene,matching('olsen',[prefix]))
    for kind,blank,point,dims in [('koszulka','tshirt',(345,345,110,48),(1145,1374)),('bluza','hoodie',(345,528,110,48),(1131,1391))]:
        im=place(base(blank),source('shiro/logo.webp'),box(*point),blend='screen',cloth=True)
        front=fit(im.crop((0,0,768,1024)),dims)
        remember('shiro-'+kind,front)
        export('shiro-'+kind,matching('shiro',[kind+'-studio-',kind+'-cutout-',kind+'-poster']))
    # A two-product apparel scene with a soft blend between neutral floors.
    left=fit(SCENES['shiro-bluza'],(768,1024));right=fit(SCENES['shiro-koszulka'],(768,1024))
    pair=Image.new('RGB',(1536,1024),(240,240,240));pair.paste(left,(0,0));pair.paste(right,(768,0))
    remember('shiro-odziez',pair);export('shiro-odziez',matching('shiro',['shiro-apparel-scene']))

    # Business cards: original lossless client source images.
    qa=[[107,470],[834,562],[773,971],[42,878]]
    qb=[[781,74],[1492,226],[1403,640],[686,487]]
    cards=place(base('shiro-legacy',[qa,qb]),source('shiro/car-rental-source.png'),qa)
    cards=place(cards,source('shiro/mechanic-source.png'),qb)
    remember('shiro-wizytowki',cards)
    export('shiro-wizytowki',matching('mockups',['shiro-studio-v1']))
    export('shiro-wizytowki',matching('shiro',['wizytowki-','shiro-brand-scene']))
    # Reusable close-ups keep exactly the same photographed camera angle.
    for name,src in [('shiro-mechanic','mechanic-source.png'),('shiro-rental','car-rental-source.png')]:
        q=[[211,177],[1380,286],[1316,866],[140,761]]
        im=place(base('single-card',[q]),source('shiro/'+src),q)
        remember(name,im)
    export('shiro-mechanic',matching('shiro',['mechanic-','detal-']))
    export('shiro-rental',matching('shiro',['car-rental-']))

    qf=[[204,425],[1074,601],[992,994],[58,796]]
    qr=[[635,58],[1434,263],[1334,617],[484,382]]
    voucherbase=base('voucher',[qf,qr])
    front=source('shiro/voucher-front-1536.webp');rear=source('shiro/voucher-rewers-1536.webp')
    vouchers=place(place(voucherbase,front,qf),rear,qr)
    remember('shiro-vouchery',vouchers)
    export('shiro-vouchery',matching('shiro',['voucher-mockup-','voucher-cutout-']))
    for side,art in [('front',front),('rewers',rear)]:
        q=[[170,210],[1425,322],[1373,813],[110,704]]
        im=place(base('single-voucher',[q]),art,q)
        remember('shiro-voucher-'+side,im)
        export('shiro-voucher-'+side,matching('shiro',['voucher-'+side+'-']))

    qs1=[[133,483],[950,589],[948,919],[79,831]];qs2=[[655,99],[1443,233],[1402,556],[561,425]]
    stickers=place(base('stickers',[qs1,qs2]),source('shiro/naklejka-projekt-1536.webp'),qs2)
    keep=Image.new('L',stickers.size,255);d=ImageDraw.Draw(keep);d.polygon([(841,918),(950,800),(990,952)],fill=0)
    stickers=place(stickers,source('shiro/naklejka-projekt-1536.webp'),qs1,occlusion=keep)
    remember('shiro-naklejki',stickers);export('shiro-naklejki',matching('shiro',['naklejki-']))
    qbanner=[[76,130],[1425,190],[1417,758],[77,808]]
    art=source('shiro/baner-cutout-1536.webp').crop((91,177,1442,828));art.putalpha(255)
    banner=place(base('banner',[qbanner]),art,qbanner,cloth=True)
    remember('shiro-baner',banner);export('shiro-baner',matching('shiro',['baner-']))
    flags=base('flags')
    flagart=source('shiro/flagi-cutout-1536.webp')
    for crop,quad in [((486,26,755,870),box(474,112,180,565)),((871,74,1110,798),box(894,206,174,527))]:
        art=flagart.crop(crop);arr=np.asarray(art).copy();lum=arr[:,:,:3].mean(axis=2)
        white=np.clip((lum-65)/60,0,1)
        red=np.clip((arr[:,:,0].astype(float)-np.maximum(arr[:,:,1],arr[:,:,2])-25)/80,0,1)
        arr[:,:,3]=np.uint8(np.maximum(white,red)*255);art=Image.fromarray(arr)
        flags=place(flags,art,quad,blend='screen',cloth=True)
    remember('shiro-flagi',flags);export('shiro-flagi',matching('shiro',['flagi-']))

    # The concept shoe uses ONLY red elements extracted from the original board.
    shoe=base('shoe');shoeart=source('shiro/obuwie-projekt-1536.webp')
    for crop,quad in [((276,145,485,367),[[778,463],[947,428],[981,635],[804,651]]),((486,138,874,306),[[997,422],[1395,458],[1404,657],[1009,658]]),((464,371,616,405),[[746,746],[915,748],[916,788],[746,787]])]:
        art=shoeart.crop(crop);arr=np.asarray(art).copy();red=arr[:,:,0].astype(float)-np.maximum(arr[:,:,1],arr[:,:,2])
        alpha=np.where(red>35,255,0).astype('uint8')
        if crop[0]==276:
            count,components,stats,_=cv2.connectedComponentsWithStats(alpha,8)
            if count>1:alpha=np.uint8(components==(1+np.argmax(stats[1:,cv2.CC_STAT_AREA])))*255
        if crop[0]==486:alpha[arr[:,:,0]>165]=0
        arr[:,:,3]=alpha;art=Image.fromarray(arr)
        shoe=place(shoe,art,quad,blend='screen',cloth=True)
    remember('shiro-obuwie',shoe);export('shiro-obuwie',matching('shiro',['obuwie-cutout-','obuwie-mockup-']))
    mark=Image.new('RGBA',(2280,1000),(0,0,0,255));logo=source('shiro/logo.webp');logo.thumbnail((1840,805),Image.Resampling.LANCZOS);mark.alpha_composite(logo,((2280-logo.width)//2,(1000-logo.height)//2))
    brand=place(base('brand'),mark,[[178,158],[1439,293],[1373,877],[56,727]],blend='screen')
    remember('shiro-znak',brand);export('shiro-znak',matching('shiro',['shiro-mark-presentation-']))
    remember('shiro-obuwie-projekt',paper_board(source('shiro/obuwie-projekt-1536.webp')))
    export('shiro-obuwie-projekt',matching('shiro',['obuwie-projekt-']))

    # Diverto: real jewel case and disc, then a consistent series of paper inserts.
    qc=[[187,143],[891,163],[888,861],[190,895]];qd=[[850,229],[1483,229],[1483,901],[850,901]]
    cd=base('diverto-legacy',[qc])
    occlusion=Image.new('L',cd.size,255);ImageDraw.Draw(occlusion).ellipse((843,224,1489,908),fill=0)
    cd=place(cd,source('diverto/okladka-1536.webp'),qc,occlusion=occlusion)
    disc=source('diverto/nadruk-plyty-1536.webp');mask=Image.new('L',disc.size,0);d=ImageDraw.Draw(mask);d.ellipse((0,0,disc.width,disc.height),fill=255);d.ellipse((disc.width*.435,disc.height*.435,disc.width*.565,disc.height*.565),fill=0);disc.putalpha(mask)
    cd=place(cd,disc,qd)
    remember('diverto-cd',cd);export('diverto-cd',matching('mockups',['diverto-studio-v1']));export('diverto-cd',matching('diverto',['album-preview-']))
    for key in ['okladka','wkladka','wkladka-foto','tyl']:
        remember('diverto-'+key,paper(source('diverto/'+key+'-1536.webp')))
        export('diverto-'+key,matching('diverto',[key+'-']))
    remember('diverto-nadruk',cd.crop((800,165,1536,960)))
    export('diverto-nadruk',matching('diverto',['nadruk-plyty-']))
    qroll=[[243,111],[778,125],[766,1350],[243,1372]]
    roll=place(base('rollup',[qroll]),source('diverto/rollup-1024.webp'),qroll)
    remember('diverto-rollup',roll);export('diverto-rollup',matching('diverto',['rollup-']))
    render_boat()

def render_boat():
    # The supplied boat visualization is clipped with its existing traced SVG
    # contour. No generative model ever receives the boat or its graphics.
    import re
    prefix='podglad/odwroceni-c0ec4c60be97/'
    board=source(prefix+'7ca20eaf1de896b5.webp')
    svg=(ROOT/'src/components/ProcessArtwork.astro').read_text()
    path=re.search(r'"boat-side-1":\s*\{.*?"path":\s*"([^"]+)"',svg,re.S).group(1)
    mask=Image.new('L',(board.width*4,board.height*4));draw=ImageDraw.Draw(mask)
    for i,part in enumerate(re.split('[Mm]',path)[1:]):
        values=[float(v) for v in re.findall(r'[-+]?\d+(?:\.\d+)?',part)]
        points=[(values[j]*4,values[j+1]*4) for j in range(0,len(values)-1,2)]
        draw.polygon(points,fill=255 if i==0 else 0)
    mask=mask.resize(board.size,Image.Resampling.LANCZOS);board.putalpha(mask)
    cut=board.crop((169,0,1174,308)).resize((1370,420),Image.Resampling.LANCZOS)
    studio=base('cradle').convert('RGBA')
    shadow=Image.new('RGBA',studio.size);d=ImageDraw.Draw(shadow)
    for x in [430,1100]:d.ellipse((x-82,824,x+82,842),fill=(0,0,0,75))
    studio.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(3)))
    studio.alpha_composite(cut,(72,441))
    centered=Image.new('RGB',studio.size,(240,240,240))
    centered.paste(studio.convert('RGB').crop((0,150,1536,1024)),(0,0))
    # Extend the empty floor below the photographed supports, keeping the whole
    # original vessel and both grounded stands inside a balanced 3:2 frame.
    arr=np.asarray(centered).astype(np.float32)
    for y in range(830,874):arr[y]=arr[y]*(874-y)/44+240*(y-830)/44
    remember('odwroceni-lodz',Image.fromarray(np.uint8(arr)))
    prefix='podglad/odwroceni-c0ec4c60be97/'
    # Existing image URLs and dimensions are retained for links and srcsets.
    old=[prefix+n for n in ['car-editorial.webp','car-editorial-768.webp','car-editorial-v2.webp','car-editorial-v2-768.webp','boat-editorial.webp','boat-editorial-768.webp','4b5f6b859d6711d2.webp','e23af0a43f72a1bd.webp']]
    export('odwroceni-lodz',old)
    # Preserve complete original photos in the archival snapshots; their on-page
    # images are photographed paper documentation in the same neutral session.
    for name,rel in [('odwroceni-warsztat','027b65612a4f2c46.webp'),('odwroceni-wieczor','1aac2f448138e211.webp')]:
        remember(name,paper_board(source(prefix+rel)));export(name,[prefix+rel])
    board=source(prefix+'7ca20eaf1de896b5.webp')
    remember('odwroceni-plansza',paper_board(board));export('odwroceni-plansza',[prefix+'7ca20eaf1de896b5.webp'])
    export('odwroceni-plansza',['odwroceni/studium-kompozycji.webp','odwroceni/studium-kompozycji-768.webp'])
    export('odwroceni-plansza',[prefix+name for name in ['291471adb95d004b.webp','34466a320568d7f2.webp','5803fdff66dfeb7a.webp','a58e5435d09e35f7.webp','33cabfdab9bfcbd1.webp']])
    for name,crop in [('odwroceni-burta',(169,0,1174,308)),('odwroceni-druga-burta',(106,698,1111,1005)),('odwroceni-rufa',(381,323,885,674))]:
        remember(name,paper_board(board.crop(crop)))
        rel='odwroceni/'+name+'.webp'
        for w in [1536,768]:
            f=rel if w==1536 else rel.replace('.webp','-768.webp')
            DIM['public/media/'+f]={'width':w,'height':round(w/1.5)}
            export(name,[f])

def review():
    covers=['odwroceni-lodz','shiro-wizytowki','diverto-cd','olsen-kurtka']
    names=[n for n in covers if n in SCENES]+[n for n in SCENES if n not in covers];cols=4;cw,ch=500,392
    font_path='/usr/share/fonts/truetype/open-sans/OpenSans-Regular.ttf'
    font=ImageFont.truetype(font_path,18);title=ImageFont.truetype(font_path,26)
    sheet=Image.new('RGB',(cols*cw,100+math.ceil(len(names)/cols)*ch),(240,240,240));draw=ImageDraw.Draw(sheet)
    draw.text((24,15),'NADX / WSPÓLNA SESJA PRODUKTOWA',font=title,fill='#111')
    draw.text((24,60),'Oryginalne grafiki · neutralne studio · światło z lewej-góry · arkusz przed podmianą plików',font=font,fill='#444')
    for i,name in enumerate(names):
        x=i%cols*cw;y=100+i//cols*ch
        thumb=fit(SCENES[name],(484,338));sheet.paste(thumb,(x+8,y))
        draw.text((x+12,y+345),f'{i+1:02d} / {name}',font=font,fill='#111')
    dest=STAGE/'arkusz-kontrolny.jpg';sheet.save(dest,quality=94)
    (STAGE/'manifest.json').write_text(json.dumps({'preset':PRESET,'inputs':INPUTS,'planes':PLANES,'exports':EXPORTS,'scenes':names},indent=2)+'\n')
    images=sum(p.endswith('.webp') for p in EXPORTS);print(f'{len(names)} scenes, {images} WebP exports, {len(EXPORTS)-images} films; review: {dest}')

def apply():
    report=json.loads((STAGE/'manifest.json').read_text())
    seal=STAGE/'REVIEWED'
    digest=hashlib.sha256((STAGE/'manifest.json').read_bytes()).hexdigest()
    if not seal.exists() or seal.read_text().strip()!=digest:raise SystemExit('Review the contact sheet, then seal the current manifest SHA-256 in staging/REVIEWED. A new render invalidates the old review.')
    if not report.get('quality_review',{}).get('completed'):raise SystemExit('Record the completed visual review in the staging manifest before applying.')
    for rel,data in report['exports'].items():
        staged=STAGE/'public/media'/rel
        if hashlib.sha256(staged.read_bytes()).hexdigest()!=data['sha256']:raise SystemExit('Changed staged file: '+rel)
        shutil.copy2(staged,PUBLIC/rel)
    out=ROOT/'public/media/studio-review';out.mkdir(parents=True,exist_ok=True)
    shutil.copy2(STAGE/'arkusz-kontrolny.jpg',out/'arkusz-kontrolny.jpg')
    (ASSETS/'session-manifest.json').write_text(json.dumps(report,indent=2)+'\n')
    print('Applied',len(report['exports']),'reviewed exports.')

def finish_review():
    previous=json.loads((STAGE/'manifest.json').read_text())
    INPUTS.update(previous['inputs']);PLANES.extend(previous['planes']);EXPORTS.update(previous['exports'])
    for name in previous['scenes']:SCENES[name]=Image.open(STAGE/'scenes'/f'{name}.png').convert('RGB')
    candidates=[p for p in (STAGE/'public/media/nadx').glob('portfolio-cinematic-v2*')]
    candidates+=[STAGE/'public/media/podglad/odwroceni-c0ec4c60be97/odwroceni-story.mp4']
    for p in candidates:
        if not p.is_file():continue
        rel=str(p.relative_to(STAGE/'public/media'))
        if p.suffix=='.webp':
            im=Image.open(p);dimensions={'width':im.width,'height':im.height}
            if p.name=='portfolio-cinematic-v2-poster.webp':remember('portfolio-film',im.convert('RGB'))
        else:dimensions={'kind':'film'}
        EXPORTS[rel]={'scene':'portfolio-film' if rel.startswith('nadx/') else 'odwroceni-film',**dimensions,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
    review()

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--apply',action='store_true');parser.add_argument('--finish-review',action='store_true');args=parser.parse_args()
    if args.apply:apply()
    elif args.finish_review:finish_review()
    else:render();review()
