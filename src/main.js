import './style.css'
import p5 from 'p5'
import { State } from './state.js'
import { Agent } from './agent.js'
import { Perlin } from './perlin.js'
import { ManualAgent } from './manual_agent.js'

window.addEventListener('load', () => {
    const agentSlider = document.getElementById('agent-slider');
    const agentCount = document.getElementById('agent-count');
    const scaleXSlider = document.getElementById('scale-x-slider');
    const scaleXValue = document.getElementById('scale-x-value');
    const scaleYSlider = document.getElementById('scale-y-slider');
    const scaleYValue = document.getElementById('scale-y-value');
    const saveButton = document.getElementById('save-button');
    const resetButton = document.getElementById('reset-button');
    const canvasSizeSelect = document.getElementById('canvas-size-select');
    const nudgeFactorSlider = document.getElementById('nudge-factor-slider');
    const nudgeFactorValue = document.getElementById('nudge-factor-value');

    new p5((p) => {
        let nr_agents = 200;
        let agents = [];
        let canvasWidth = 800;
        let canvasHeight = 600;
        let state = new State(p, canvasWidth, canvasHeight);
        let perlin = new Perlin(canvasWidth, canvasHeight);
        let alternate_perlin = new Perlin(canvasWidth, canvasHeight);
        state.initialize_frame();
        let showPerlin = false;
        let showEdges = true;
        let showGuide = false;
        let manualAgent = new ManualAgent(state);
        let showVertices = false;
        let perlinScaleX = 100;
        let perlinScaleY = 100;
        let nudgeFactor = 0.3;
        window.state = state;

        const parseCanvasSize = (sizeValue) => {
            switch (sizeValue) {
                case '800x600': return { width: 800, height: 600 };
                case '1024x768': return { width: 1024, height: 768 };
                case '1280x720': return { width: 1280, height: 720 };
                case '1920x1080': return { width: 1920, height: 1080 };
                case '2560x1440': return { width: 2560, height: 1440 };
                case 'square-small': return { width: 500, height: 500 };
                case 'square-medium': return { width: 800, height: 800 };
                case 'square-large': return { width: 1000, height: 1000 };
                default: return { width: 800, height: 600 };
            }
        };

        const spawnAgents = () => {
            for (let i = 0; i < nr_agents; i++) {
                // Choose one perlin at random
                let chosenPerlin = Math.random() < 1.0 ? perlin : alternate_perlin;
                let maxNoise = 0.0;
                let pathNoise = Math.random() * maxNoise;
                let newAgent = new Agent(chosenPerlin, canvasWidth, canvasHeight, pathNoise, nudgeFactor);
                agents.push(newAgent);
            }
        };

        const resetCanvas = () => {
            // Clear all points from the Map
            state = new State(p, canvasWidth, canvasHeight);
            state.initialize_frame();
            window.state = state
            agents = [];
            perlin = new Perlin(canvasWidth, canvasHeight);
            alternate_perlin = new Perlin(canvasWidth, canvasHeight);
            perlin.generatePerlinMatrix(perlinScaleX, perlinScaleY);
            alternate_perlin.generatePerlinMatrix(perlinScaleX, perlinScaleY);
            manualAgent = new ManualAgent(state);
            showEdges = true;
            spawnAgents();
        };

        p.setup = () => {
            const canvas = p.createCanvas(canvasWidth, canvasHeight)
            const parent = document.querySelector('#app .card') || document.querySelector('#app') || document.body
            canvas.parent(parent);
            perlin.generatePerlinMatrix(perlinScaleX, perlinScaleY);
            alternate_perlin.generatePerlinMatrix(perlinScaleX, perlinScaleY);

            // Set up slider event listeners
            agentSlider.addEventListener('input', (e) => {
                nr_agents = parseInt(e.target.value);
                agentCount.textContent = nr_agents;
            });

            scaleXSlider.addEventListener('input', (e) => {
                perlinScaleX = parseInt(e.target.value);
                scaleXValue.textContent = perlinScaleX;
                // Regenerate perlin noise with new scale
                perlin.generatePerlinMatrix(perlinScaleX, perlinScaleY);
                alternate_perlin.generatePerlinMatrix(perlinScaleX, perlinScaleY);
            });

            scaleYSlider.addEventListener('input', (e) => {
                perlinScaleY = parseInt(e.target.value);
                scaleYValue.textContent = perlinScaleY;
                // Regenerate perlin noise with new scale
                perlin.generatePerlinMatrix(perlinScaleX, perlinScaleY);
                alternate_perlin.generatePerlinMatrix(perlinScaleX, perlinScaleY);
            });

            nudgeFactorSlider.addEventListener('input', (e) => {
                nudgeFactor = parseFloat(e.target.value);
                nudgeFactorValue.textContent = nudgeFactor;
            });

            saveButton.addEventListener('click', () => {
                p.saveCanvas('perlin-plane-' + Date.now(), 'jpg');
            });

            resetButton.addEventListener('click', () => {
                resetCanvas();
            });

            canvasSizeSelect.addEventListener('change', (e) => {
                const size = parseCanvasSize(e.target.value);
                canvasWidth = size.width;
                canvasHeight = size.height;
                p.resizeCanvas(canvasWidth, canvasHeight);
                // Reset the canvas after resizing to ensure proper initialization
                resetCanvas();
            });

            // Spawn initial agents
            spawnAgents();
        }

        p.draw = () => {
            for (let i = agents.length - 1; i >= 0; i--) {
                let updateResult = agents[i].update(state);
                if (updateResult === 'done') {
                    agents.splice(i, 1);
                }
                if (updateResult === 'unknown state') {
                    console.log(agents[i]);
                    agents.splice(i, 1);
                }
                if (agents.length === 0) {
                    console.log('done')
                    showEdges = false;
                    state.find_faces();
                }
            }
            p.background(20)
            // Draw perlin noise
            if (showPerlin) {
                perlin.draw_perlin(p);
            }
            // Draw all faces
            state.draw_faces();
            // Draw all edges
            if (showEdges) {
                state.draw_edges();
            }
            // Iterate Map values (points)
            if (showVertices) {
                state.draw_vertices(p);
            }
            if (showGuide) {
                manualAgent.draw_phantom_edge(p);
            }
        }

        p.mousePressed = () => {
            if (p.mouseX >= 0 && p.mouseX <= p.width && p.mouseY >= 0 && p.mouseY <= p.height) {
                manualAgent.add_dot(p.mouseX, p.mouseY)
            }
        }

        p.keyPressed = () => {
            if (p.key === 'r' || p.key === 'R') {
                resetCanvas();
            }
            if (p.key === 'b' || p.key === 'B') {
                manualAgent.add_at_collision(p.mouseX, p.mouseY)
            }
            if (p.key === ' ') {
                state.find_faces()
            }
            if (p.key === 'a') {
                spawnAgents();
            }
            if (p.key === 'p') {
                showPerlin = !showPerlin;
            }
            if (p.key === 'e') {
                showEdges = !showEdges;
            }
            if (p.key === 'g') {
                showGuide = !showGuide;
            }
            if (p.key === 'v') {
                showVertices = !showVertices;
            }
        }
    })
})
