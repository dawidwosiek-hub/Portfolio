import hashlib,json,unittest
from pathlib import Path
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parent.parent
ASSETS=ROOT/'assets/studio-session'
class StudioSession(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.session=json.loads((ASSETS/'session-manifest.json').read_text())
  cls.original=json.loads((ASSETS/'original-hashes.json').read_text())
  cls.dimensions=json.loads((ASSETS/'original-dimensions.json').read_text())
 def test_client_art_is_identical_to_the_pre_session_sources(self):
  for path,expected in self.session['inputs'].items():
   with self.subTest(source=path):
    actual=hashlib.sha256((ROOT/path).read_bytes()).hexdigest();self.assertEqual(actual,expected)
    original=path.replace('assets/studio-session/originals/','public/media/')
    self.assertEqual(actual,self.original[original])
  for path,expected in self.original.items():
   if path.endswith(('.svg','.png')) or path=='public/media/shiro/logo.webp':
    with self.subTest(protected_source=path):self.assertEqual(hashlib.sha256((ROOT/path).read_bytes()).hexdigest(),expected)
 def test_every_reviewed_export_matches_the_manifest_and_existing_size(self):
  for path,record in self.session['exports'].items():
   with self.subTest(export=path):
    p=ROOT/'public/media'/path;self.assertEqual(hashlib.sha256(p.read_bytes()).hexdigest(),record['sha256'])
    if p.suffix!='.webp':continue
    with Image.open(p) as im:
     im.load();self.assertEqual(im.size,(record['width'],record['height']));self.assertEqual(im.format,'WEBP')
     original=self.dimensions.get('public/media/'+path)
     if original:self.assertEqual(im.size,(original['width'],original['height']))
 def test_registered_graphics_cover_the_intended_surface_corners(self):
  for plane in self.session['planes']:
   w,h=plane['source_size'];corners=np.array([[0,0,1],[w,0,1],[w,h,1],[0,h,1]],dtype=float)
   dest=corners@np.array(plane['matrix']).T;dest=dest[:,:2]/dest[:,2,None]
   np.testing.assert_allclose(dest,plane['quad'],atol=.001)
 def test_all_four_covers_share_the_neutral_studio_background(self):
  paths=['podglad/odwroceni-c0ec4c60be97/car-editorial-v2.webp','mockups/shiro-studio-v1.webp','mockups/diverto-studio-v1.webp','mockups/olsen-studio-v1.webp']
  for path in paths:
   with self.subTest(cover=path):
    a=np.asarray(Image.open(ROOT/'public/media'/path).convert('RGB')).astype(float)
    edge=np.concatenate([a[:12,:12].reshape(-1,3),a[:12,-12:].reshape(-1,3)])
    means=edge.mean(axis=0);self.assertGreater(means.mean(),230);self.assertLess(means.max()-means.min(),3)
 def test_review_and_pr_one_are_retained(self):
  self.assertTrue(self.session['quality_review']['completed'])
  homepage=(ROOT/'src/pages/index.astro').read_text();projects=(ROOT/'src/components/Projects.astro').read_text()
  self.assertNotIn('discipline-strip',homepage);self.assertIn('s.deliverables.slice(0,3)',homepage)
  self.assertIn('site.portrait?',homepage);self.assertIn('nth-child(even)',projects)
if __name__=='__main__':unittest.main()
