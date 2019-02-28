class Assignment_Two_Skeleton extends Scene_Component {
    // The scene begins by requesting the camera, shapes, and materials it will need.
    constructor(context, control_box) {
        super(context, control_box);

        // First, include a secondary Scene that provides movement controls:
        if(!context.globals.has_controls)
            context.register_scene_component(new Movement_Controls(context, control_box.parentElement.insertCell()));

        // Locate the camera here (inverted matrix).
        const r = context.width / context.height;
        context.globals.graphics_state.camera_transform = Mat4.translation([0, 0, -135]);
        context.globals.graphics_state.projection_transform = Mat4.perspective(Math.PI / 4, r, .1, 1000);

        // Global ball coordinates (and velocity)
        this.x_coord = 0;
        this.y_coord = 0;
        this.x_vel = 0;
        this.y_vel = 0;
        // Does the user have control over movement in this axis?
        // They may not if the ball interacts with a spring, wall, etc.
        this.x_ctrl = 1;
        this.y_ctrl = 1;

        // At the beginning of our program, load one of each of these shape
        // definitions onto the GPU.  NOTE:  Only do this ONCE per shape
        // design.  Once you've told the GPU what the design of a cube is,
        // it would be redundant to tell it again.  You should just re-use
        // the one called "box" more than once in display() to draw
        // multiple cubes.  Don't define more than one blueprint for the
        // same thing here.
        const shapes = {
            'square': new Square(),
            'circle': new Circle(15),
            'pyramid': new Tetrahedron(false),
            'simplebox': new SimpleCube(),
            'box': new Cube(),
            'cylinder': new Cylinder(15),
            'cone': new Cone(20),
            'ball': new Subdivision_Sphere(4)
        }
        this.submit_shapes(context, shapes);
        this.shape_count = Object.keys(shapes).length;

        // Make some Material objects available to you:
        this.clay = context.get_instance(Phong_Shader).material(Color.of(.9, .5, .9, 1), {
            ambient: .4,
            diffusivity: .4
        });
        this.plastic = this.clay.override({
            specularity: .6
        });
        this.texture_base = context.get_instance(Phong_Shader).material(Color.of(0, 0, 0, 1), {
            ambient: 1,
            diffusivity: 0.4,
            specularity: 0.3
        });

        // Load some textures for the demo shapes
        this.shape_materials = {};
        const shape_textures = {
            square: "assets/butterfly.png",
            box: "assets/even-dice-cubemap.png",
            ball: "assets/soccer_sph_s_resize.png",
            cylinder: "assets/treebark.png",
            pyramid: "assets/tetrahedron-texture2.png",
            simplebox: "assets/tetrahedron-texture2.png",
            cone: "assets/hypnosis.jpg",
            circle: "assets/hypnosis.jpg"
        };
        for (let t in shape_textures)
            this.shape_materials[t] = this.texture_base.override({
                texture: context.get_instance(shape_textures[t])
            });
        
        this.lights = [new Light(Vec.of(10, 10, 20, 1), Color.of(1, .4, 1, 1), 100000)];

        this.t = 0;
    }


    // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
    make_control_panel() {
        this.key_triggered_button("Pause Time", ["n"], () => {
            this.paused = !this.paused;
        });
        this.new_line();this.new_line();
        this.control_panel.innerHTML += "Move the ball using the following buttons:<br>";
        this.key_triggered_button("Move ball left", ["j"], ()=>this.x_vel = -10 * this.x_ctrl, undefined, ()=>this.x_vel = 0);
        this.key_triggered_button("Move ball right", ["l"], ()=>this.x_vel = 10 * this.x_ctrl, undefined, ()=>this.x_vel = 0);
        this.new_line();
        this.key_triggered_button("Move ball up", ["i"], ()=>this.y_vel = 10 * this.y_ctrl, undefined, ()=>this.y_vel = 0);
        this.key_triggered_button("Move ball down", ["k"], ()=>this.y_vel = -10 * this.y_ctrl, undefined, ()=>this.y_vel = 0);

//         this.key_triggered_button("Move ball left", ["4"], () => {
//             this.move_l = !this.move_l;
//         });

//         this.key_triggered_button("Move ball right", ["6"], () => {
//             this.move_r = !this.move_r;
//         });

//         this.key_triggered_button("Move ball up", ["8"], () => {
//             this.move_u = !this.move_u;
//         });
        
//         this.key_triggered_button("Move ball down", ["2"], () => {
//             this.move_d = !this.move_d;
//         });

    }


    display(graphics_state) {
        // Use the lights stored in this.lights.
        graphics_state.lights = this.lights;
                
        // Find how much time has passed in seconds, and use that to place shapes.
        if (!this.paused)
            this.t += graphics_state.animation_delta_time / 1000;
        const t = this.t;

        // Draw some demo textured shapes
//         let spacing = 6;
//         let m = Mat4.translation(Vec.of(-1 * (spacing / 2) * (this.shape_count - 1), 0, 0));
//         for (let k in this.shapes) {
//             this.shapes[k].draw(
//                 graphics_state,
//                 m.times(Mat4.rotation(t, Vec.of(0, 1, 0))),
//                 this.shape_materials[k] || this.plastic);
//             m = m.times(Mat4.translation(Vec.of(spacing, 0, 0)));
//         }

        // Create more parameters to deal with ball movement
        const delta_time = graphics_state.animation_delta_time / 1000;
        this.x_coord += this.x_vel * delta_time;
        this.y_coord += this.y_vel * delta_time;

        // Draw the basic map scene centered at the origin
        // The plane of the board faces the positive Z direction
        let baseboard = Mat4.identity();
        let wall = baseboard;

        // Draw the baseboard
        baseboard = baseboard.times(Mat4.scale(Vec.of(50, 50, 1)));
        this.shapes.simplebox.draw(graphics_state, baseboard, this.plastic);

        // Draw the four walls of the baseboard
        for (var i = 0; i < 4; ++i)
        {
            this.shapes.simplebox.draw(graphics_state,
                wall.times(Mat4.rotation(Math.PI/2 * (i > 1), Vec.of(0, 0, 1)))
                    .times(Mat4.scale(Vec.of(50, 1, 4)))
                    .times(Mat4.translation(Vec.of(0, ((i % 2) ? 49 : -49), 1.25))), this.plastic);
        }

        
        // Draw a couple of completely random, useless boxes
        this.shapes.simplebox.draw(graphics_state, 
            Mat4.identity()
                .times(Mat4.scale(2))
                .times(Mat4.translation(Vec.of(0, 12, 1.5))), this.plastic);

        this.shapes.simplebox.draw(graphics_state, 
            Mat4.identity()
                .times(Mat4.scale(2))
                .times(Mat4.translation(Vec.of(-13, 4, 1.5))), this.plastic);

        for (var i = 0; i < 12; ++i)
        {
            this.shapes.simplebox.draw(graphics_state, 
                Mat4.identity()
                    .times(Mat4.scale(2))
                    .times(Mat4.translation(Vec.of(12, -21 + (i*2), 1.5))), this.plastic);
        }


        // Draw a ball and make it move around
        // Add texture?

        //let a = this.move_l;
//         let b = this.move_r;
//         let c = this.move_u;
//         let d = this.move_d;

        //if (a) { this.x_coord -= 0.2; this.move_l = !this.move_l; }
//         if (b) { this.x_coord += 0.2; this.move_r = !this.move_r; }
//         if (c) { this.y_coord += 0.2; this.move_u = !this.move_u; }
//         if (d) { this.y_coord -= 0.2; this.move_d = !this.move_d; }

//         else 
//         {
//             this.shapes.ball.draw(graphics_state, 
//                 Mat4.identity()
//                     .times(Mat4.scale(2))
//                     .times(Mat4.translation(Vec.of(x_coord, 0, 1.5))),
//                     this.plastic);
//         }

        this.shapes.ball.draw(graphics_state, 
                Mat4.identity()
                    .times(Mat4.scale(2))
                    .times(Mat4.translation(Vec.of(this.x_coord, this.y_coord, 1.5))),
                    this.plastic);



        // And because why not, LET'S ADD A TREE AT THE CENTER
        // Let's make it PINK BECAUSE I DON'T KNOW HOW TO CHANGE THESE DANG PLASTIC COLORS
        this.draw_tree(graphics_state,
            Mat4.identity().times(Mat4.translation(Vec.of(0, 0, 2)))
                           .times(Mat4.rotation(Math.PI/2, Vec.of(1, 0, 0)))
                           .times(Mat4.translation(Vec.of(10, 4, 10))));
        this.shapes.simplebox.draw(graphics_state, 
            Mat4.identity()
                .times(Mat4.scale(2))
                .times(Mat4.translation(Vec.of(5, -5, 1.5))), this.plastic);

    }







    draw_tree(graphics_state, m) {
        // Code from a sample on CCLE
        const deg = 0.2* Math.sin(this.t*2);
        this.shapes.simplebox.draw(
            graphics_state,
            m,
            this.plastic);
        for (var i = 0; i < 7; ++i) {
            let sign = (deg >= 0) ? -1 : 1;
            m = m.times(Mat4.translation(Vec.of(-1 * sign, 1, 0)))
                .times(Mat4.rotation(0.2 * deg, Vec.of(0, 0, -1)))
                .times(Mat4.translation(Vec.of(sign, 1, 0)));
            this.shapes.simplebox.draw(
                graphics_state,
                m,
                this.plastic);
        }
//         this.shapes.simplebox.draw(graphics_state,
//             m = m.times(Mat4.translation(Vec.of(0, 2, 0))),
//             this.plastic);
        
        // Keep translation coordinates of bushy tree stuff
        let temp_m = [ m.times(Mat4.translation(Vec.of(-2, 0, 0))),
                       m.times(Mat4.translation(Vec.of(0, 0, -2))),
                       m.times(Mat4.translation(Vec.of(2, 0, 0))),
                       m.times(Mat4.translation(Vec.of(0, 0, 2))),
                       m.times(Mat4.translation(Vec.of(-4, 0, 0))),
                       m.times(Mat4.translation(Vec.of(0, 0, -4))),
                       m.times(Mat4.translation(Vec.of(4, 0, 0))),
                       m.times(Mat4.translation(Vec.of(0, 0, 4))),
                       m.times(Mat4.translation(Vec.of(2, 0, -2))),
                       m.times(Mat4.translation(Vec.of(2, 0, 2))),
                       m.times(Mat4.translation(Vec.of(-2, 0, 2))),
                       m.times(Mat4.translation(Vec.of(-2, 0, -2))),
                       m.times(Mat4.translation(Vec.of(-2, 2, 0))),
                       m.times(Mat4.translation(Vec.of(0, 2, -2))),
                       m.times(Mat4.translation(Vec.of(2, 2, 0))),
                       m.times(Mat4.translation(Vec.of(0, 2, 2))),
                       m.times(Mat4.translation(Vec.of(0, 3, 0))),
                       m.times(Mat4.translation(Vec.of(0, 2, 0))), ];

        // Draw leaves around the top of the tree
        for (var i = 0; i < 18; ++i)
        {
            this.shapes.simplebox.draw(
                graphics_state,
                temp_m[i],
                this.plastic);4
        }
    }
}

window.Assignment_Two_Skeleton = window.classes.Assignment_Two_Skeleton = Assignment_Two_Skeleton;