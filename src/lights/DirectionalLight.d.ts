import { Color } from './../math/Color';
import { Object3D } from './../core/Object3D';
import { DirectionalLightShadow } from './DirectionalLightShadow';
import { Light } from './Light';

/**
 * @example
 * // White directional light at half intensity shining from the top.
 * const directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
 * directionalLight.position.set( 0, 1, 0 );
 * scene.add( directionalLight );
 *
 * @see {@link https://github.com/mrdoob/three.js/blob/master/src/lights/DirectionalLight.js|src/lights/DirectionalLight.js}
 */
export class DirectionalLight extends Light {

	constructor( color?: Color | string | number | Texture, intensity?: number );

	/**
	 * Spotlight color map.
	 * Default — undefined.
	 */
	map?: Texture 
	
	/**
	 * Target used for shadow camera orientation.
	 */
	target: Object3D;

	/**
	 * Light's intensity.
	 * Default — 1.0.
	 */
	intensity: number;

	shadow: DirectionalLightShadow;
	readonly isDirectionalLight: true;

}
