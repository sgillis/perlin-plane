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

    new p5((p) => {
        let nr_agents = 200;
        let agents = [];
        let state = new State(p);
        let perlin = new Perlin();
        let alternate_perlin = new Perlin();
        state.initialize_frame();
        let showPerlin = false;
        let showEdges = true;
        let showGuide = false;
        let manualAgent = new ManualAgent(state);
        let showVertices = false;
        let perlinScaleX = 100;
        let perlinScaleY = 100;
        window.state = state;

        p.setup = () => {
            const canvas = p.createCanvas(800, 600)
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
            
            saveButton.addEventListener('click', () => {
                p.saveCanvas('p5-flow-' + Date.now(), 'jpg');
            });
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
                // Clear all points from the Map
                state = new State(p);
                state.initialize_frame();
                window.state = state
                agents = [];
                perlin = new Perlin();
                alternate_perlin = new Perlin();
                perlin.generatePerlinMatrix(perlinScaleX, perlinScaleY);
                alternate_perlin.generatePerlinMatrix(perlinScaleX, perlinScaleY);
                manualAgent = new ManualAgent(state);
                showEdges = true;
            }
            if (p.key === 'b' || p.key === 'B') {
                manualAgent.add_at_collision(p.mouseX, p.mouseY)
            }
            if (p.key === ' ') {
                state.find_faces()
            }
            if (p.key === 'a') {
                for (let i = 0; i < nr_agents; i++) {
                    // Choose one perlin at random
                    let chosenPerlin = Math.random() < 1.0 ? perlin : alternate_perlin;
                    let maxNoise = 0.0;
                    let pathNoise = Math.random() * maxNoise;
                    let newAgent = new Agent(chosenPerlin, pathNoise);
                    agents.push(newAgent);
                }
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
