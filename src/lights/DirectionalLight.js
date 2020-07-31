import { Light } from './Light.js';
import { DirectionalLightShadow } from './DirectionalLightShadow.js';
import { Object3D } from '../core/Object3D.js';
import { Matrix4 } from '../math/Matrix4.js';

function DirectionalLight( color, intensity ) {
	
	const colorTexture = color && color.isTexture;	
	Light.call( this, colorTexture?0xffffff:color, intensity );

	this.type = 'DirectionalLight';

	this.map = colorTexture?color:undefined;
	this.mapMatrix = new Matrix4();
	this.position.copy( Object3D.DefaultUp );
	this.updateMatrix();

	this.target = new Object3D();

	this.shadow = new DirectionalLightShadow();

}

DirectionalLight.prototype = Object.assign( Object.create( Light.prototype ), {

	constructor: DirectionalLight,

	isDirectionalLight: true,

	copy: function ( source ) {

		Light.prototype.copy.call( this, source );

		this.target = source.target.clone();

		this.shadow = source.shadow.clone();

		return this;

	}

} );


export { DirectionalLight };
