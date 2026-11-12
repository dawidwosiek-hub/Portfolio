"""Render the owner's SVG as a physical 3D identity, preserving the vector outlines.

blender -b --factory-startup --python scripts/render-nadx-motion.py -- --preview
blender -b --factory-startup --python scripts/render-nadx-motion.py -- --output /tmp/nadx-motion
"""
import argparse
import math
import re
import sys
import time
import xml.etree.ElementTree as ET
from pathlib import Path

import bpy
from mathutils import Vector

args_parser = argparse.ArgumentParser()
args_parser.add_argument('--output', default='/tmp/nadx-motion-final')
args_parser.add_argument('--preview', action='store_true')
args_parser.add_argument('--samples', type=int, default=8)
args_parser.add_argument('--engine', choices=['eevee','cycles'], default='eevee')
args_parser.add_argument('--frames', type=int, default=96)
args_parser.add_argument('--preview-count', type=int, default=1)
args_parser.add_argument('--width', type=int, default=800)
args_parser.add_argument('--height', type=int, default=700)
args = args_parser.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else [])
root_dir = Path(__file__).resolve().parent.parent
out = Path(args.output)
out.mkdir(parents=True, exist_ok=True)


def line(a, b):
    return (a, (a[0] + (b[0]-a[0])/3, a[1] + (b[1]-a[1])/3),
            (b[0] + (a[0]-b[0])/3, b[1] + (a[1]-b[1])/3), b)


def svg_contours(data):
    tokens = re.findall(r'[a-zA-Z]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?', data)
    contours, segments, current, start = [], [], (0., 0.), (0., 0.)
    command, index = None, 0
    while index < len(tokens):
        if tokens[index].isalpha():
            command = tokens[index]
            index += 1
        if command.lower() == 'z':
            if current != start:
                segments.append(line(current, start))
            if segments:
                contours.append(segments)
            segments, current, command = [], start, None
            continue
        count = {'m': 2, 'l': 2, 'c': 6, 'h': 1, 'v': 1}.get(command.lower())
        if count is None:
            raise ValueError(f'Unsupported source SVG command: {command}')
        values = [float(value) for value in tokens[index:index+count]]
        index += count
        relative = command.islower()
        def point(x, y):
            return (x + current[0], y + current[1]) if relative else (x, y)
        if command.lower() == 'm':
            if segments:
                raise ValueError('Expected a closed source contour.')
            current = point(*values)
            start = current
            command = 'l' if relative else 'L'
        elif command.lower() == 'c':
            p1, p2, end = point(*values[:2]), point(*values[2:4]), point(*values[4:])
            segments.append((current, p1, p2, end))
            current = end
        else:
            if command.lower() == 'h':
                end = (current[0]+values[0] if relative else values[0], current[1])
            elif command.lower() == 'v':
                end = (current[0], current[1]+values[0] if relative else values[0])
            else:
                end = point(*values)
            segments.append(line(current, end))
            current = end
    return contours


def look_at(obj, target):
    obj.rotation_euler = (Vector(target)-obj.location).to_track_quat('-Z', 'Y').to_euler()


def material(name, color, metallic=0., roughness=.3, coat=.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = (*color, 1.)
    shader.inputs['Metallic'].default_value = metallic
    shader.inputs['Roughness'].default_value = roughness
    shader.inputs['Coat Weight'].default_value = coat
    shader.inputs['Coat Roughness'].default_value = .22
    return mat


def rounded_box(name, dimensions, z, mat, bevel, parent):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, z))
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = dimensions
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    modifier = obj.modifiers.new('Machined edge', 'BEVEL')
    modifier.width, modifier.segments = bevel, 6
    obj.modifiers.new('Weighted corner normals', 'WEIGHTED_NORMAL')
    for face in obj.data.polygons:
        face.use_smooth = True
    obj.data.materials.append(mat)
    obj.parent = parent
    return obj


bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
scene = bpy.context.scene
scene.render.engine = 'CYCLES' if args.engine=='cycles' else 'BLENDER_EEVEE_NEXT'
if args.engine=='eevee':
    scene.eevee.taa_render_samples=args.samples
    scene.eevee.use_raytracing=False
scene.cycles.device = 'CPU'
scene.cycles.samples = args.samples
scene.cycles.use_denoising = bool(getattr(bpy.app.build_options, 'openimagedenoise', False))
scene.cycles.use_adaptive_sampling = True
scene.cycles.adaptive_threshold = .035
scene.cycles.adaptive_min_samples = 16
scene.cycles.max_bounces = 6
scene.cycles.diffuse_bounces = 2
scene.cycles.glossy_bounces = 4
scene.cycles.seed = 12
scene.render.threads_mode = 'FIXED'
scene.render.threads = 5
scene.render.resolution_x, scene.render.resolution_y = args.width, args.height
scene.render.resolution_percentage = 100
scene.render.film_transparent = True
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.render.image_settings.color_depth = '8'
scene.render.fps = 24
scene.view_settings.view_transform = 'Standard'
scene.view_settings.look = 'None'
scene.view_settings.exposure = 0
scene.world.use_nodes = True
scene.world.node_tree.nodes['Background'].inputs[0].default_value = (1, 1, 1, 1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value = .38

scene.use_nodes = True
nodes = scene.node_tree.nodes
nodes.clear()
layers = nodes.new('CompositorNodeRLayers')
white = nodes.new('CompositorNodeRGB')
white.outputs[0].default_value = (1, 1, 1, 1)
over = nodes.new('CompositorNodeAlphaOver')
over.inputs[0].default_value = 1.
composite = nodes.new('CompositorNodeComposite')
scene.node_tree.links.new(white.outputs[0], over.inputs[1])
scene.node_tree.links.new(layers.outputs['Image'], over.inputs[2])
scene.node_tree.links.new(over.outputs[0], composite.inputs[0])

black = material('NADX / charcoal metal', (.007, .007, .007), .35, .22, .35)
letter_mat = material('NADX / black lacquer', (.004, .004, .004), .18, .24, .45)
yellow = material('NADX / yellow enamel', (1., ((.8+.055)/1.055)**2.4, 0.), .08, .29, .3)
root = bpy.data.objects.new('NADX / identity sculpture', None)
scene.collection.objects.link(root)
rounded_box('Black chamfered body', (3.4, 3.433, .28), -.14, black, .115, root)
rounded_box('Yellow identity face', (3.2, 3.233, .045), .018, yellow, .055, root)

svg = ET.parse(root_dir/'public/brand/nadx-logo.svg').getroot()
ns = {'svg': 'http://www.w3.org/2000/svg'}
scale = 3.2/811.89
glyphs = []
for element in svg.iter():
    if element.attrib.get('class') != 'fil1':
        continue
    if element.tag.endswith('polygon'):
        values = [float(number) for number in re.findall(r'[-+]?\d*\.?\d+', element.attrib['points'])]
        points = list(zip(values[::2], values[1::2]))
        contours = [[line(point, points[(i+1)%len(points)]) for i, point in enumerate(points)]]
    else:
        contours = svg_contours(element.attrib['d'])
    all_points = [point for contour in contours for segment in contour for point in segment]
    cx = (min(p[0] for p in all_points)+max(p[0] for p in all_points))/2
    cy = (min(p[1] for p in all_points)+max(p[1] for p in all_points))/2
    name = ('N' if cy < 410 and cx < 390 else 'A' if cy < 410 else 'D' if cx < 390 else 'X')
    curve = bpy.data.curves.new(f'Original SVG outline / {name}', 'CURVE')
    curve.dimensions, curve.fill_mode = '2D', 'BOTH'
    curve.resolution_u = 16
    curve.extrude, curve.bevel_depth, curve.bevel_resolution = .072, .009, 3
    for contour in contours:
        spline = curve.splines.new('BEZIER')
        spline.bezier_points.add(len(contour)-1)
        spline.use_cyclic_u = True
        def converted(point):
            return ((point[0]-cx)*scale, -(point[1]-cy)*scale, 0.)
        for i, (p0, p1, p2, p3) in enumerate(contour):
            point = spline.bezier_points[i]
            point.co = converted(p0)
            point.handle_left_type = point.handle_right_type = 'FREE'
            point.handle_right = converted(p1)
            spline.bezier_points[(i+1)%len(contour)].handle_left = converted(p2)
    obj = bpy.data.objects.new(f'NADX / {name}', curve)
    scene.collection.objects.link(obj)
    curve.materials.append(letter_mat)
    obj.parent = root
    obj.location = ((cx-811.89/2)*scale, -(cy-820.32/2)*scale, .121)
    glyphs.append(obj)

assert sorted(obj.name[-1] for obj in glyphs) == ['A', 'D', 'N', 'X']
bpy.ops.mesh.primitive_plane_add(size=200, location=(0, 0, 0))
ground = bpy.context.object
ground.name = 'Transparent shadow catcher / white site'
ground.is_shadow_catcher = args.engine=='cycles'
if args.engine=='cycles':
    ground.data.materials.append(material('Studio floor', (.8, .8, .8), 0., .7))
else:
    floor=bpy.data.materials.new('White studio / ambient contact shadow')
    floor.use_nodes=True
    fn=floor.node_tree.nodes
    fn.clear()
    ao=fn.new('ShaderNodeAmbientOcclusion')
    ao.inputs['Distance'].default_value=1.8
    ao.samples=16
    ramp=fn.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].position=.35
    ramp.color_ramp.elements[0].color=(.55,.55,.55,1)
    ramp.color_ramp.elements[1].position=.96
    ramp.color_ramp.elements[1].color=(1,1,1,1)
    emit=fn.new('ShaderNodeEmission')
    output=fn.new('ShaderNodeOutputMaterial')
    floor.node_tree.links.new(ao.outputs['AO'],ramp.inputs[0])
    floor.node_tree.links.new(ramp.outputs['Color'],emit.inputs[0])
    floor.node_tree.links.new(emit.outputs[0],output.inputs['Surface'])
    ground.data.materials.append(floor)

for name, location, energy, size in [
    ('Large left softbox', (-3.8, -4.5, 7), 360, 4.5),
    ('Front fill', (3.5, -4, 4.5), 180, 3.5),
    ('Upper rim softbox', (1.5, 3.5, 6), 600, 3.0),
]:
    data = bpy.data.lights.new(name, 'AREA')
    data.energy, data.shape, data.size = energy, 'DISK', size
    light = bpy.data.objects.new(name, data)
    scene.collection.objects.link(light)
    light.location = location
    look_at(light, (0, 0, 1.5))

bpy.ops.object.camera_add(location=(4.2, -8.2, 5.0))
camera = bpy.context.object
camera.name = 'NADX / product camera'
camera.data.type, camera.data.ortho_scale = 'ORTHO', 5.2
look_at(camera, (0, 0, 1.7))
scene.camera = camera
scene.frame_start, scene.frame_end = 1, args.frames

def pose(frame):
    phase = 2*math.pi*(frame-1)/args.frames
    pulse = .5-.5*math.cos(phase)
    root.location = (0, 0, 1.72+.055*math.sin(phase))
    root.rotation_euler = (math.radians(67)+.055*math.sin(phase+.4), .055*math.cos(phase), math.radians(12)+.12*math.sin(phase))
    for i, obj in enumerate(glyphs):
        obj.location.z = .121+pulse*(.055+.14*(.5+.5*math.sin(phase+i*.7)))
        obj.rotation_euler.z = .012*math.sin(phase+i*.6)*pulse

# Bake the closed trajectory so the saved Blender scene is editable and replayable.
for frame in range(1,args.frames+2):
    pose(frame)
    root.keyframe_insert(data_path='location',frame=frame)
    root.keyframe_insert(data_path='rotation_euler',frame=frame)
    for obj in glyphs:
        obj.keyframe_insert(data_path='location',index=2,frame=frame)
        obj.keyframe_insert(data_path='rotation_euler',index=2,frame=frame)
for obj in [root,*glyphs]:
    for channel in obj.animation_data.action.fcurves:
        for key in channel.keyframe_points:
            key.interpolation='LINEAR'
scene.frame_set(1)
scene.render.filepath = str(out)+'/'
bpy.ops.wm.save_as_mainfile(filepath=str(out/'nadx-motion.blend'))
if args.preview:
    scene.frame_end=min(args.preview_count,args.frames)
started = time.monotonic()
def progress(current_scene):
    print(f'NADX_FRAME {current_scene.frame_current}/{current_scene.frame_end} ELAPSED {time.monotonic()-started:.1f}s',flush=True)
bpy.app.handlers.render_write.append(progress)
bpy.ops.render.render(animation=True)
