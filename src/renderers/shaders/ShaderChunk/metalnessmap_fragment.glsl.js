export default /* glsl */`
float metalnessFactor = metalness;

#ifdef USE_METALNESSMAP

	metalnessFactor *= texelRoughMetalness.b;

#endif
`;
