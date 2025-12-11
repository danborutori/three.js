import { Color } from '../../math/Color.js';
import { Matrix4 } from '../../math/Matrix4.js';
import { Vector2 } from '../../math/Vector2.js';
import { Vector3 } from '../../math/Vector3.js';
import { DirectionalLight } from '../../lights/DirectionalLight.js';
import { SpotLight } from '../../lights/SpotLight.js';
import { PointLight } from '../../lights/PointLight.js';
import { RectAreaLight } from '../../lights/RectAreaLight.js';
import { HemisphereLight } from '../../lights/HemisphereLight.js';
import { UniformsLib } from '../shaders/UniformsLib.js';
import { RGFormat } from '../../constants.js';

function UniformsCache() {

	const lights = {};

	return {

		get: function ( light ) {

			if ( lights[ light.id ] !== undefined ) {

				return lights[ light.id ];

			}

			let uniforms;

			switch ( light.type ) {

				case 'DirectionalLight':
					uniforms = {
						direction: new Vector3(),
						color: new Color(),
						map: -1
					};
					break;

				case 'SpotLight':
					uniforms = {
						position: new Vector3(),
						direction: new Vector3(),
						color: new Color(),
						map: -1,
						distance: 0,
						coneCos: 0,
						penumbraCos: 0,
						decay: 0
					};
					break;

				case 'PointLight':
					uniforms = {
						position: new Vector3(),
						color: new Color(),
						distance: 0,
						decay: 0
					};
					break;

				case 'HemisphereLight':
					uniforms = {
						direction: new Vector3(),
						skyColor: new Color(),
						groundColor: new Color()
					};
					break;

				case 'RectAreaLight':
					uniforms = {
						color: new Color(),
						position: new Vector3(),
						halfWidth: new Vector3(),
						halfHeight: new Vector3()
					};
					break;

			}

			lights[ light.id ] = uniforms;

			return uniforms;

		}

	};

}

function ShadowUniformsCache() {

	const lights = {};

	return {

		get: function ( light ) {

			if ( lights[ light.id ] !== undefined ) {

				return lights[ light.id ];

			}

			let uniforms;

			switch ( light.type ) {

				case 'DirectionalLight':
					uniforms = {
						shadowIntensity: 1,
						shadowBias: 0,
						shadowNormalBias: 0,
						shadowRadius: 1,
						shadowMapSize: new Vector2()
					};
					break;

				case 'SpotLight':
					uniforms = {
						shadowIntensity: 1,
						shadowBias: 0,
						shadowNormalBias: 0,
						shadowRadius: 1,
						shadowMapSize: new Vector2()
					};
					break;

				case 'PointLight':
					uniforms = {
						shadowIntensity: 1,
						shadowBias: 0,
						shadowNormalBias: 0,
						shadowRadius: 1,
						shadowMapSize: new Vector2(),
						shadowCameraNear: 1,
						shadowCameraFar: 1000
					};
					break;

				// TODO (abelnation): set RectAreaLight shadow uniforms

			}

			lights[ light.id ] = uniforms;

			return uniforms;

		}

	};

}



let nextVersion = 0;

function shadowCastingLightsFirst( lightA, lightB ) {

	return ( lightB.castShadow ? 1 : 0 ) - ( lightA.castShadow ? 1 : 0 );

}

function WebGLLights( extensions, staticLightConfig ) {

	if(staticLightConfig){
		staticLightConfig.directionalLength = staticLightConfig.directionalLength || 0;
		staticLightConfig.numDirectionalShadows = staticLightConfig.numDirectionalShadows || 0;
		staticLightConfig.spotLength = staticLightConfig.spotLength || 0;
		staticLightConfig.numSpotShadows = staticLightConfig.numSpotShadows || 0;
		staticLightConfig.pointLength = staticLightConfig.pointLength || 0;
		staticLightConfig.numPointShadows = staticLightConfig.numPointShadows || 0;
		staticLightConfig.hemiLength = staticLightConfig.hemiLength || 0;
		staticLightConfig.rectAreaLength = staticLightConfig.rectAreaLength || 0;
		staticLightConfig.numSpotMaps = staticLightConfig.numSpotMaps || 0;
		staticLightConfig.numDirectionalMaps = staticLightConfig.numDirectionalMaps || 0;
	}

	const cache = new UniformsCache();

	const shadowCache = ShadowUniformsCache();
	
	const dummyDirectional = new DirectionalLight;
	const dummySpot = new SpotLight;
	const dummyPoint = new PointLight;
	const dummyUniforms = {
		direcional: cache.get(dummyDirectional),
		point: cache.get(dummyPoint),
		spot: cache.get(dummySpot),
		rectArea: cache.get(new RectAreaLight),
		hemi: cache.get(new HemisphereLight)
	};
	dummyUniforms.direcional.color.setRGB(0,0,0);
	dummyUniforms.point.color.setRGB(0,0,0);
	dummyUniforms.spot.color.setRGB(0,0,0);
	dummyUniforms.rectArea.color.setRGB(0,0,0);
	dummyUniforms.hemi.skyColor.setRGB(0,0,0);
	dummyUniforms.hemi.groundColor.setRGB(0,0,0);
	const dummyShadowUniforms = {
		direcional: shadowCache.get(dummyDirectional),
		point: shadowCache.get(dummyPoint),
		spot: shadowCache.get(dummySpot)
	};

	const state = {

		version: 0,

		hash: {
			directionalLength: - 1,
			pointLength: - 1,
			spotLength: - 1,
			rectAreaLength: - 1,
			hemiLength: - 1,

			numDirectionalShadows: - 1,
			numPointShadows: - 1,
			numSpotShadows: - 1,
			
			numDirectionalMaps: -1,
			numSpotMaps: -1,
			numLightProbes: - 1
		},

		ambient: [ 0, 0, 0 ],
		probe: [],
		directional: [],
		directionalShadow: [],
		directionalShadowMap: [],
		directionalShadowMatrix: [],
		spot: [],
		spotShadow: [],
		spotShadowMap: [],
		spotShadowMatrix: [],
		rectArea: [],
		rectAreaLTC1: null,
		rectAreaLTC2: null,
		point: [],
		pointShadow: [],
		pointShadowMap: [],
		pointShadowMatrix: [],
		directionalMap: [],
		directionalMapMatrix: [],
		spotMap: [],
		spotMapMatrix: [],
		hemi: [],
		staticSamplerUnitCount: 0,
		numLightProbes: 0
	};

	for ( let i = 0; i < 9; i ++ ) state.probe.push( new Vector3() );
	
	const staticSamplers = {};

	const vector3 = new Vector3();
	const matrix4 = new Matrix4();
	const matrix42 = new Matrix4();

	function setup( lights ) {

		let r = 0, g = 0, b = 0;

		for ( let i = 0; i < 9; i ++ ) state.probe[ i ].set( 0, 0, 0 );

		let directionalLength = 0;
		let pointLength = 0;
		let spotLength = 0;
		let rectAreaLength = 0;
		let hemiLength = 0;

		let numDirectionalShadows = 0;
		let numPointShadows = 0;
		let numSpotShadows = 0;

		let numDirectionalMaps = 0;
		let numSpotMaps = 0;
		let numLightProbes = 0;

		if(staticLightConfig && staticLightConfig.sortFunc){
			lights.sort( function(a,b){ return staticLightConfig.sortFunc(a,b) } );
		}else{
			// ordering : [shadow casting + map texturing, map texturing, shadow casting, none ]
			lights.sort( shadowCastingAndTexturingLightsFirst );
		}

		for ( let i = 0, l = lights.length; i < l; i ++ ) {

			const light = lights[ i ];

			const color = light.color;
			const intensity = light.intensity;
			const distance = light.distance;

			let shadowMap = null;

			if ( light.shadow && light.shadow.map ) {

				if ( light.shadow.map.texture.format === RGFormat ) {

					// VSM uses color texture with blurred mean/std_dev
					shadowMap = light.shadow.map.texture;

				} else {

					// Other types use depth texture
					shadowMap = light.shadow.map.depthTexture || light.shadow.map.texture;

				}

			}
			light.lightInUse = false;

			if ( light.isAmbientLight ) {

				r += color.r * intensity;
				g += color.g * intensity;
				b += color.b * intensity;

				light.lightInUse = true;

			} else if ( light.isLightProbe ) {

				for ( let j = 0; j < 9; j ++ ) {

					state.probe[ j ].addScaledVector( light.sh.coefficients[ j ], intensity );

				}
				
				light.lightInUse = true;

				numLightProbes ++;

			} else if ( light.isDirectionalLight ) {

				if ( !staticLightConfig || directionalLength<staticLightConfig.directionalLength ) {
					const uniforms = cache.get( light );

				uniforms.color.copy( light.color ).multiplyScalar( light.intensity );

					if ( light.castShadow && (!staticLightConfig || numDirectionalShadows<staticLightConfig.numDirectionalShadows) ) {

						const shadow = light.shadow;

						const shadowUniforms = shadowCache.get( light );

						shadowUniforms.shadowIntensity = shadow.intensity;
						shadowUniforms.shadowBias = shadow.bias;
						shadowUniforms.shadowNormalBias = shadow.normalBias;
						shadowUniforms.shadowRadius = shadow.radius;
						shadowUniforms.shadowMapSize = shadow.mapSize;

						state.directionalShadow[ directionalLength ] = shadowUniforms;
						state.directionalShadowMap[ directionalLength ] = shadowMap;
						state.directionalShadowMatrix[ directionalLength ] = light.shadow.matrix;

						numDirectionalShadows ++;
						light.shadowInUse = true;
					}
					
					if(light.map && (!staticLightConfig || numDirectionalMaps<staticLightConfig.numDirectionalMaps) ){
						uniforms.map = numDirectionalMaps;
						state.directionalMap[numDirectionalMaps] = light.map;
						state.directionalMapMatrix[numDirectionalMaps] = light.mapMatrix;
						numDirectionalMaps++;
					}else{
						uniforms.map = -1;
					}

					state.directional[ directionalLength ] = uniforms;

					directionalLength ++;
					light.lightInUse = true;
				}else{
					if ( light.castShadow ) {
						light.shadowInUse = true;
					}
				}

			} else if ( light.isSpotLight ) {

				if(!staticLightConfig || spotLength<staticLightConfig.spotLength) {
					const uniforms = cache.get( light );

					uniforms.position.setFromMatrixPosition( light.matrixWorld );

					uniforms.color.copy( color ).multiplyScalar( intensity );
					uniforms.distance = distance;

					uniforms.coneCos = Math.cos( light.angle );
					uniforms.penumbraCos = Math.cos( light.angle * ( 1 - light.penumbra ) );
					uniforms.decay = light.decay;

					if ( light.castShadow && (!staticLightConfig || numSpotShadows<staticLightConfig.numSpotShadows) ) {

						const shadow = light.shadow;

						const shadowUniforms = shadowCache.get( light );

						shadowUniforms.shadowIntensity = shadow.intensity;
						shadowUniforms.shadowBias = shadow.bias;
						shadowUniforms.shadowNormalBias = shadow.normalBias;
						shadowUniforms.shadowRadius = shadow.radius;
						shadowUniforms.shadowMapSize = shadow.mapSize;

						state.spotShadow[ spotLength ] = shadowUniforms;
						state.spotShadowMap[ spotLength ] = shadowMap;
						state.spotShadowMatrix[ spotLength ] = light.shadow.matrix;

						numSpotShadows ++;
						light.shadowInUse = true;
					}
					
					if(light.map && (!staticLightConfig || numSpotMaps<staticLightConfig.numSpotMaps)){
						uniforms.map = numSpotMaps;
						state.spotMap[numSpotMaps] = light.map;
						state.spotMapMatrix[numSpotMaps] = light.mapMatrix;
						numSpotMaps++;
					}else{
						uniforms.map = -1;
					}

					state.spot[ spotLength ] = uniforms;

					spotLength ++;
					light.lightInUse = true;
				} else {
					if ( light.castShadow ) {
						light.shadowInUse = true;
					}
				}

			} else if ( light.isRectAreaLight && (!staticLightConfig || rectAreaLength<staticLightConfig.rectAreaLength) ) {

				const uniforms = cache.get( light );

				uniforms.color.copy( color ).multiplyScalar( intensity );

				uniforms.halfWidth.set( light.width * 0.5, 0.0, 0.0 );
				uniforms.halfHeight.set( 0.0, light.height * 0.5, 0.0 );

				state.rectArea[ rectAreaLength ] = uniforms;

				rectAreaLength ++;
				light.lightInUse = true;

			} else if ( light.isPointLight && (!staticLightConfig || pointLength<staticLightConfig.pointLength) ) {

				const uniforms = cache.get( light );

				uniforms.color.copy( light.color ).multiplyScalar( light.intensity );
				uniforms.distance = light.distance;
				uniforms.decay = light.decay;

				if ( light.castShadow && (!staticLightConfig || numPointShadows<staticLightConfig.numPointShadows) ) {

					const shadow = light.shadow;

					const shadowUniforms = shadowCache.get( light );

					shadowUniforms.shadowIntensity = shadow.intensity;
					shadowUniforms.shadowBias = shadow.bias;
					shadowUniforms.shadowNormalBias = shadow.normalBias;
					shadowUniforms.shadowRadius = shadow.radius;
					shadowUniforms.shadowMapSize = shadow.mapSize;
					shadowUniforms.shadowCameraNear = shadow.camera.near;
					shadowUniforms.shadowCameraFar = shadow.camera.far;

					state.pointShadow[ pointLength ] = shadowUniforms;
					state.pointShadowMap[ pointLength ] = shadowMap;
					state.pointShadowMatrix[ pointLength ] = light.shadow.matrix;

					numPointShadows ++;
					light.shadowInUse = true;
				}

				state.point[ pointLength ] = uniforms;

				pointLength ++;
				light.lightInUse = true;

			} else if ( light.isHemisphereLight && (!staticLightConfig || hemiLength<staticLightConfig.hemiLength) ) {

				const uniforms = cache.get( light );

				uniforms.skyColor.copy( light.color ).multiplyScalar( intensity );
				uniforms.groundColor.copy( light.groundColor ).multiplyScalar( intensity );

				state.hemi[ hemiLength ] = uniforms;

				hemiLength ++;
				light.lightInUse = true;
				
			}

		}

		if ( rectAreaLength > 0 ) {

			if ( extensions.has( 'OES_texture_float_linear' ) === true ) {

				state.rectAreaLTC1 = UniformsLib.LTC_FLOAT_1;
				state.rectAreaLTC2 = UniformsLib.LTC_FLOAT_2;

			} else {

				state.rectAreaLTC1 = UniformsLib.LTC_HALF_1;
				state.rectAreaLTC2 = UniformsLib.LTC_HALF_2;

			}

		}

		state.ambient[ 0 ] = r;
		state.ambient[ 1 ] = g;
		state.ambient[ 2 ] = b;
		
		if(staticLightConfig){
			while(directionalLength<staticLightConfig.directionalLength){
				state.directional[ directionalLength ] = dummyUniforms.direcional;
				directionalLength++;
			}
			while(numDirectionalShadows<staticLightConfig.numDirectionalShadows){
				state.directionalShadow[numDirectionalShadows] = dummyShadowUniforms.direcional;
				state.directionalShadowMap[ numDirectionalShadows ] = null;
				state.directionalShadowMatrix[ numDirectionalShadows ] = new Matrix4;
				numDirectionalShadows++;
			}
			while(spotLength<staticLightConfig.spotLength){
				state.spot[ spotLength ] = dummyUniforms.spot;
				spotLength++;
			}
			while(numSpotShadows<staticLightConfig.numSpotShadows){
				state.spotShadow[numSpotShadows] = dummyShadowUniforms.spot;
				state.spotShadowMap[ numSpotShadows ] = null;
				state.spotShadowMatrix[ numSpotShadows ] = new Matrix4;
				numSpotShadows++;
			}
			while(pointLength<staticLightConfig.pointLength){
				state.point[ pointLength ] = dummyUniforms.point;
				pointLength++;
			}
			while(numPointShadows<staticLightConfig.numPointShadows){
				state.pointShadow[numPointShadows] = dummyShadowUniforms.point;
				state.pointShadowMap[ numPointShadows ] = null;
				state.pointShadowMatrix[ numPointShadows ] = new Matrix4;
				numPointShadows++;
			}
			while(hemiLength<staticLightConfig.hemiLength){
				state.hemi[ pointLength ] = dummyUniforms.hemi;
				hemiLength++;
			}
			while(rectAreaLength<staticLightConfig.rectAreaLength){
				state.rectArea[ pointLength ] = dummyUniforms.rectArea;
				rectAreaLength++;
			}
			
			while(numSpotMaps<staticLightConfig.numSpotMaps){
				state.spotMap[ numSpotMaps ] = null;
				state.spotMapMatrix[ numSpotMaps ] = new Matrix4();
				numSpotMaps++;
			}
			while(numDirectionalMaps<staticLightConfig.numDirectionalMaps){
				state.directionalMap[ numDirectionalMaps ] = null;
				state.directionalMapMatrix[ numDirectionalMaps ] = new Matrix4();
				numDirectionalMaps++;
			}
		}

		const hash = state.hash;

		if ( hash.directionalLength !== directionalLength ||
			hash.pointLength !== pointLength ||
			hash.spotLength !== spotLength ||
			hash.rectAreaLength !== rectAreaLength ||
			hash.hemiLength !== hemiLength ||
			hash.numDirectionalShadows !== numDirectionalShadows ||
			hash.numPointShadows !== numPointShadows ||
			hash.numSpotShadows !== numSpotShadows ||
			hash.numDirectionalMaps !== numDirectionalMaps ||
			hash.numSpotMaps !== numSpotMaps ||
			hash.numLightProbes !== numLightProbes ) {

			state.directional.length = directionalLength;
			state.spot.length = spotLength;
			state.rectArea.length = rectAreaLength;
			state.point.length = pointLength;
			state.hemi.length = hemiLength;

			state.directionalShadow.length = numDirectionalShadows;
			state.directionalShadowMap.length = numDirectionalShadows;
			state.pointShadow.length = numPointShadows;
			state.pointShadowMap.length = numPointShadows;
			state.spotShadow.length = numSpotShadows;
			state.spotShadowMap.length = numSpotShadows;
			state.directionalShadowMatrix.length = numDirectionalShadows;
			state.pointShadowMatrix.length = numPointShadows;
			state.spotShadowMatrix.length = numSpotShadows;
			
			state.directionalMap.length = numDirectionalMaps;
			state.directionalMapMatrix.length = numDirectionalMaps;
			state.spotMap.length = numSpotMaps;
			state.spotMapMatrix.length = numSpotMaps;
			
			state.numLightProbes = numLightProbes;

			hash.directionalLength = directionalLength;
			hash.pointLength = pointLength;
			hash.spotLength = spotLength;
			hash.rectAreaLength = rectAreaLength;
			hash.hemiLength = hemiLength;

			hash.numDirectionalShadows = numDirectionalShadows;
			hash.numPointShadows = numPointShadows;
			hash.numSpotShadows = numSpotShadows;
			
			hash.numDirectionalMaps = numDirectionalMaps;
			hash.numSpotMaps = numSpotMaps;
			hash.numLightProbes = numLightProbes;

			state.staticSamplerUnitCount = 0;
			if( state.directionalMap.length>0 ){
				staticSamplers["directionalMap[0]"] = state.directionalMap.map(function(){
					return state.staticSamplerUnitCount++;
				});
			}else{
				delete staticSamplers["directionalMap[0]"];
			}
			if( state.spotMap.length>0 ){
				staticSamplers["spotMap[0]"] = state.spotMap.map(function(){
					return state.staticSamplerUnitCount++;
				});
			}else{
				delete staticSamplers["spotMap[0]"];
			}
			if( state.directionalShadowMap.length>0 ){
				staticSamplers["directionalShadowMap[0]"] = state.directionalShadowMap.map(function(){
					return state.staticSamplerUnitCount++;
				});
			}else{
				delete staticSamplers["directionalShadowMap[0]"];
			}
			if( state.pointShadowMap.length>0 ){
				staticSamplers["pointShadowMap[0]"] = state.pointShadowMap.map(function(){
					return state.staticSamplerUnitCount++;
				});
			}else{
				delete staticSamplers["pointShadowMap[0]"];
			}
			if( state.spotShadowMap.length>0 ){
				staticSamplers["spotShadowMap[0]"] = state.spotShadowMap.map(function(){
					return state.staticSamplerUnitCount++;
				});
			}else{
				delete staticSamplers["spotShadowMap[0]"];
			}
			
			state.version = nextVersion ++;

		}

	}

	function setupView( lights, camera ) {

		let directionalLength = 0;
		let pointLength = 0;
		let spotLength = 0;
		let rectAreaLength = 0;
		let hemiLength = 0;

		const viewMatrix = camera.matrixWorldInverse;

		for ( let i = 0, l = lights.length; i < l; i ++ ) {

			const light = lights[ i ];

			if( !light.lightInUse ) continue;

			if ( light.isDirectionalLight ) {

				const uniforms = state.directional[ directionalLength ];

				if(light.map){
					const cam = light.shadow.camera;
					const dimension = light.mapDimension || cam;
					light.mapMatrix.makeOrthographic(
						dimension.left,
						dimension.right,
						dimension.top,
						dimension.bottom,
						1, 10 )
					.multiply(cam.matrixWorldInverse)
					.multiply(camera.matrixWorld);
				}

				uniforms.direction.setFromMatrixPosition( light.matrixWorld );
				vector3.setFromMatrixPosition( light.target.matrixWorld );
				uniforms.direction.sub( vector3 );
				uniforms.direction.transformDirection( viewMatrix );

				directionalLength ++;

			} else if ( light.isSpotLight ) {

				const uniforms = state.spot[ spotLength ];

				if(light.map){
					var tanAngle = Math.tan(light.angle);
					light.mapMatrix.makePerspective( -tanAngle, tanAngle, tanAngle, -tanAngle, 1, 10 );
					light.mapMatrix.multiply( matrix4.copy(light.matrixWorld).invert() );
					light.mapMatrix.multiply( camera.matrixWorld );
				}

				uniforms.position.setFromMatrixPosition( light.matrixWorld );
				uniforms.position.applyMatrix4( viewMatrix );

				uniforms.direction.setFromMatrixPosition( light.matrixWorld );
				vector3.setFromMatrixPosition( light.target.matrixWorld );
				uniforms.direction.sub( vector3 );
				uniforms.direction.transformDirection( viewMatrix );

				spotLength ++;

			} else if ( light.isRectAreaLight ) {

				const uniforms = state.rectArea[ rectAreaLength ];

				uniforms.position.setFromMatrixPosition( light.matrixWorld );
				uniforms.position.applyMatrix4( viewMatrix );

				// extract local rotation of light to derive width/height half vectors
				matrix42.identity();
				matrix4.copy( light.matrixWorld );
				matrix4.premultiply( viewMatrix );
				matrix42.extractRotation( matrix4 );

				uniforms.halfWidth.set( light.width * 0.5, 0.0, 0.0 );
				uniforms.halfHeight.set( 0.0, light.height * 0.5, 0.0 );

				uniforms.halfWidth.applyMatrix4( matrix42 );
				uniforms.halfHeight.applyMatrix4( matrix42 );

				rectAreaLength ++;

			} else if ( light.isPointLight ) {

				const uniforms = state.point[ pointLength ];

				uniforms.position.setFromMatrixPosition( light.matrixWorld );
				uniforms.position.applyMatrix4( viewMatrix );

				pointLength ++;

			} else if ( light.isHemisphereLight ) {

				const uniforms = state.hemi[ hemiLength ];

				uniforms.direction.setFromMatrixPosition( light.matrixWorld );
				uniforms.direction.transformDirection( viewMatrix );

				hemiLength ++;

			}

		}

	}

	return {
		setup: setup,
		setupView: setupView,
		state: state,
		staticSamplers: staticSamplers
	};

}


export { WebGLLights };
