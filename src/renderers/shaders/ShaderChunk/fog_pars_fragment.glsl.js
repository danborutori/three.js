export default /* glsl */`
#ifdef USE_FOG

	layout (std140) uniform FogBlock{
		vec3 fogColor;

		#ifdef FOG_EXP2

			float fogDensity;

		#else

			float fogNear;
			float fogFar;

		#endif
	};
	varying float fogDepth;

#endif
`;
