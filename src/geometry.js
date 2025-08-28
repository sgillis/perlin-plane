export class Point {
    constructor(index, x, y) {
        this.index = index;
        this.x = x;
        this.y = y;
    }
}

export class Edge {
    constructor(index1, index2) {
        this.a = index1;
        this.b = index2;
    }
}

export class HalfEdge {
    constructor(point1, point2) {
        this.origin = point1;
        this.end = point2;
        this.used = false;
        this.twin = null;
    }

    calculateClockwiseAngle(halfEdge2) {
        // Calculate the clockwise angle between edge1 and edge2. edge1.b should be equal to edge2.a
        const p1 = this.origin;
        const p2 = halfEdge2.origin;
        const p3 = halfEdge2.end;

        if (!p1 || !p2 || !p3) return 0;

        // Get direction vectors
        const v1x = p2.x - p1.x;
        const v1y = p2.y - p1.y;
        const v2x = p3.x - p2.x;
        const v2y = p3.y - p2.y;

        // Calculate angle using atan2 for proper clockwise measurement
        const angle1 = Math.atan2(v1y, v1x);
        const angle2 = Math.atan2(v2y, v2x);

        var angle
        if ((angle2 >= angle1) && (angle1 >= 0)) {
            angle = Math.PI + angle2 - angle1;
        } else if ((angle2 >= 0) && (0 > angle1)) {
            angle = angle2 - angle1 - Math.PI;
        } else if ((0 > angle2) && (angle2 >= angle1)) {
            angle = Math.PI - angle1 + angle2;
        } else if ((angle1 >= angle2) && (angle2 >= 0)) {
            angle = Math.PI - angle1 + angle2;
        } else if ((angle1 >= 0) && (0 > angle2)) {
            angle = Math.PI - angle1 + angle2;
        } else if ((0 > angle1) && (angle1 >= angle2)) {
            angle = Math.PI + angle2 - angle1;
        }
        if (angle < 0) {
            return angle + 2 * Math.PI;
        }
        return angle;
    }

}

export class Face {
    constructor(halfEdge) {
        this.halfEdges = [halfEdge];
        this.latestHalfEdge = halfEdge;
        this.startingPoint = halfEdge.origin;
    }

    addNextHalfEdge(halfEdges) {
        // sort the halfEdges on the smallest calculateClockwiseAngle from this.latestHalfEdge,
        // pick the smallest one, add that to the face. Set used to the half edge that was chosen
        let smallestAngle = Infinity;
        let chosenHalfEdge = null;

        // remove the edges of which this.latestHalfEdge is the twin
        const filteredHalfEdges =
            halfEdges.filter(halfEdge => halfEdge !== this.latestHalfEdge.twin);
        for (const halfEdge of filteredHalfEdges) {
            const angle = this.latestHalfEdge.calculateClockwiseAngle(halfEdge);
            if (angle < smallestAngle) {
                smallestAngle = angle;
                chosenHalfEdge = halfEdge;
            }
        }

        if (chosenHalfEdge) {
            chosenHalfEdge.used = true;
            this.latestHalfEdge = chosenHalfEdge;
            this.halfEdges.push(chosenHalfEdge);
            if (chosenHalfEdge.end === this.startingPoint) {
                return null;
            } else {
                return chosenHalfEdge.end;
            }
        } else {
            return null
        }
    }
}
