class Assignment_Two_Skeleton extends Scene_Component {
    // The scene begins by requesting the camera, shapes, and materials it will need.
    constructor(context, control_box) {
        super(context, control_box);

        // First, include a secondary Scene that provides movement controls:
        if(!context.globals.has_controls)
            context.register_scene_component(new Movement_Controls(context, control_box.parentElement.insertCell()));

        // Locate the camera here (inverted matrix).
        const r = context.width / context.height;
        context.globals.graphics_state.camera_transform = Mat4.look_at(Vec.of(0, -50, 50), Vec.of(0, 0, 0), Vec.of(0, 0, 1));
        context.globals.graphics_state.projection_transform = Mat4.perspective(Math.PI / 4, r, .1, 1000);

        // Global ball coordinates (and velocity)
        this.x_coord = 0;
        this.y_coord = 0;
        this.z_coord = 1.5;
        
        this.x_vel = 0;
        this.y_vel = 0;
        this.z_vel = 0;
        
        this.x_acc = 0;
        this.y_acc = 0;
        this.z_acc = 0;
        
        // Does the user have control over movement in this axis?
        // They may not if the ball interacts with a spring, wall, etc.
        this.x_ctrl = 0;
        this.y_ctrl = 0;

        // It may be better to specify control over specific directions
        this.left_ctrl = 0;
        this.right_ctrl = 0;
        this.up_ctrl = 0;
        this.down_ctrl = 0;

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
        this.key_triggered_button("Move ball left", ["j"], ()=>this.left_ctrl = 1, undefined, ()=>this.left_ctrl = 0);
        this.key_triggered_button("Move ball right", ["l"], ()=>this.right_ctrl = 1, undefined, ()=>this.right_ctrl = 0);
        this.new_line();
        this.key_triggered_button("Move ball up", ["i"], ()=>this.up_ctrl = 1, undefined, ()=>this.up_ctrl = 0);
        this.key_triggered_button("Move ball down", ["k"], ()=>this.down_ctrl = 1, undefined, ()=>this.down_ctrl = 0);
    }


    display(graphics_state) {
        // Use the lights stored in this.lights.
        graphics_state.lights = this.lights;
                
        // Find how much time has passed in seconds, and use that to place shapes.
        if (!this.paused)
            this.t += graphics_state.animation_delta_time / 1000;
        const t = this.t;

        // JSON of coordinates of each object
        const object_coords = {

            box1_coords: {
                x: 0,
                y: 12,
                margin_x: 2,
                margin_y: 2
            },

            box2_coords: {
                x: -13,
                y: 4,
                margin_x: 2,
                margin_y: 2
            },

            box3_coords: {
                x: 5,
                y: -5,
                margin_x: 2,
                margin_y: 2,
            }
        };

        // Compare the ball's current coordinates with those of the inanimate objects
        // If the ball is touching one of the inanimate objects, then the ball cannot move
        // through that object
        
        /*var check_left = 1;
        var check_right = 1;
        var check_up = 1;
        var check_down = 1;*/
        for(var obj in object_coords) {
            if(this.x_coord >= (object_coords[obj].x - object_coords[obj].margin_x) && this.x_coord <= (object_coords[obj].x + object_coords[obj].margin_x)) {            
                if(this.y_coord >= (object_coords[obj].y - object_coords[obj].margin_y) && this.y_coord <= object_coords[obj].y) {
                    this.y_vel *= -1;
                    //check_up = false;
                }

                if(this.y_coord <= (object_coords[obj].y + object_coords[obj].margin_y) && this.y_coord >= object_coords[obj].y) {
                    this.y_vel *= -1;
                    //check_down = false;
                }
            }

            if(this.y_coord >= (object_coords[obj].y - object_coords[obj].margin_y) && this.y_coord <= (object_coords[obj].y + object_coords[obj].margin_y)) {
                if(this.x_coord >= (object_coords[obj].x - object_coords[obj].margin_x) && this.x_coord <= object_coords[obj].x) {
                    this.x_vel *= -1;
                    //check_right = false;
                }

                if(this.x_coord <= (object_coords[obj].x + object_coords[obj].margin_x) && this.x_coord >= object_coords[obj].x) {
                    this.x_vel *= -1;
                    //check_left = false;
                }
            }
        }
        /*this.left_ctrl = check_left;
        this.right_ctrl = check_right;
        this.up_ctrl = check_up;
        this.down_ctrl = check_down;*/

        // Create more parameters to deal with ball movement
        const delta_time = graphics_state.animation_delta_time / 1000;
        
        // Acceleration with maximum velocity for controls
        if (this.left_ctrl && this.x_vel > -10) this.x_vel += -10 * this.left_ctrl * delta_time;
        if (this.right_ctrl && this.x_vel < 10) this.x_vel += 10 * this.right_ctrl * delta_time;
        if (this.up_ctrl && this.y_vel < 10)    this.y_vel += 10 * this.up_ctrl * delta_time;
        if (this.down_ctrl && this.y_vel > -10) this.y_vel += -10 * this.down_ctrl * delta_time;
        this.x_vel += this.x_acc * delta_time;
        this.y_vel += this.y_acc * delta_time;
        
        // Friction
        this.x_vel *= 0.99;
        this.y_vel *= 0.99;
        
        // Velocity
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
                .times(Mat4.translation(Vec.of(object_coords.box1_coords.x, object_coords.box1_coords.y, this.z_coord))), this.plastic);

        this.shapes.simplebox.draw(graphics_state, 
            Mat4.identity()
                .times(Mat4.scale(2))
                .times(Mat4.translation(Vec.of(object_coords.box2_coords.x, object_coords.box2_coords.y, this.z_coord))), this.plastic);

        for (var i = 0; i < 12; ++i)
        {
            this.shapes.simplebox.draw(graphics_state, 
                Mat4.identity()
                    .times(Mat4.scale(2))
                    .times(Mat4.translation(Vec.of(12, -21 + (i*2), this.z_coord))), this.plastic);
        }

        this.shapes.ball.draw(graphics_state, 
                Mat4.identity()
                    .times(Mat4.scale(2))
                    .times(Mat4.translation(Vec.of(this.x_coord, this.y_coord, this.z_coord))),
                    this.plastic);

        // tree
        this.draw_tree(graphics_state,
            Mat4.identity().times(Mat4.translation(Vec.of(0, 0, 2)))
                           .times(Mat4.rotation(Math.PI/2, Vec.of(1, 0, 0)))
                           .times(Mat4.translation(Vec.of(10, 4, 10))));
        this.shapes.simplebox.draw(graphics_state, 
            Mat4.identity()
                .times(Mat4.scale(2))
                .times(Mat4.translation(Vec.of(object_coords.box3_coords.x, object_coords.box3_coords.y, this.z_coord))), this.plastic);
                
        graphics_state.camera_transform = Mat4.look_at(Vec.of(this.x_coord, this.y_coord - 50, this.z_coord + 50), Vec.of(this.x_coord, this.y_coord, this.z_coord), Vec.of(0, 0, 1));
    }

    draw_tree(graphics_state, m) {
        // Code from a sample on CCLE
        const deg = 0.2 * Math.sin(this.t*2);
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