import reglInit from 'regl';
import sphere from 'primitive-sphere';
import type { Format } from '../format';
import type { Layout } from '../layout';
import type { Regl } from 'regl';
import type { RenderProps } from './renderProps';

function getMappedUvGlsl(format: Format) {
  switch (format) {
    case '180':
      return 'mappedUv = flippedUv * vec2(2.0, 1.0) * texCoordScaleOffset.xy + texCoordScaleOffset.zw;';
    case '360':
    // TODO: center the texture on the screen?
    // falls through
    case 'screen':
    // falls through
    default:
      return 'mappedUv = flippedUv * texCoordScaleOffset.xy + texCoordScaleOffset.zw;';
  }
}

function getFragColorGlsl(format: Format) {
  switch (format) {
    case '180':
      return `
          if (behind > 0.0) {
            gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
          } else {
            gl_FragColor = texture2D(texture, mappedUv);
          }
        `;
    case '360':
    // falls through
    case 'screen':
    // falls through
    default:
      return 'gl_FragColor = texture2D(texture, mappedUv);';
  }
}

export abstract class Renderer {
  abstract start(): Promise<void>;

  protected readonly regl: Regl;

  protected readonly cmdRender: reglInit.DrawCommand<
    reglInit.DefaultContext,
    RenderProps
  >;

  constructor(
    protected readonly canvas: HTMLCanvasElement,
    protected readonly layout: Layout,
    protected readonly format: Format,
  ) {
    const mesh = this.getMesh();

    this.regl = reglInit({ pixelRatio: 1, canvas: this.canvas });

    this.cmdRender = this.regl({
      vert: `
      precision highp float;

      attribute vec3 position;
      attribute vec2 uv;
      uniform vec4 texCoordScaleOffset;
      uniform mat4 model;
      uniform mat4 view;
      uniform mat4 projection;

      varying vec2 mappedUv;
      varying float behind;

      void main() {
        gl_Position = projection * view * model * vec4(position, 1);

        behind = position.z > 0.0 ? 1.0 : 0.0;

        vec2 flippedUv = vec2(1.0 - uv.x, 1.0 - uv.y);
        ${getMappedUvGlsl(this.format)}
      }`,
      frag: `
      precision highp float;

      uniform sampler2D texture;

      varying vec2 mappedUv;
      varying float behind;

      void main() {
        ${getFragColorGlsl(this.format)}
      }`,
      attributes: {
        position: mesh.positions,
        uv: mesh.uvs,
      },
      // TODO: https://github.com/regl-project/regl/pull/632
      uniforms: {
        model: this.regl.prop<RenderProps, 'model'>('model'),
        view: this.regl.prop<RenderProps, 'view'>('view'),
        projection: this.regl.prop<RenderProps, 'projection'>('projection'),
        texture: this.regl.prop<RenderProps, 'texture'>('texture'),
        texCoordScaleOffset: this.regl.prop<RenderProps, 'texCoordScaleOffset'>(
          'texCoordScaleOffset',
        ),
      },
      viewport: this.regl.prop<RenderProps, 'viewport'>('viewport'),
      elements: mesh.cells,
    });
  }

  private getMesh(): {
    positions: number[][];
    cells: number[][];
    uvs: number[][];
    normals: number[][];
  } {
    switch (this.format) {
      case '360':
      // falls through
      case '180': {
        const s = sphere(1, { segments: 32 });
        return s;
      }

      case 'screen':
      // falls through
      default:
        return {
          positions: [
            [-1, 1, 0],
            [-1, -1, 0],
            [1, -1, 0],
            [1, 1, 0],
          ],
          cells: [
            [0, 2, 1],
            [0, 3, 2],
          ],
          uvs: [
            [1, 1],
            [1, 0],
            [0, 0],
            [0, 1],
          ],
          normals: [
            [0, 0, -1],
            [0, 0, -1],
          ],
        };
    }
  }

  protected getTexCoordScaleOffsets() {
    switch (this.layout) {
      case 'stereoTopBottom':
        return [
          new Float32Array([1.0, 0.5, 0.0, 0.0]),
          new Float32Array([1.0, 0.5, 0.0, 0.5]),
        ];
      case 'stereoLeftRight':
        return [
          new Float32Array([0.5, 1.0, 0.0, 0.0]),
          new Float32Array([0.5, 1.0, 0.5, 0.0]),
        ];
      case 'mono':
      // falls through
      default:
        return [
          new Float32Array([1.0, 1.0, 0.0, 0.0]),
          new Float32Array([1.0, 1.0, 0.0, 0.0]),
        ];
    }
  }

  protected getAspectRation(video: HTMLVideoElement) {
    switch (this.layout) {
      case 'stereoTopBottom':
        return (video.videoWidth / video.videoHeight) * 0.5;
      case 'stereoLeftRight':
        return (video.videoWidth * 0.5) / video.videoHeight;
      case 'mono':
      // falls through
      default:
        return video.videoWidth / video.videoHeight;
    }
  }
}
