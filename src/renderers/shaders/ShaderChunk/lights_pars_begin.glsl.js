export default /* glsl */`
uniform bool receiveShadow;

// get the irradiance (radiance convolved with cosine lobe) at the point 'normal' on the unit sphere
// source: https://graphics.stanford.edu/papers/envmap/envmap.pdf
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {

	// normal is assumed to have unit length

	float x = normal.x, y = normal.y, z = normal.z;

	// band 0
	vec3 result = shCoefficients[ 0 ] * 0.886227;

	// band 1
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;

	// band 2
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );

	return result;

}

vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {

	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );

	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );

	return irradiance;

}

vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {

	vec3 irradiance = ambientLightColor;

	return irradiance;

}

float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {

	// based upon Frostbite 3 Moving to Physically-based Rendering
	// page 32, equation 26: E[window1]
	// https://seblagarde.files.wordpress.com/2015/07/course_notes_moving_frostbite_to_pbr_v32.pdf
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.5 );

	if ( cutoffDistance > 0.0 ) {

		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );

	}

	return distanceFalloff;

}

float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {

	return smoothstep( coneCosine, penumbraCosine, angleCosine );

}

#if NUM_DIR_LIGHTS > 0

#if NUM_DIRECTIONAL_MAP > 0
	uniform sampler2D directionalMap[ NUM_DIRECTIONAL_MAP ];
	
	vec4 sampleDirectionalMap( int index, vec2 uv ){
		vec4 r = vec4( 1, 1, 1, 1 );
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIRECTIONAL_MAP; i ++ ) {
			if( UNROLLED_LOOP_INDEX == index ) r = texture2D( directionalMap[ i ], uv );
		}
		#pragma unroll_loop_end
		return r;
	}
#endif

	struct DirectionalLight {
		vec3 direction;
		vec3 color;
		#if NUM_DIRECTIONAL_MAP > 0
		int map;
		#endif
	};

	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {

		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;

	}

#endif


#if NUM_POINT_LIGHTS > 0

	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};

	// light is an out parameter as having it as a return value caused compiler errors on some devices
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {

		vec3 lVector = pointLight.position - geometryPosition;

		light.direction = normalize( lVector );

		float lightDistance = length( lVector );

		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );

	}

#endif


#if NUM_SPOT_LIGHTS > 0

	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
#if NUM_SPOT_MAP > 0
		int map;
#endif
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};

	
#if NUM_SPOT_MAP > 0
	uniform sampler2D spotMap[ NUM_SPOT_MAP ];
	
	vec4 sampleSpotMap( int index, vec2 uv ){
		vec4 r = vec4( 1, 1, 1, 1 );
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_SPOT_MAP; i ++ ) {
			if( UNROLLED_LOOP_INDEX == index ) r = texture2D( spotMap[ i ], uv );
		}
		#pragma unroll_loop_end
		return r;
	}
#endif


	// light is an out parameter as having it as a return value caused compiler errors on some devices
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {

		vec3 lVector = spotLight.position - geometryPosition;

		light.direction = normalize( lVector );

		float angleCos = dot( light.direction, spotLight.direction );

		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );

		if ( spotAttenuation > 0.0 ) {

			float lightDistance = length( lVector );

			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );

		} else {

			light.color = vec3( 0.0 );
			light.visible = false;

		}

	}

#endif


#if NUM_RECT_AREA_LIGHTS > 0

	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};

	// Pre-computed values of LinearTransformedCosine approximation of BRDF
	// BRDF approximation Texture is 64x64
	uniform sampler2D ltc_1; // RGBA Float
	uniform sampler2D ltc_2; // RGBA Float

#endif


#if NUM_HEMI_LIGHTS > 0

	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};

	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {

		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;

		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );

		return irradiance;

	}

#endif

layout (std140) uniform LightBlock {
	vec3 ambientLightColor;

	#if defined( USE_LIGHT_PROBES )
		vec3 lightProbe[ 9 ];
	#endif

#if NUM_DIR_LIGHTS > 0

#if NUM_DIRECTIONAL_MAP > 0
	mat4 directionalMapMatrix[ NUM_DIRECTIONAL_MAP ];
#endif
	DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
#endif

#if NUM_POINT_LIGHTS > 0
	PointLight pointLights[ NUM_POINT_LIGHTS ];
#endif

#if NUM_SPOT_LIGHTS > 0
	SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	
#if NUM_SPOT_MAP > 0
	mat4 spotMapMatrix[ NUM_SPOT_MAP ];
#endif
#endif

#if NUM_RECT_AREA_LIGHTS > 0
	RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif

#if NUM_HEMI_LIGHTS > 0
	HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
#endif

};

#include <lightprobes_pars_fragment>
`;
