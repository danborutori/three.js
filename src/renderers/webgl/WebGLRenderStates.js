/**
 * @author Mugen87 / https://github.com/Mugen87
 */

import { WebGLLights } from './WebGLLights.js';

function WebGLRenderState( staticLightConfig ) {
	
	const lights = new WebGLLights( staticLightConfig );

	const lightsArray = [];
	const shadowsArray = [];

	function init() {

		lightsArray.length = 0;
		shadowsArray.length = 0;

	}

	function pushLight( light ) {

		lightsArray.push( light );

	}

	function pushShadow( shadowLight ) {

		shadowsArray.push( shadowLight );

	}

	function setupLights( camera ) {

		lights.setup( lightsArray, shadowsArray, camera );

	}

	const state = {
		lightsArray: lightsArray,
		shadowsArray: shadowsArray,

		lights: lights
	};

	return {
		init: init,
		state: state,
		setupLights: setupLights,

		pushLight: pushLight,
		pushShadow: pushShadow
	};

}

function WebGLRenderStates( staticLightConfig ) {

	let renderStates = new WeakMap();

	function onSceneDispose( event ) {

		const scene = event.target;

		scene.removeEventListener( 'dispose', onSceneDispose );

		renderStates.delete( scene );

	}

	function get( scene, camera ) {

		let renderState;

		if ( renderStates.has( scene ) === false ) {

			renderState = new WebGLRenderState( staticLightConfig );
			renderStates.set( scene, new WeakMap() );
			renderStates.get( scene ).set( camera, renderState );

			scene.addEventListener( 'dispose', onSceneDispose );

		} else {

			if ( renderStates.get( scene ).has( camera ) === false ) {

				renderState = new WebGLRenderState( staticLightConfig );
				renderStates.get( scene ).set( camera, renderState );

			} else {

				renderState = renderStates.get( scene ).get( camera );

			}

		}

		return renderState;

	}

	function dispose() {

		renderStates = new WeakMap();

	}

	return {
		get: get,
		dispose: dispose
	};

}


export { WebGLRenderStates };
