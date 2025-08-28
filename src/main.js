import './style.css'
import p5 from 'p5'
import { State } from './state.js'
import { Agent } from './agent.js'
import { Perlin } from './perlin.js'

window.addEventListener('load', () => {
    new p5((p) => {
        const nr_agents = 50;
        let agent_count = 0;
        let agent = null;
        let state = new State(p);
        let perlin = new Perlin();
        state.initialize_frame();
        let showPerlin = false;
        let showEdges = true;
        let showGuide = false;
        window.state = state;

        p.setup = () => {
            const canvas = p.createCanvas(800, 600)
            const parent = document.querySelector('#app .card') || document.querySelector('#app') || document.body
            canvas.parent(parent)
        }

        p.draw = () => {
            if(agent) {
                if(agent.update() == 'done') {
                    agent_count++;
                    if(agent_count < nr_agents) {
                        agent = new Agent(state, perlin);
                    } else {
                        showEdges = false;
                        state.find_faces();
                    }
                };
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
            // for (let state_point of state.points.values()) {
            //     p.fill(p.color(200, 200, 200))
            //     p.noStroke()
            //     p.circle(state_point.x, state_point.y, 10)
            //     p.fill(p.color(0, 0, 0))
            //     p.textAlign(p.CENTER, p.CENTER)
            //     p.text(state_point.index, state_point.x, state_point.y)
            // }
            if (showGuide) {
                state.draw_phantom_edge(p);
            }
        }

        p.mousePressed = () => {
            if (p.mouseX >= 0 && p.mouseX <= p.width && p.mouseY >= 0 && p.mouseY <= p.height) {
                state.agent_add_dot(p.mouseX, p.mouseY)
            }
        }

        p.keyPressed = () => {
            if (p.key === 'r' || p.key === 'R') {
                // Clear all points from the Map
                state.points.clear()
                state.initialize_frame();
            }
            if (p.key === 'b' || p.key === 'B') {
                state.add_at_collision(p.mouseX, p.mouseY)
            }
            if (p.key === ' ') {
                state.find_faces()
            }
            if (p.key === 'a') {
                agent = new Agent(state, perlin);
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
        }
    })
})
