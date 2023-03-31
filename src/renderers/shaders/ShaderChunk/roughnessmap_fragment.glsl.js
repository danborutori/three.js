export default /* glsl */`
float roughnessFactor = roughness;

#if defined( USE_ROUGHNESSMAP ) || defined( USE_METALNESSMAP )
vec4 texelRoughMetalness = texture2D( roughnessMap, vRoughnessMapUv );
#endif

#ifdef USE_ROUGHNESSMAP

	// reads channel G, compatible with a combined OcclusionRoughnessMetallic (RGB) texture
	roughnessFactor *= texelRoughMetalness.g;

#endif
`;
