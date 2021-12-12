import { Light } from './Light.js';
import { SpotLightShadow } from './SpotLightShadow.js';
import { Object3D } from '../core/Object3D.js';
import { Matrix4 } from '../math/Matrix4.js';

class SpotLight extends Light {

	constructor( color, intensity, distance = 0, angle = Math.PI / 3, penumbra = 0, decay = 1 ) {
		const colorTexture = color && color.isTexture

		super( colorTexture?0xffffff:color, intensity );

		this.type = 'SpotLight';

		this.position.copy( Object3D.DefaultUp );
		this.updateMatrix();
		this.map = colorTexture?color:undefined
		this.mapMatrix = new Matrix4()
	
		this.target = new Object3D();

		this.distance = distance;
		this.angle = angle;
		this.penumbra = penumbra;
		this.decay = decay; // for physically correct lights, should be 2.

		this.shadow = new SpotLightShadow();

	}

	get power() {

		// intensity = power per solid angle.
		// ref: equation (17) from https://seblagarde.files.wordpress.com/2015/07/course_notes_moving_frostbite_to_pbr_v32.pdf
		return this.intensity * Math.PI;

	}

	set power( power ) {

		// intensity = power per solid angle.
		// ref: equation (17) from https://seblagarde.files.wordpress.com/2015/07/course_notes_moving_frostbite_to_pbr_v32.pdf
		this.intensity = power / Math.PI;

	}

	copy( source ) {

		super.copy( source );

		this.map = source.map;
		this.mapMatrix.copy( source.mapMatrix );
		this.distance = source.distance;
		this.angle = source.angle;
		this.penumbra = source.penumbra;
		this.decay = source.decay;

		this.target = source.target.clone();

		this.shadow = source.shadow.clone();

		return this;

	}

}

SpotLight.prototype.isSpotLight = true;

export { SpotLight };
