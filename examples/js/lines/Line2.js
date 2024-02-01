( function () {

    const LineSegments2 = THREE.LineSegments2;
    const LineGeometry = THREE.LineGeometry;
    const LineMaterial = THREE.LineMaterial;

    class Line2 extends LineSegments2 {

        constructor( geometry = new LineGeometry(), material = new LineMaterial( { color: Math.random() * 0xffffff } ) ) {

            super( geometry, material );

            this.isLine2 = true;

            this.type = 'Line2';

        }

    }

    THREE.Line2 = Line2;

} )();