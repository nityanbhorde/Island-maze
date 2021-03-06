 //Returns a random number between min (inclusive) and max (exclusive)
function getRandom(min, max) {
    return Math.random() * (max - min) + min;
}

//particles class
function Particle(x, y, z, life, vel) {
           
                this.x = x;
                this.y = y;
                this.z = z;
                this.origin = { // where the particle started
                    x: x,
                    y: y ,
                    z:z
                }
                this.life = life;
                this.max_life = life; //particles original life will be its max life

            	this.vel = vel;

    Particle.prototype.update = function(hp) {
    	this.life -= hp;
    	if(this.life > 0) {
    		this.z += this.vel
    	}
    };
}
// bezierclass  takes in 4 points and calculates the exact coordinates for the idx
//https://www.moshplant.com/direct-or/bezier/math.html adapted from Bezier formulas shown on this page
function Bezier(idx, p0, p1, p2, p3){
  var cX = 3 * (p1.x - p0.x);
  var bX = 3 * (p2.x - p1.x) - cX;
  var aX = p3.x - p0.x - cX - bX;

  var cY = 3 * (p1.y - p0.y);
  var bY = 3 * (p2.y - p1.y) - cY;
  var aY = p3.y - p0.y - cY - bY;
 //x(t) = axt3 + bxt2 + cxt + x0
  this.x = (aX * Math.pow(idx, 3)) + (bX * Math.pow(idx, 2)) + (cX * idx) + p0.x;
  this.y = (aY * Math.pow(idx, 3)) + (bY * Math.pow(idx, 2)) + (cY * idx) + p0.y;
  
}
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

        //particle effects
        this.particles_left = [];
        this.particles_right =  [];
      
        // set up all particles, these are the first two towers
        this.n_particles = 300;
        for(var i = 0; i < 50; i++){ // make the first 50 particles with low life so base stays strong
            var castle1_x = getRandom(7,13);
            var castle1_y = getRandom(27,33);
	        this.particles_right.push(new Particle(castle1_x,castle1_y,9.6,20,.1)); // x y z life velocity
	        this.particles_left.push(new Particle(castle1_x-20,castle1_y,9.6,20,.1)); 
        }
        for(var i = 0; i < this.n_particles-50; i++){
            var temp_x = getRandom(7,13);
            var temp_y = getRandom(27,33);
	        this.particles_right.push(new Particle(temp_x,temp_y,9.6,75,.1)); 
	        this.particles_left.push(new Particle(temp_x-20,temp_y,9.6,75,.1)); // x y z life velocity
	        
    	}

    	// the points we want our bezier to scale from
	var p0 = {x: 5, y: 4}; 
	var p1 = {x: 10, y: 10};
	var p2 = {x: 10, y: -5};
	var p3 = {x: 15, y: 20};
	//globals for bezier
	this.b_direction = 1; //swaps direction on the last point
        this.global_bez = 0;
        this.bez_max = 100; //only 100, fairly good accuracy for the curve
        this.bez_array = [];
		for (var i=0; i<1; i+=.01){
   			  this.bez_array.push(new Bezier(i,p0,p1,p2,p3));
  		}
  		this.indicator = 1;

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
            'castle': new Castle(),
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
            square: "assets/fire.jpg",
            box: "assets/even-dice-cubemap.png",
            ball: "assets/soccer_sph_s_resize.png",
            cylinder: "assets/treebark.png",
            pyramid: "assets/tetrahedron-texture2.png",
            simplebox: "assets/tetrahedron-texture2.png",
            cone: "assets/hypnosis.jpg",
            circle: "assets/fire.jpg"
        };
        for (let t in shape_textures)
            this.shape_materials[t] = this.texture_base.override({
                texture: context.get_instance(shape_textures[t])
            });
        
        this.lights = [new Light(Vec.of(10, 10, 20, 1), Color.of(1, .4, 1, 1), 100000)];

        this.blue = Color.of(0, 0, 1, 1);
        this.yellow = Color.of(1, 1, 0, 1);
        this.red = Color.of(1, 0, 0, 1);
        this.green = Color.of(0, 1, 0, 1);
        this.brown = Color.of(0.725, 0.478, 0.341, 1);
        this.darkgrey = Color.of(0.5, 0.5, 0.5, 1);
        this.lightgrey = Color.of(0.75, 0.75, 0.75, 1);
        this.white = Color.of(1, 1, 1, 1);
        this.black = Color.of(0, 0, 0, 1);

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

        
   draw_bezier(graphics_state){
    	if(this.b_direction  == 1){
        	this.global_bez += 1;
		}
        else{
        	this.global_bez -= 1;
        }

        if(this.global_bez >= 99 ){
        	this.b_direction = 0;
        }
        if(this.global_bez <= 0){
        	this.b_direction = 1;
        }
       
		this.shapes.box.draw(graphics_state,
        Mat4.translation(Vec.of(this.bez_array[this.global_bez].x,this.bez_array[this.global_bez].y,3))
        .times(Mat4.scale(2)),
		this.plastic.override({color: this.brown}) );
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

            left_wall:   { x: -24, y: 0,   margin_x: 1,  margin_y: 50}, //0
            right_wall:  { x: 24,  y: 0,   margin_x: 1,  margin_y: 50}, //1
            upper_wall:  { x: 0,   y: 24,  margin_x: 50, margin_y: 1},  //2
            lower_wall:  { x: 0,   y: -24, margin_x: 50, margin_y: 1},  //3

            box1:        { x: 5,   y: -15, margin_x: 2,  margin_y: 2},  //4
            box2:		 { x: -13, y: 4,   margin_x: 2,  margin_y: 2},  //5
            box3:        { x: -3 + 3*Math.sin(this.t*3),                //6
								   y: -7,  margin_x: 2,  margin_y: 2}, 
            tree_stump1: { x: 20,  y: -8,  margin_x: 2,  margin_y: 2},  //7
            tree_stump2: { x: 15,  y: 0,   margin_x: 2,  margin_y: 2},  //8

            tower1:      { x: 5,   y: 15,  margin_x: 3,  margin_y: 3},  //9
            tower2:      { x: -5,  y: 15,  margin_x: 3,  margin_y: 3},  //10
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
        this.shapes.simplebox.draw(graphics_state, baseboard, this.plastic.override({color: this.green}));

        // Draw the four walls of the baseboard
        for (var i = 0; i < 4; ++i)
        {
            this.shapes.simplebox.draw(graphics_state,
                wall.times(Mat4.rotation(Math.PI/2 * (i > 1), Vec.of(0, 0, 1)))
                    .times(Mat4.scale(Vec.of(50, 1, 4)))
                    .times(Mat4.translation(Vec.of(0, ((i % 2) ? 49 : -49), 1.25))), this.plastic.override({color: this.brown}));
        }

        // Draw a couple of completely random, useless boxes
        this.shapes.simplebox.draw(graphics_state, 
            Mat4.identity()
                .times(Mat4.scale(2))
                .times(Mat4.translation(Vec.of(object_coords.box1.x, object_coords.box1.y, this.z_coord))), this.plastic.override({color: this.brown}));

        this.shapes.simplebox.draw(graphics_state, 
            Mat4.identity()
                .times(Mat4.scale(2))
                .times(Mat4.translation(Vec.of(object_coords.box2.x, object_coords.box2.y, this.z_coord))), this.plastic.override({color: this.brown}));

        this.shapes.simplebox.draw(graphics_state, 
            Mat4.identity()
                .times(Mat4.scale(2))
                .times(Mat4.translation(Vec.of(object_coords.box3.x, object_coords.box3.y, this.z_coord))), this.plastic.override({color: this.brown}));
                

        // Main ball that rolls around
        this.shapes.ball.draw(graphics_state, 
                Mat4.identity()
                    .times(Mat4.scale(2))
                    .times(Mat4.translation(Vec.of(this.x_coord, this.y_coord, this.z_coord))),
                    this.plastic.override({color: this.lightgrey}));
  		this.draw_bezier(graphics_state);
        // fire particles
       for(var i = 0; i < this.n_particles; i++){
            if(this.particles_right[i].life < 0){
                this.particles_right[i].life =   Math.floor(Math.random() * Math.floor(this.particles_right[i].max_life));
                this.particles_right[i].x = this.particles_right[i].origin.x;

                this.particles_right[i].y   = this.particles_right[i].origin.y;
                this.particles_right[i].z = this.particles_right[i].origin.z;

                this.particles_left[i].life = Math.floor(Math.random() * Math.floor(this.particles_right[i].max_life));

                this.particles_left[i].x = this.particles_left[i].origin.x;

                this.particles_left[i].y   = this.particles_left[i].origin.y;
                this.particles_left[i].z = this.particles_left[i].origin.z;
            }
            else{
                this.particles_right[i].update(1);
                this.particles_left[i].update(1);
            }
            this.shapes['circle'].draw(graphics_state,
            Mat4.translation(Vec.of(this.particles_right[i].x,this.particles_right[i].y,this.particles_right[i].z+10)).times(Mat4.scale(Vec.of(.35,.35,.35))),
            this.shape_materials['circle']);
            this.shapes['circle'].draw(graphics_state,
            Mat4.translation(Vec.of(this.particles_left[i].x,this.particles_left[i].y,this.particles_left[i].z+10)).times(Mat4.scale(Vec.of(.35,.35,.35))),
            this.shape_materials['circle']);

        }
       

        // trees
        this.draw_tree(graphics_state,
            Mat4.identity().times(Mat4.translation(Vec.of(0, 0, 2)))
                           .times(Mat4.rotation(Math.PI/2, Vec.of(1, 0, 0)))
                           .times(Mat4.translation(Vec.of(object_coords.tree_stump1.x * 2, 4, object_coords.tree_stump1.y * -2))));
        this.shapes.simplebox.draw(graphics_state, 
            Mat4.identity()
                .times(Mat4.scale(2))
                .times(Mat4.translation(Vec.of(object_coords.tree_stump1.x, object_coords.tree_stump1.y, this.z_coord))), this.plastic.override({color: this.brown}));

        this.draw_tree(graphics_state,
            Mat4.identity().times(Mat4.translation(Vec.of(0, 0, 2)))
                           .times(Mat4.rotation(Math.PI/2, Vec.of(1, 0, 0)))
                           .times(Mat4.translation(Vec.of(object_coords.tree_stump2.x * 2, 4, object_coords.tree_stump2.y * -2)))
                           .times(Mat4.rotation(Math.PI, Vec.of(0, 1, 0))));
        this.shapes.simplebox.draw(graphics_state, 
            Mat4.identity()
                .times(Mat4.scale(2))
                .times(Mat4.translation(Vec.of(object_coords.tree_stump2.x, object_coords.tree_stump2.y, this.z_coord))), this.plastic.override({color: this.brown}));
                
        
        // Draw castle gates:
        this.shapes.castle.draw(graphics_state, 
            Mat4.identity()
                .times(Mat4.translation(Vec.of(object_coords.tower1.x*2, object_coords.tower1.y*2, this.z_coord + 8))), this.plastic.override({color: this.lightgrey}));
        this.shapes.castle.draw(graphics_state, 
            Mat4.identity()
                .times(Mat4.translation(Vec.of(object_coords.tower2.x*2, object_coords.tower2.y*2, this.z_coord + 8))), this.plastic.override({color: this.lightgrey}));



        graphics_state.camera_transform = Mat4.look_at(Vec.of(this.x_coord, this.y_coord - 70, this.z_coord + 70), Vec.of(this.x_coord, this.y_coord, this.z_coord), Vec.of(0, 0, 1));
    }


    draw_tree(graphics_state, m) {
        // Based on code from CCLE and from Project 1
        const deg = 0.1 * Math.sin(this.t*1.2);
        this.shapes.simplebox.draw(
            graphics_state,
            m,
            this.plastic.override({color: this.brown}));
        for (var i = 0; i < 7; ++i) {
            let sign = (deg >= 0) ? -1 : 1;
            m = m.times(Mat4.translation(Vec.of(-1 * sign, 1, 0)))
                .times(Mat4.rotation(0.2 * deg, Vec.of(0, 0, -1)))
                .times(Mat4.translation(Vec.of(sign, 1, 0)));
            this.shapes.simplebox.draw(
                graphics_state,
                m,
                this.plastic.override({color: this.brown}));
        }
        
        // Keep translation coordinates of tree leaves
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
                this.plastic.override({color: this.green}));
        }
        
    }
}

window.Assignment_Two_Skeleton = window.classes.Assignment_Two_Skeleton = Assignment_Two_Skeleton;
