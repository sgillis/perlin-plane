export class ManualAgent {
    constructor(state) {
        this.lastDot = null;
        this.startDot = null;
        this.collided = false;
        this.state = state;
    }

    draw_phantom_edge(p) {
        // if this.lastDot is set, draw a phantom edge from lastDot to mouse position
        if (this.lastDot) {
            p.push();
            p.stroke(100, 100, 255, 150); // Semi-transparent blue
            p.strokeWeight(1);
            p.line(this.lastDot.x, this.lastDot.y, p.mouseX, p.mouseY);
            p.pop();
        }
    }

    add_dot(x, y) {
        const result = this.state.add_dot(this.lastDot, x, y);

        if(this.lastDot == null) {
            this.lastDot = result.point;
            this.startDot = result.point;
        } else if(!result.collision) {
            this.lastDot = result.point;
        } else if (result.collision && !this.collided) {
            this.collided = true;
            this.angle = this.initialAngle;
            this.currentX = this.initialX;
            this.currentY = this.initialY;
            this.direction = Math.PI;
            this.lastDot = this.startDot;
        } else if (result.collision && this.collided) {
            this.lastDot = null;
            this.startDot = null;
            this.collided = false;
        }

    }

    add_at_collision(x, y) {
        if (this.lastDot) {
            // Calculate direction vector from lastDot to (x, y)
            const dx = x - this.lastDot.x;
            const dy = y - this.lastDot.y;

            // Calculate the length of the direction vector
            const length = Math.sqrt(dx * dx + dy * dy);

            // If the length is not zero, normalize and extend to 10000
            if (length > 0) {
                const unitX = dx / length;
                const unitY = dy / length;

                // Calculate new point 10000 units away in the same direction
                const p3x = this.lastDot.x + unitX * 10000;
                const p3y = this.lastDot.y + unitY * 10000;

                this.add_dot(p3x, p3y);
            }
        }
    }
}
