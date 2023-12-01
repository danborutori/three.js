import { BufferGeometry } from '../core/BufferGeometry';
import { Material } from './../materials/Material';
import { Mesh } from './Mesh';
import { Matrix4 } from './../math/Matrix4';
import { Camera } from '../cameras/Camera';
import { Box3 } from '../math/Box3';
import { Sphere } from '../math/Sphere';

export class BatchedMesh extends Mesh {

    readonly isBatchedMesh: boolean;

    readonly maxGeometryCount: number;

	constructor(
        maxGeometryCount: number,
        maxVertexCount: number,
        maxIndexCount: number,
		material: Material | Material[]
	);

    setCustomSort( func: (batchedMesh: BatchedMesh, list: {start: number, count: number, z: number}[], camera: Camera )=>void ): void;
    addGeometry( geometry: BufferGeometry, vertexCount: number = -1, indexCount = -1 ): number;
    setGeometryAt( id: number, geometry: BufferGeometry ): number;
    deleteGeometry( geometryId: number ): this;
    getBoundingBoxAt( id: number, target: Box3): Box3;
    getBoundingSphereAt( id: number, target: Sphere): Sphere;
    setMatrixAt( geometryId: number, matrix: Matrix4 ): this;
    getMatrixAt( geometryId: number, matrix: Matrix4 ): Matrix4 | null;
    setVisibleAt( geometryId: number, value: boolean ): this;
    getVisibleAt( geometryId: number ): boolean;
    dispose(): void;

}