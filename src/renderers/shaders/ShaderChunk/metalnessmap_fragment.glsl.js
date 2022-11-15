export default /* glsl */`
float metalnessFactor = metalness;

#ifdef USE_METALNESSMAP

	// reads channel B, compatible with a combined OcclusionRoughnessMetallic (RGB) texture
	metalnessFactor *= texelRoughMetalness.b;

#endif
`;
