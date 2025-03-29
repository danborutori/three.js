import { RenderTarget } from '../core/RenderTarget.js';

/**
 * A render target used in context of {@link WebGLRenderer}.
 *
 * @augments RenderTarget
 */
class WebGLRenderTarget extends RenderTarget {

	/**
	 * Constructs a new 3D render target.
	 *
	 * @param {number} [width=1] - The width of the render target.
	 * @param {number} [height=1] - The height of the render target.
	 * @param {RenderTarget~Options} [options] - The configuration object.
	 */
	constructor( width = 1, height = 1, options = {} ) {

		super( width, height, options );

		/**
		 * This flag can be used for type testing.
		 *
		 * @type {boolean}
		 * @readonly
		 * @default true
		 */
		this.isWebGLRenderTarget = true;

		this.normalTexture = options.normalTexture !== undefined ? options.normalTexture : null;
		this.metalnessTexture = options.metalnessTexture !== undefined ? options.metalnessTexture : null;
		this.diffuseColorTexture = options.diffuseColorTexture !== undefined ? options.diffuseColorTexture : null;
		if(this.normalTexture !==null){
			this.normalTexture.image = {};
			this.normalTexture.image.width = width;
			this.normalTexture.image.height = height;
			this.normalTexture.needsUpdate = true
		}
		if(this.metalnessTexture !==null){
			this.metalnessTexture.image = {};
			this.metalnessTexture.image.width = width;
			this.metalnessTexture.image.height = height;
			this.metalnessTexture.needsUpdate = true
		}
		if(this.diffuseColorTexture !==null){
			this.diffuseColorTexture.image = {};
			this.diffuseColorTexture.image.width = width;
			this.diffuseColorTexture.image.height = height;
			this.diffuseColorTexture.needsUpdate = true
		}

	}

	setSize( width, height, depth = 1 ) {
		if ( this.width !== width || this.height !== height || this.depth !== depth ) {

			if(this.normalTexture !==null){
				this.normalTexture.image.width = width;
				this.normalTexture.image.height = height;
			}
			if(this.metalnessTexture !==null){
				this.metalnessTexture.image.width = width;
				this.metalnessTexture.image.height = height;
			}
			if(this.diffuseColorTexture !==null){
				this.diffuseColorTexture.image.width = width;
				this.diffuseColorTexture.image.height = height;
			}

		}

		super.setSize(width,height,depth)
	}

	copy( source ) {

		this.normalTexture = source.normalTexture;
		this.metalnessTexture = source.metalnessTexture;
		this.diffuseColorTexture = source.diffuseColorTexture;

		return super.copy(source)

	}

}

export { WebGLRenderTarget };
