export class Agent {
    constructor(perlin, jitter = 0) {
        this.perlin = perlin;
        this.done = false;
        this.collided = false;
        this.stepSize = 5;
        this.currentX = Math.random() * 800;
        this.currentY = Math.random() * 600;
        this.initialX = this.currentX;
        this.initialY = this.currentY;
        this.angle = perlin.getValue(this.currentX, this.currentY);
        this.initialAngle = this.angle;
        this.direction = 0;
        this.noiseScale = 0.1;
        this.lastDot = null;
        this.startDot = null;
        this.jitter = jitter
    }

    update(state) {
        if (this.done) return;

        // this.simpleUpdateAngle()
        this.nudgeUpdateAngle()

        const dx = Math.cos(this.angle) * this.stepSize;
        const dy = Math.sin(this.angle) * this.stepSize;

        this.currentX += dx;
        this.currentY += dy;

        const result = state.add_dot(this.lastDot, this.currentX, this.currentY);

        if (this.currentX < -10 * this.stepSize || this.currentX > state.width + 10 * this.stepSize ||
            this.currentY < -10 * this.stepSize || this.currentY > state.height + 10 * this.stepSize) {
            return "unknown state";
        }

        if(this.lastDot == null) {
            this.lastDot = result.point;
            this.startDot = result.point;
        } else if(!result.collision) {
            this.lastDot = result.point;
        } else if (result.collision && !this.collided) {
            this.collided = true;
            this.angle = this.initialAngle + Math.PI;
            this.currentX = this.initialX;
            this.currentY = this.initialY;
            this.direction = Math.PI;
            this.lastDot = this.startDot;
        } else if (result.collision && this.collided) {
            this.done = true;
            return 'done';
        }
    }

    simpleUpdateAngle() {
        const perlinAngle = this.perlin.getValue(this.currentX, this.currentY);
        const noise = (Math.random() * 2 - 1) * this.jitter;
        this.angle = perlinAngle + this.direction + noise;
    }

    nudgeUpdateAngle() {
        const perlinAngle = this.perlin.getValue(this.currentX, this.currentY);
        // calculate the difference between this.angle and perlinAngle, clamped between pi and -pi
        // update this.angle so that it will be nudged towards perlinAngle. The nudge is bigger the
        // bigger the difference between the two
        let angleDiff = perlinAngle - this.angle;

        // Normalize angle difference to be between -π and π
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

        // Nudge factor based on the difference (larger difference = bigger nudge)
        const nudgeFactor = 0.3;
        const nudgeAmount = angleDiff * nudgeFactor;

        // Apply jitter
        const noise = (Math.random() * 2 - 1) * this.jitter;

        this.angle += nudgeAmount + noise;
    }
}
