import { earthAxis, earthView } from "@/lib/earth-view";

// Clouds swing east and back rather than circling: the layer only holds this side of the planet.
const DRIFT_RADIANS = (8 * Math.PI) / 180;
const DRIFT_PERIOD_MS = 130_000;
// Below 1 rounds the turns of a triangle wave. A plain sine would leave the clouds almost still
// for long stretches around each turn; this keeps them moving steadily and turns them gently.
const DRIFT_ROUNDING = 0.97;
// At a few pixels per second each frame moves a fraction of a pixel, so a low frame rate stays
// smooth and is easy on batteries.
const FRAME_MS = 80;
const MAX_PIXEL_RATIO = 3;

const VERTEX_SHADER = `
attribute vec2 position;
varying vec2 uv;
void main() {
  uv = vec2(position.x + 1.0, 1.0 - position.y) * 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}`;

// Finds the point on the sphere behind each pixel, turns it around Earth's axis and reads the
// cloud layer where that point sits at rest, so clouds follow the curve of the planet. A turned
// point can land past the horizon, where the projection would fold the far side back over this
// one, or below the frame, where the layer ends. Both fade out, over a band that closes up at
// angle 0 so the first frame still matches the still image.
const FRAGMENT_SHADER = `
precision highp float;
varying vec2 uv;
uniform sampler2D clouds;
uniform vec3 axis;
uniform float angle;
uniform float cameraDistance;
uniform float halfWidth;
uniform float top;
uniform float bottom;

void main() {
  vec2 frame = vec2((uv.x * 2.0 - 1.0) * halfWidth, top - uv.y * (top - bottom));
  float focal = sqrt(cameraDistance * cameraDistance - 1.0);
  vec3 ray = normalize(vec3(frame, -focal));
  float b = cameraDistance * ray.z;
  float disc = b * b - (cameraDistance * cameraDistance - 1.0);
  if (disc < 0.0) discard;
  vec3 point = vec3(0.0, 0.0, cameraDistance) + ray * (-b - sqrt(disc));
  vec3 turned = point * cos(angle) + cross(axis, point) * sin(angle)
    + axis * dot(axis, point) * (1.0 - cos(angle));
  vec2 rest = turned.xy * focal / (cameraDistance - turned.z);
  float band = min(abs(angle), 0.04) + 0.0001;
  float horizon = 1.0 / cameraDistance;
  float fade = smoothstep(horizon, horizon + band, turned.z)
    * smoothstep(bottom, bottom + band, rest.y);
  gl_FragColor = fade * texture2D(clouds, vec2(
    (rest.x + halfWidth) / (2.0 * halfWidth),
    (top - rest.y) / (top - bottom)
  ));
}`;

function compile(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
}

function createProgram(gl: WebGLRenderingContext): WebGLProgram | null {
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  return gl.getProgramParameter(program, gl.LINK_STATUS) ? program : null;
}

/**
 * Draws the cloud layer on `canvas` with a slow drift. At the first frame it matches the still
 * image exactly, so `onReady` can swap one for the other unseen, and `onLost` hands back if the
 * GPU drops the context. `image` must be loaded without a srcset, because `naturalWidth` is
 * density-corrected on one that has it, which would hide the file's real size. Stops drawing off screen. Returns a cleanup function, or null when
 * WebGL isn't available or the image is too large for this GPU, and the still image should stay.
 */
export function startCloudDrift(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  { onReady, onLost }: { onReady: () => void; onLost: () => void },
): (() => void) | null {
  const gl = canvas.getContext("webgl", { antialias: false, premultipliedAlpha: true });
  if (!gl) return null;
  // Uploading a larger image fails without an error and would leave no clouds at all.
  if (image.naturalWidth > gl.getParameter(gl.MAX_TEXTURE_SIZE)) return null;
  const program = createProgram(gl);
  if (!program) return null;
  gl.useProgram(program);

  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, "position");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const uniform = (name: string) => gl.getUniformLocation(program, name);
  gl.uniform3f(uniform("axis"), ...earthAxis);
  gl.uniform1f(uniform("cameraDistance"), earthView.distance);
  gl.uniform1f(uniform("halfWidth"), earthView.halfWidth);
  gl.uniform1f(uniform("top"), earthView.top);
  gl.uniform1f(uniform("bottom"), earthView.bottom);
  const angle = uniform("angle");

  const fitToLayout = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
    // More canvas pixels than the layer has add cost, not detail.
    const width = Math.min(Math.round(canvas.clientWidth * ratio), image.naturalWidth);
    const height = Math.round((width * earthView.height) / earthView.width);
    if (canvas.width === width && canvas.height === height) return;
    canvas.width = width;
    canvas.height = height;
    gl.viewport(0, 0, width, height);
  };

  const draw = (elapsed: number) => {
    // Negative, because this says where to read from and the clouds move the other way.
    const phase = Math.sin((2 * Math.PI * elapsed) / DRIFT_PERIOD_MS);
    const swing = Math.asin(DRIFT_ROUNDING * phase) / Math.asin(DRIFT_ROUNDING);
    gl.uniform1f(angle, -DRIFT_RADIANS * swing);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  let frame = 0;
  let lastDraw = 0;
  let onScreen = true;
  let start = 0;
  const tick = (now: number) => {
    frame = requestAnimationFrame(tick);
    if (now - lastDraw < FRAME_MS) return;
    lastDraw = now;
    fitToLayout();
    draw(now - start);
  };
  const run = () => {
    if (!frame && onScreen) frame = requestAnimationFrame(tick);
  };
  const halt = () => {
    cancelAnimationFrame(frame);
    frame = 0;
  };

  const visibility = new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    if (onScreen) run();
    else halt();
  });
  const handleLost = () => {
    halt();
    onScreen = false;
    onLost();
  };
  canvas.addEventListener("webglcontextlost", handleLost);

  fitToLayout();
  draw(0);
  start = performance.now();
  // Waits a frame so the canvas shows its first draw before the still image goes.
  frame = requestAnimationFrame((now) => {
    frame = 0;
    onReady();
    visibility.observe(canvas);
    tick(now);
  });

  return () => {
    halt();
    visibility.disconnect();
    canvas.removeEventListener("webglcontextlost", handleLost);
  };
}
