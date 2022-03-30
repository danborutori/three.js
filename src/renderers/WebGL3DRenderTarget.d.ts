import { Data3DTexture } from '../Three';

export class WebGL3DRenderTarget extends WebGLRenderTarget {

	constructor(
		width: number,
		height: number,
		depth: number
	);

	texture: Data3DTexture;
	readonly depth: number;

	readonly isWebGL3DRenderTarget: true;
}
