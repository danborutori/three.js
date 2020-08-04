export default /* glsl */`
#if defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )

	vColor = vec4( 1.0 );

#endif

#ifdef USE_COLOR

	vColor.xyzw *= color.xyzw;

#endif

#ifdef USE_INSTANCING_COLOR

	vColor.xyzw *= vec4(instanceColor.xyz,1);

#endif
`;
