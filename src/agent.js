export class Agent {
    constructor(state, perlin) {
        this.state = state;
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
    }

    update() {
        if (this.done) return;

        const perlinAngle = this.perlin.getValue(this.currentX, this.currentY);
        this.angle = perlinAngle + this.direction;

        const dx = Math.cos(this.angle) * this.stepSize;
        const dy = Math.sin(this.angle) * this.stepSize;

        this.currentX += dx;
        this.currentY += dy;

        const result = this.state.agent_add_dot(this.currentX, this.currentY);

        if (result.state === 'collided') {
            this.angle = this.initialAngle;
            this.currentX = this.initialX;
            this.currentY = this.initialY;
            this.direction = Math.PI;
        } else if (result.state === 'done') {
            this.done = true;
            return 'done';
        }
    }
}
