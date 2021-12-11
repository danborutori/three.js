export default /* glsl */`
#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif

// https://github.com/mrdoob/three.js/pull/22425
#ifdef USE_TRANSMISSION
diffuseColor.a *= transmissionAlpha + 0.1;
#endif

gl_FragColor = vec4( outgoingLight, diffuseColor.a );
#ifdef gl_FragNormal
gl_FragNormal = vec4( normal*0.5+0.5, diffuseColor.a );
#endif
#ifdef gl_FragMetalness
gl_FragMetalness = vec4( roughnessFactor, metalnessFactor, 0, diffuseColor.a );
#endif
#ifdef gl_FragDiffuseColor
gl_FragDiffuseColor = diffuseColor;
#endif
`;
