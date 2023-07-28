import { RenderTarget } from '../core/RenderTarget.js';

class WebGLRenderTarget extends RenderTarget {

	constructor( width = 1, height = 1, options = {} ) {

		super( width, height, options );

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
