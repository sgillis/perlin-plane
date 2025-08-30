import { Point, Edge, HalfEdge, Face } from './geometry.js';

export class State {
    constructor(p, width=800, height=600) {
        this.points = new Map();
        this.edges = [];
        this.p = p;
        this.index = 0;
        this.collided = false;
        this.faces = null;
        this.faces_to_draw = null;
        this.width = width;
        this.height = height;
    }

    initialize_frame() {
        this.edges = [];
        this.faces = null;
        this.faces_to_draw = null;
        this.index = 0
        const r1 = this.add_dot(null, 0, 0);
        const r2 = this.add_dot(r1.point, this.width, 0);
        const r3 = this.add_dot(r2.point, this.width, this.height);
        const r4 = this.add_dot(r3.point, 0, this.height);
        this.add_dot(r4.point, 0, 0);
    }

    find_faces() {
        // First, create half-edges from existing edges
        const halfEdges = [];

        for (const edge of this.edges) {
            const pointA = this.points.get(edge.a);
            const pointB = this.points.get(edge.b);
            if(!this.isOuterEdge(pointA, pointB)) {
                const halfEdge1 = new HalfEdge(pointA, pointB);
                const halfEdge2 = new HalfEdge(pointB, pointA);
                // Set twin relationships
                halfEdge1.twin = halfEdge2;
                halfEdge2.twin = halfEdge1;
                halfEdges.push(halfEdge1, halfEdge2);
            } else {
                // To make it left hand turns, switch A and B
                const outerHalfEdge = new HalfEdge(pointB, pointA)
                halfEdges.push(outerHalfEdge)
            }
        }

        // Group half-edges by their origin vertex
        const vertexToHalfEdges = new Map();

        for (const halfEdge of halfEdges) {
            if (!vertexToHalfEdges.has(halfEdge.origin)) {
            vertexToHalfEdges.set(halfEdge.origin, []);
            }
            vertexToHalfEdges.get(halfEdge.origin).push(halfEdge);
        }

        // Continuously look for halfEdges that are not yet used (by checking halfEdge.used which
        // will be updated by addNextHalfEdge), take the first unused one and
        // create a new face. Keep calling addNextHalfEdge until it returns null, indicating the
        // face is done
        const faces = [];

        for (const halfEdge of halfEdges) {
            if (!halfEdge.used) {
                // Create a new face starting with this unused half-edge
                const face = new Face(halfEdge);
                halfEdge.used = true;

                // Continue adding half-edges to complete the face
                let currentVertex = face.addNextHalfEdge(vertexToHalfEdges.get(halfEdge.end) || []);

                while (currentVertex !== null) {
                    const availableHalfEdges = vertexToHalfEdges.get(currentVertex) || [];
                    const unusedHalfEdges = availableHalfEdges.filter(he => !he.used);
                    currentVertex = face.addNextHalfEdge(unusedHalfEdges);
                }

                faces.push(face);
            }
        }

        this.faces = faces;
    }

    isOuterEdge(pointA, pointB) {
        const dx = pointA.x - pointB.x;
        const dy = pointA.y - pointB.y;
        const threshold = 0.00001;
        if(Math.abs(dy) < threshold && pointA.y < threshold && dx < 0) {
            return true;
        } else if(Math.abs(dy) < threshold && Math.abs(pointA.y - this.height) < threshold && dx > 0) {
            return true;
        } else if(Math.abs(dx) < threshold && pointA.x < threshold && dy > 0) {
            return true;
        } else if(Math.abs(dx) < threshold && Math.abs(pointA.x - this.width) < threshold && dy < 0) {
            return true;
        }
        return false;
    }

    add_dot(lastDot, x, y) {
        let newPoint = new Point(this.index, x, y);
        if (lastDot == null) {
            this.points.set(this.index, newPoint)
            this.index++;
            return {collision: false, point: newPoint}
        } else {
            let intersection = this.findIntersections(lastDot, newPoint);
            if (intersection == null) {
                this.edges.push(new Edge(lastDot.index, this.index))
                this.points.set(this.index, newPoint)
                this.index++;
                return {collision: false, point: newPoint};
            } else if (intersection.intersection.type == 'endpoint') {
                // Handle endpoint intersection - connect to existing point
                const existingPoint = this.findExistingPoint(intersection.intersection);
                this.edges.push(new Edge(lastDot.index, existingPoint.index));
                return {collision: true, point: existingPoint};
            } else {
                this.points.set(this.index, intersection.point)
                // Add edge from lastDot to intersection point
                this.edges.push(new Edge(lastDot.index, this.index));
                // Find and remove the intersected edge
                const intersectedEdgeIndex = this.edges.findIndex(edge => edge === intersection.edge);
                if (intersectedEdgeIndex !== -1) {
                    this.edges.splice(intersectedEdgeIndex, 1);
                    // Split the intersected edge into two parts
                    this.edges.push(new Edge(intersection.edge.a, this.index));
                    this.edges.push(new Edge(this.index, intersection.edge.b));
                }
                this.index++;
                return {collision: true, point: intersection.point};
            }
        }
    }

    // Draw all edges using stored point indices
    draw_edges() {
        const p = this.p
        p.push()
        p.stroke(180)
        p.strokeWeight(2)
        for (const edge of this.edges) {
            const pa = this.points.get(edge.a)
            const pb = this.points.get(edge.b)
            if (pa && pb) {
                p.line(pa.x, pa.y, pb.x, pb.y)
            }
        }
        p.pop()
    }

    draw_faces() {
        if (!this.faces || this.faces.length === 0) {
            return;
        }

        this.p.push();
        this.p.strokeWeight(0);

        // Draw each face with a different color

        for (let i = 0; i < this.faces.length; i++) {
            const face = this.faces[i];

            if(this.faces_to_draw != null) {
                if (!this.faces_to_draw.includes(i)) {
                    continue;
                }
            }

            if(face.halfEdges.length === 2) {
                // console.log('weird face found')
                continue;
            }
            this.draw_face(face, this.p)
        }

        this.p.pop();
    }

    draw_face(face, p) {
        // Generate a color based on face index
        p.stroke(0); // Black stroke
        p.strokeWeight(1); // Very thin, subtle stroke
        p.stroke(face.getStrokeColor(this.width, this.height)); // Use face color for stroke
        // const hue = (i * 137.5) % 360; // Golden angle for good color distribution
        // p.fill(hue, 60, 90, 100); // HSB color with transparency
        p.fill(p.color(face.getColor(this.width, this.height)))
        // p.stroke(hue, 80, 70);

        // Draw the face as a polygon
        p.beginShape();
        for (const halfEdge of face.halfEdges) {
            if (halfEdge && halfEdge.origin) {
                p.vertex(halfEdge.origin.x, halfEdge.origin.y);
            }
        }
        p.endShape(p.CLOSE);
    }

    draw_vertices(p) {
        for (let state_point of this.points.values()) {
            p.fill(p.color(200, 200, 200))
            p.noStroke()
            p.circle(state_point.x, state_point.y, 10)
            p.fill(p.color(0, 0, 0))
            p.textAlign(p.CENTER, p.CENTER)
            p.text(state_point.index, state_point.x, state_point.y)
        }
    }

    findIntersections(p1, p2) {
        // for all edges, try to find intersections. if there are multiple, return the point
        // closest to p1 as the intersection point
        let closestIntersection = null
        let closestDistance = Infinity

        for (const edge of this.edges) {
            const pa = this.points.get(edge.a)
            const pb = this.points.get(edge.b)

            if (pa && pb && pb !== p1 && pa !== p1) {
                const intersection = this.findIntersection(p1, p2, pa, pb)

                if (intersection) {
                    // Calculate distance from p1 to intersection
                    const dx = intersection.x - p1.x
                    const dy = intersection.y - p1.y
                    const distance = Math.sqrt(dx * dx + dy * dy)

                    if (distance < closestDistance) {
                        closestDistance = distance
                        closestIntersection = {
                            point: new Point(this.index, intersection.x, intersection.y),
                            distance: distance,
                            edge: edge,
                            intersection: intersection
                        }
                    }
                }
            }
        }
        return closestIntersection
    }

    findIntersection(a, b, c, d) {
        // Find intersection between line segments a-b and c-d
        // a, b, c, d are Points or any objects with {x, y}
        const eps = 1e-9
        const ax = a.x, ay = a.y
        const bx = b.x, by = b.y
        const cx = c.x, cy = c.y
        const dx = d.x, dy = d.y

        const rx = bx - ax, ry = by - ay
        const sx = dx - cx, sy = dy - cy

        const cross = (x1, y1, x2, y2) => x1 * y2 - y1 * x2

        const rxs = cross(rx, ry, sx, sy)
        const qpx = cx - ax, qpy = cy - ay
        const qpxr = cross(qpx, qpy, rx, ry)

        // Colinear case
        if (Math.abs(rxs) < eps && Math.abs(qpxr) < eps) {
            // Project onto r to check overlap
            const rr = rx * rx + ry * ry
            // If segment AB is a point
            if (rr < eps) {
                // Both segments are points or AB is a point
                const dist2 = (ax - cx) * (ax - cx) + (ay - cy) * (ay - cy)
                return dist2 < eps ? { x: ax, y: ay, type: 'overlap-point' } : null
            }
            const t0 = (qpx * rx + qpy * ry) / rr
            const t1 = t0 + (sx * rx + sy * ry) / rr
            const tmin = Math.max(0, Math.min(t0, t1))
            const tmax = Math.min(1, Math.max(t0, t1))
            if (tmax < -eps || tmin > 1 + eps) return null // no overlap
            // Return an endpoint within the overlap (touching or overlapping)
            const clamp01 = (v) => Math.max(0, Math.min(1, v))
            const t = clamp01(t0)
            return { x: ax + t * rx, y: ay + t * ry, type: 'colinear-overlap' }
        }

        // Parallel non-intersecting
        if (Math.abs(rxs) < eps) return null

        // Compute intersection parameters
        const t = cross(qpx, qpy, sx, sy) / rxs
        const u = cross(qpx, qpy, rx, ry) / rxs

        // Check if within both segments (inclusive, with epsilon)
        if (t >= -eps && t <= 1 + eps && u >= -eps && u <= 1 + eps) {
            const ix = ax + t * rx
            const iy = ay + t * ry
            const proper = (t > eps && t < 1 - eps && u > eps && u < 1 - eps)
            return { x: ix, y: iy, t, u, type: proper ? 'proper' : 'endpoint' }
        }

        return null
    }

    findExistingPoint(p) {
        // Find a point that has the same x and y and return that
        const eps = 1e-9;
        for (const [index, point] of this.points) {
            if (Math.abs(point.x - p.x) < eps && Math.abs(point.y - p.y) < eps) {
                return point;
            }
        }
        return null;
    }

    calculateAngle(edge1, edge2) {
        // Calculate the angle between edge1 and edge2
        const p1 = this.points.get(edge1.a);
        const p2 = this.points.get(edge1.b);
        const p3 = this.points.get(edge2.a);
        const p4 = this.points.get(edge2.b);

        if (!p1 || !p2 || !p3 || !p4) return 0;

        // Get direction vectors for each edge
        const v1x = p2.x - p1.x;
        const v1y = p2.y - p1.y;
        const v2x = p4.x - p3.x;
        const v2y = p4.y - p3.y;

        // Calculate dot product and magnitudes
        const dot = v1x * v2x + v1y * v2y;
        const mag1 = Math.sqrt(v1x * v1x + v1y * v1y);
        const mag2 = Math.sqrt(v2x * v2x + v2y * v2y);

        if (mag1 === 0 || mag2 === 0) return 0;

        // Calculate angle in radians using arccos
        const cosAngle = dot / (mag1 * mag2);
        // Clamp to avoid floating point errors
        const clampedCos = Math.max(-1, Math.min(1, cosAngle));

        return Math.acos(clampedCos);
    }

    radiansToDegrees(radians) {
        return radians * (180 / Math.PI);
    }

    calculateClockwiseAngle(edge1, edge2) {
        // Calculate the clockwise angle between edge1 and edge2. edge1.b should be equal to edge2.a
        const p1 = this.points.get(edge1.a);
        const p2 = this.points.get(edge1.b);
        const p3 = this.points.get(edge2.b);

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
        } else if((angle2 >= 0) && (0 > angle1)) {
            angle = angle2 - angle1 - Math.PI;
        } else if((0 > angle2) && (angle2 >= angle1)) {
            angle = Math.PI - angle1 + angle2;
        } else if((angle1 >= angle2) && (angle2 >=0)) {
            angle =  Math.PI - angle1 + angle2;
        } else if((angle1 >= 0) && (0 > angle2)) {
            angle = Math.PI - angle1 + angle2;
        } else if((0 > angle1) && (angle1 >= angle2)) {
            angle = Math.PI + angle2 - angle1;
        }
        if (angle < 0) {
            return angle + 2 * Math.PI;
        }
        return angle;
    }
}
