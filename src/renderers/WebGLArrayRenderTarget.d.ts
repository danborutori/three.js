import { DataArrayTexture } from '../Three';

export class WebGLArrayRenderTarget extends WebGLRenderTarget {

	constructor(
		width: number,
		height: number,
		depth: number
	);

	texture: DataArrayTexture;
	readonly depth: number;

	readonly isWebGLArrayRenderTarget: true;
}
