export class Perlin {
    constructor(width = 800, height = 600, resolution = 1) {
        this.width = width;
        this.height = height;
        this.resolution = resolution;
        this.cols = Math.ceil(width / resolution) + 1;
        this.rows = Math.ceil(height / resolution) + 1;
        this.noise = 0.1;

        this.matrix = this.generateSmoothedMatrix();
    }

    generateSmoothedMatrix() {
        // Initialize matrix with null values
        const matrix = [];
        for (let y = 0; y < this.rows; y++) {
            matrix[y] = [];
            for (let x = 0; x < this.cols; x++) {
                matrix[y][x] = null;
            }
        }

        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (y > 0 && x > 0) {
                    const angle1 = matrix[y - 1][x - 1];
                    const angle2 = matrix[y - 1][x];
                    const angle3 = matrix[y][x - 1];
                    const noise = Math.random() * 2 * this.noise - this.noise;
                    const newAngle =
                        this.interpolateAngles(
                            this.interpolateAngles(angle1, angle2, 1), angle3, 1) + noise;
                    matrix[y][x] = newAngle;
                } else if (y > 0) {
                    const angle2 = matrix[y - 1][x];
                    const noise = Math.random() * 2 * this.noise - this.noise;
                    const newAngle = angle2 + noise;
                    matrix[y][x] = newAngle;
                } else if (x > 0) {
                    const angle = matrix[y][x - 1];
                    const noise = Math.random() * 2 * this.noise - this.noise;
                    const newAngle = angle + noise;
                    matrix[y][x] = newAngle;
                } else {
                    const initialValue = (Math.random() * 2 - 1) * Math.PI;
                    matrix[y][x] = initialValue;
                }
            }
        }

        // Start with a few seed points
        return matrix;
    }

    getValue(x, y) {
        // Clamp coordinates to valid range
        x = Math.max(0, Math.min(this.width, x));
        y = Math.max(0, Math.min(this.height, y));

        // Convert to matrix coordinates
        const matrixX = x / this.resolution;
        const matrixY = y / this.resolution;

        // Get the four surrounding grid points
        const x0 = Math.floor(matrixX);
        const x1 = Math.min(x0 + 1, this.cols - 1);
        const y0 = Math.floor(matrixY);
        const y1 = Math.min(y0 + 1, this.rows - 1);

        // Get interpolation weights
        const wx = matrixX - x0;
        const wy = matrixY - y0;

        // Get the four corner values
        const angle00 = this.matrix[y0][x0];
        const angle10 = this.matrix[y0][x1];
        const angle01 = this.matrix[y1][x0];
        const angle11 = this.matrix[y1][x1];

        // Bilinear interpolation using circular mean for angles
        const top = this.interpolateAngles(angle00, angle10, wx);
        const bottom = this.interpolateAngles(angle01, angle11, wx);
        const result = this.interpolateAngles(top, bottom, wy);

        return result;
    }

    interpolateAngles(angle1, angle2, weight) {
        return (angle1 + angle2) / 2
    }

    draw_perlin(p) {
        p.push();
        p.stroke(100, 100, 100, 150);
        p.strokeWeight(1);

        const spacing = 20; // Distance between arrows
        const arrowLength = 8;

        for (let x = 0; x < this.width; x += spacing) {
            for (let y = 0; y < this.height; y += spacing) {
                const angle = this.getValue(x, y);

                // Calculate arrow endpoints
                const x1 = x - Math.cos(angle) * arrowLength / 2;
                const y1 = y - Math.sin(angle) * arrowLength / 2;
                const x2 = x + Math.cos(angle) * arrowLength / 2;
                const y2 = y + Math.sin(angle) * arrowLength / 2;

                // Draw arrow line
                p.line(x1, y1, x2, y2);

                // Draw arrowhead
                const headLength = 3;
                const headAngle = Math.PI / 6; // 30 degrees

                const leftX = x2 - Math.cos(angle - headAngle) * headLength;
                const leftY = y2 - Math.sin(angle - headAngle) * headLength;
                const rightX = x2 - Math.cos(angle + headAngle) * headLength;
                const rightY = y2 - Math.sin(angle + headAngle) * headLength;

                p.line(x2, y2, leftX, leftY);
                p.line(x2, y2, rightX, rightY);
            }
        }

        p.pop();
    }
}
