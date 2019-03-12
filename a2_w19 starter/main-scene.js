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

        // variable to help implement sound effects
        this.cheer_temp = 0;

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
        
        this.phi = 0;
        
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
            var castle1_y = getRandom(30,36);
	        this.particles_right.push(new Particle(castle1_x,castle1_y,9.6,20,.1)); // x y z life velocity
	        this.particles_left.push(new Particle(castle1_x-20,castle1_y,9.6,20,.1)); 
        }
        for(var i = 0; i < this.n_particles-50; i++){
            var temp_x = getRandom(7,13);
            var temp_y = getRandom(30,36);
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
            'ball': new Subdivision_Sphere(4),
            'pointy_boi': new Pointy_boi(),
            'text_line': new Text_Line(20),
            'level1_text_line': new Text_Line(20),
            'level2_text_line': new Text_Line(20),
            'level3_text_line': new Text_Line(20),
            'level4_text_line': new Text_Line(20),
            'final_text_line': new Text_Line(20),
        }
        this.submit_shapes(context, shapes);
        this.shape_count = Object.keys(shapes).length;

        this.shapes.text_line.read_string("ISLAND MAZE");
        this.shapes.level1_text_line.read_string("START");
        this.shapes.level2_text_line.read_string("1");
        this.shapes.level3_text_line.read_string("2");
        this.shapes.level4_text_line.read_string("Restart?");
        this.shapes.final_text_line.read_string("YOU WON:)");

        // Make some Material objects available to you:
        this.clay = context.get_instance(Phong_Shader).material(Color.of(.9, .5, .9, 1), {
            ambient: .4,
            diffusivity: .4
        });
        this.plastic = this.clay.override({
            specularity: .6,            
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
            circle: "assets/hypnosis.jpg",
            text_line: "assets/text.png"
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

        this.game_level = 0;
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


    // Determine closest point on a given object to a point on the ball
    squaredDistBallObject(obj_coords) {

        obj_coords.x /= 2;//obj_coords.margin_x/2;
        obj_coords.y /= 2;//obj_coords.margin_y/2;
        
        const x_unrotated = Math.cos(-obj_coords.rotation) * (this.x_coord - obj_coords.x/2) - Math.sin(-obj_coords.rotation) * (this.y_coord - obj_coords.y/2) + obj_coords.x/2;
        const y_unrotated = Math.sin(-obj_coords.rotation) * (this.x_coord - obj_coords.x/2) + Math.cos(-obj_coords.rotation) * (this.y_coord - obj_coords.y/2) + obj_coords.y/2;

        var closest_x = 0;
        var closest_y = 0;
        
        if(x_unrotated < obj_coords.x - obj_coords.margin_x/2)
            closest_x = obj_coords.x - obj_coords.margin_x/2;
        else if(x_unrotated > obj_coords.x + obj_coords.margin_x/2)
            closest_x = obj_coords.x + obj_coords.margin_x/2;
        else
            closest_x = x_unrotated;

        if(y_unrotated < obj_coords.y - obj_coords.margin_y/2)
            closest_y = obj_coords.y - obj_coords.margin_y/2;
        else if(y_unrotated > obj_coords.y + obj_coords.margin_y/2)
            closest_y = obj_coords.y + obj_coords.margin_y/2;
        else
            closest_y = y_unrotated;

        const a = Math.abs(x_unrotated - closest_x);
        const b = Math.abs(y_unrotated - closest_y);

        obj_coords.x *= 2;//obj_coords.margin_x/2;
        obj_coords.y *= 2;//obj_coords.margin_y/2;
 
        return Math.sqrt((a * a) + (b * b));

    }

    // Check whether a given object would intersect with the ball
    checkBallIntersect(obj_coords) {
        const squaredDist = this.squaredDistBallObject(obj_coords);
        return squaredDist <= 1;
    }


    display(graphics_state) {
        // Use the lights stored in this.lights.
        graphics_state.lights = this.lights;

        // Find how much time has passed in seconds, and use that to place shapes.
        if (!this.paused)
            this.t += graphics_state.animation_delta_time / 1000;
        const t = this.t;

        // JSON of coordinates of each object
        const object_coords = [
        // level 0 items
        {
            left_wall: { x: -49, y: 0, margin_x: 1, margin_y: 50, rotation: 0, velocity_x: 0, velocity_y: 0, draw: 1},
            right_wall: { x: 49, y: 0, margin_x: 1, margin_y: 50, rotation: 0, velocity_x: 0, velocity_y: 0, draw: 1 },
            upper_wall: { x: 0,  y: 49,margin_x: 50,margin_y: 1,  rotation: 0, velocity_x: 0, velocity_y: 0, draw: 1 },
            lower_wall: { x: 0,  y: -49,margin_x: 50,margin_y: 1, rotation: 0, velocity_x: 0, velocity_y: 0, draw: 1 },

            box1:      { x: 10, y: -30, margin_x: 2, margin_y: 2, rotation: 0, velocity_x: 0, velocity_y: 0, draw: 1 },
            box2:      { x: -26, y: 8, margin_x: 2, margin_y: 2, rotation: 0, velocity_x: 0, velocity_y: 0, draw: 1 },
            box3:      { x: -6 + 6*Math.sin(this.t*5), y: -8 /*+ 3*Math.cos(this.t*5)*/, margin_x: 2, margin_y: 2, rotation: 0, velocity_x: 15*Math.cos(this.t*5), velocity_y: 0,  draw: 1},      

            tree_stump1: { x: 40, y: -16, margin_x: 2, margin_y: 2, rotation: 0, velocity_x: 0, velocity_y: 0,  draw: 1},
            tree_stump2: { x: 40, y: 0,  margin_x: 2, margin_y: 2, rotation: 0, velocity_x: 0, velocity_y: 0,  draw: 1},

            tower1:    { x: 10, y: 42, margin_x: 4, margin_y: 4, rotation: 0, velocity_x: 0, velocity_y: 0,  draw: 1},
            tower2:    { x: -10,y: 42, margin_x: 4, margin_y: 4, rotation: 0, velocity_x: 0, velocity_y: 0,  draw: 1},

            pointyboi: { x: -14, y: -16, margin_x: 3, margin_y: 3, rotation: 0, velocity_x: 0, velocity_y: 0,  draw: 1}

        },

        // level 1 items
        {
            left_wall:   { x: -48, y: 0,   margin_x: 1,  margin_y: 50, rotation: 0, velocity_x: 0, velocity_y: 0, draw: 0},
            right_wall:  { x: 48,  y: 0,   margin_x: 1,  margin_y: 50, rotation: 0, velocity_x: 0, velocity_y: 0, draw: 0},
            upper_wall:  { x: 0,   y: 48,  margin_x: 50, margin_y: 1,  rotation: 0, velocity_x: 0, velocity_y: 0, draw: 0},
            lower_wall:  { x: 0,   y: -48, margin_x: 50, margin_y: 1,  rotation: 0, velocity_x: 0, velocity_y: 0, draw: 0},

            tower1:    { x: 10, y: 42, margin_x: 4, margin_y: 4, rotation: 0, velocity_x: 0, velocity_y: 0,  draw: 0},
            tower2:    { x: -10,y: 42, margin_x: 4, margin_y: 4, rotation: 0, velocity_x: 0, velocity_y: 0,  draw: 0},

            box01:       { x: 0,   y: -8,  margin_x: 8,  margin_y: 2,  rotation: 0, velocity_x: 0, velocity_y: 0, draw: 1},
            box02:       { x: -10, y: 14,   margin_x: 2,  margin_y: 24, rotation: 0, velocity_x: 0, velocity_y: 0, draw: 1},
            box03:       { x: 6,   y: 8,   margin_x: 14, margin_y: 2,  rotation: 0, velocity_x: 0, velocity_y: 0, draw: 1},
            box04:       { x: 22,  y: 2,   margin_x: 2,  margin_y: 28, rotation: 0, velocity_x: 0, velocity_y: 0, draw: 1},
            box05:       { x: 0,   y: -24, margin_x: 24, margin_y: 2,  rotation: 0, velocity_x: 0, velocity_y: 0, draw: 1},
            box06:       { x: -24, y: -2,  margin_x: 2,  margin_y: 24, rotation: 0, velocity_x: 0, velocity_y: 0, draw: 1},
//            box07:       { x: -2, y: -2,  margin_x: 2,  margin_y: 24, rotation: 0, velocity_x: 0, velocity_y: 0, draw: 1},
            box08:       { x: -36 + 8*Math.sin(1.5*t),
                                   y: 10,   margin_x: 2,  margin_y: 2,  rotation: 0, velocity_x: 5, velocity_y: 0, draw: 1},
            box09:       { x: -36 + 8*Math.sin(1.5*t + 0.2),
                                   y: 6,   margin_x: 2,  margin_y: 2,  rotation: 0, velocity_x: 5, velocity_y: 0, draw: 1},
            box10:       { x: -36 + 8*Math.sin(1.5*t + 0.4),
                                   y: 2,   margin_x: 2,  margin_y: 2,  rotation: 0, velocity_x: 5, velocity_y: 0, draw: 1},
            box11:       { x: -36 + 8*Math.sin(1.5*t + 0.6),
                                   y: -2,  margin_x: 2,  margin_y: 2,  rotation: 0, velocity_x: 5, velocity_y: 0, draw: 1},
            box12:       { x: -36 + 8*Math.sin(1.5*t + 0.8),
                                   y: -6,  margin_x: 2,  margin_y: 2,  rotation: 0, velocity_x: 5, velocity_y: 0, draw: 1},
            box13:       { x: -36 + 8*Math.sin(1.5*t + 1),
                                   y: -10,  margin_x: 2,  margin_y: 2,  rotation: 0, velocity_x: 5, velocity_y: 0, draw: 1},
            box14:       { x: -36 + 8*Math.sin(1.5*t + 1.2),
                                   y: -14,  margin_x: 2,  margin_y: 2,  rotation: 0, velocity_x: 5, velocity_y: 0, draw: 1},
            box15:       { x: -36 + 8*Math.sin(1.5*t + 1.4),
                                   y: -18,  margin_x: 2,  margin_y: 2,  rotation: 0, velocity_x: 5, velocity_y: 0, draw: 1},
            box16:       { x: -36 + 8*Math.sin(1.5*t + 1.6),
                                   y: -22, margin_x: 2,  margin_y: 2,  rotation: 0, velocity_x: 5, velocity_y: 0, draw: 1},
            box17:       { x: -38, y: 28 + 8*Math.cos(1.5*t + 1.8),
                                           margin_x: 12, margin_y: 2,  rotation: 0, velocity_x: 0, velocity_y: 18, draw: 1},
            box18:       { x: -2,  y: -38, margin_x: 24, margin_y: 2,  rotation: 0, velocity_x: 0, velocity_y: 0, draw: 1},
            box19:       { x: -24, y: -36 + 6*Math.cos(1.5*t),
                                           margin_x: 2,  margin_y: 8,  rotation: 0, velocity_x: 0, velocity_y: 5, draw: 1},
            box20:       { x: 22 , y: -36 - 6*Math.cos(1.5*t),
                                           margin_x: 2,  margin_y: 8,  rotation: 0, velocity_x: 0, velocity_y: 5, draw: 1},
            box21:       { x: 32,  y: -20, margin_x: 8,  margin_y: 2,  rotation: 0, velocity_x: 0, velocity_y: 0, draw: 1},
            box22:       { x: 40,  y: -8 , margin_x: 8,  margin_y: 2,  rotation: 0, velocity_x: 0, velocity_y: 0, draw: 1},
            box23:       { x: 32,  y: 4,   margin_x: 8,  margin_y: 2,  rotation: 0, velocity_x: 0, velocity_y: 0, draw: 1},
            box24:       { x: 40,  y: 16,   margin_x: 8,  margin_y: 2,  rotation: 0, velocity_x: 0, velocity_y: 0, draw: 1},
            box25:       { x: 32,  y: 28,  margin_x: 8,  margin_y: 2,  rotation: 0, velocity_x: 0, velocity_y: 0, draw: 1},
            box26:       { x: 10,   y: 28,  margin_x: 2,  margin_y: 8,  rotation: 0, velocity_x: 0, velocity_y: 0, draw: 1},
            box27:       { x: 36,  y: -36, margin_x: 4 + 2*Math.sin(t),  margin_y: 4 + 2*Math.sin(t), 
                                                                       rotation: 0, velocity_x: 0, velocity_y: 0, draw: 1},
        },

        // level 2 items
        {
            left_wall:   { x: -48, y: 0,   margin_x: 1,  margin_y: 50, rotation: 0, velocity_x: 0, velocity_y: 0, draw: 0},
            right_wall:  { x: 48,  y: 0,   margin_x: 1,  margin_y: 50, rotation: 0, velocity_x: 0, velocity_y: 0, draw: 0},
            upper_wall:  { x: 0,   y: 48,  margin_x: 50, margin_y: 1,  rotation: 0, velocity_x: 0, velocity_y: 0, draw: 0},
            lower_wall:  { x: 0,   y: -48, margin_x: 50, margin_y: 1,  rotation: 0, velocity_x: 0, velocity_y: 0, draw: 0},

            tower1:    { x: 10, y: 42, margin_x: 4, margin_y: 4, rotation: 0, velocity_x: 0, velocity_y: 0,  draw: 0},
            tower2:    { x: -10,y: 42, margin_x: 4, margin_y: 4, rotation: 0, velocity_x: 0, velocity_y: 0,  draw: 0},


            box01:       { x: 0,   y: 8,   margin_x: 8,  margin_y: 2,  rotation: 0, velocity_x: 0, velocity_y: 0, draw: 1},
            box02:       { x: 10,   y: -16,  margin_x: 2,  margin_y: 26, rotation: 0, velocity_x: 0, velocity_y: 0, draw: 1},
            box03:       { x: -10,  y: -20, margin_x: 2,  margin_y: 30, rotation: 0, velocity_x: 0, velocity_y: 0, draw: 1},
            box04:       { x: 0 + 10*Math.sin(1*t),
                                   y: -12,  margin_x: 2,  margin_y: 2,  rotation: 0, velocity_x: 5, velocity_y: 0, draw: 1},
            box05:       { x: 0 + 10*Math.sin(1*t + Math.PI),
                                   y: -18,  margin_x: 2,  margin_y: 2,  rotation: 0, velocity_x: 5, velocity_y: 0, draw: 1},
            box06:       { x: 0 + 10*Math.sin(1*t),
                                   y: -24, margin_x: 2,  margin_y: 2,  rotation: 0, velocity_x: 5, velocity_y: 0, draw: 1},
            box07:       { x: 0 + 10*Math.sin(1*t + Math.PI),
                                   y: -30, margin_x: 2,  margin_y: 2,  rotation: 0, velocity_x: 5, velocity_y: 0, draw: 1},
            box08:       { x: 0 + 10*Math.sin(1*t),
                                   y: -36, margin_x: 2,  margin_y: 2,  rotation: 0, velocity_x: 5, velocity_y: 0, draw: 1},
            box09:       { x: 30,  y: -32, margin_x: 2,  margin_y: 6,  rotation: 0, velocity_x: 0, velocity_y: 0, draw: 1},
            box10:       { x: 30,  y: -10, margin_x: 2,  margin_y: 7,  rotation: 0, velocity_x: 0, velocity_y: 0, draw: 1},
            box11:       { x: 30,  y: 16,  margin_x: 2,  margin_y: 8,  rotation: 0, velocity_x: 0, velocity_y: 0, draw: 1},
            box12:       { x: 20,  y: -40, margin_x: 8,  margin_y: 2,  rotation: 0, velocity_x: 0, velocity_y: 0, draw: 1},
            box13:       { x: 20,  y: -40 + 8*(t % 6), 
                                           margin_x: 8,  margin_y: 2,  rotation: 0, velocity_x: 0, velocity_y: 4, draw: 1},
            box14:       { x: 20,  y: -40 + 8*((t + 4) % 6), 
                                           margin_x: 8,  margin_y: 2,  rotation: 0, velocity_x: 0, velocity_y: 4, draw: 1},
            box15:       { x: 20,  y: -40 + 8*((t + 8) % 6), 
                                           margin_x: 8,  margin_y: 2,  rotation: 0, velocity_x: 0, velocity_y: 4, draw: 1},
            box16:       { x: 20,  y: 8,   margin_x: 8,  margin_y: 2,  rotation: 0, velocity_x: 0, velocity_y: 0, draw: 1},
            box17:       { x: 40,  y: -10, margin_x: 8,  margin_y: 2,  rotation: 0, velocity_x: 0, velocity_y: 0, draw: 1},
            box18:       { x: 40,  y: -48 + 8*((t + 2.5) % 9), 
                                           margin_x: 8,  margin_y: 2,  rotation: 0, velocity_x: 0, velocity_y: 4, draw: 1},
            box19:       { x: 40,  y: -48 + 8*((t + 4.5) % 9), 
                                           margin_x: 8,  margin_y: 2,  rotation: 0, velocity_x: 0, velocity_y: 4, draw: 1},
            box20:       { x: 40,  y: -48 + 8*((t + 6.5) % 9), 
                                           margin_x: 8,  margin_y: 2,  rotation: 0, velocity_x: 0, velocity_y: 4, draw: 1},
            box21:       { x: 40,  y: -48 + 8*((t + 8.5) % 9), 
                                           margin_x: 8,  margin_y: 2,  rotation: 0, velocity_x: 0, velocity_y: 4, draw: 1},
            box22:       { x: 16,   y: 36, margin_x: 2,  margin_y: 14, rotation: 0, velocity_x: 0, velocity_y: 0, draw: 1},
            box23:       { x: -2,  y: 20,  margin_x: 20, margin_y: 2,  rotation: 0, velocity_x: 0, velocity_y: 0, draw: 1},
            box24:       { x: -24, y: -8,  margin_x: 2,  margin_y: 30, rotation: 0, velocity_x: 0, velocity_y: 0, draw: 1},
            box25:       { x: -17, y: 20 - 10*((t + 4) % 6),
                                           margin_x: 4,  margin_y: 2,  rotation: 0, velocity_x: 0, velocity_y: 5, draw: 1},
            box26:       { x: -17,y: 20 - 10*((t + 6) % 6),
                                           margin_x: 4,  margin_y: 2,  rotation: 0, velocity_x: 0, velocity_y: 5, draw: 1},
            box27:       { x: -17,y: 20 - 10*((t + 8) % 6),
                                           margin_x: 4,  margin_y: 2,  rotation: 0, velocity_x: 0, velocity_y: 5, draw: 1},

            box28:       { x: -36 + 8*Math.sin(2.5*t),
                                   y: 10,   margin_x: 2,  margin_y: 2,  rotation: 0, velocity_x: 5, velocity_y: 0, draw: 1},
            box29:       { x: -36 + 8*Math.sin(2.5*t + 0.4 * 1),
                                   y: 6,   margin_x: 2,  margin_y: 2,  rotation: 0, velocity_x: 5, velocity_y: 0, draw: 1},
            box30:       { x: -36 + 8*Math.sin(2.5*t + 0.4 * 2),
                                   y: 2,   margin_x: 2,  margin_y: 2,  rotation: 0, velocity_x: 5, velocity_y: 0, draw: 1},
            box31:       { x: -36 + 8*Math.sin(2.5*t + 0.4 * 3),
                                   y: -2,  margin_x: 2,  margin_y: 2,  rotation: 0, velocity_x: 5, velocity_y: 0, draw: 1},
            box32:       { x: -36 + 8*Math.sin(2.5*t + 0.4 * 4),
                                   y: -6,  margin_x: 2,  margin_y: 2,  rotation: 0, velocity_x: 5, velocity_y: 0, draw: 1},
            box33:       { x: -36 + 8*Math.sin(2.5*t + 0.4 * 5),
                                   y: -10,  margin_x: 2,  margin_y: 2,  rotation: 0, velocity_x: 5, velocity_y: 0, draw: 1},
            box34:       { x: -36 + 8*Math.sin(2.5*t + 0.4 * 6),
                                   y: -14,  margin_x: 2,  margin_y: 2,  rotation: 0, velocity_x: 5, velocity_y: 0, draw: 1},
            box35:       { x: -36 + 8*Math.sin(2.5*t + 0.4 * 7),
                                   y: -18,  margin_x: 2,  margin_y: 2,  rotation: 0, velocity_x: 5, velocity_y: 0, draw: 1},
            box36:       { x: -36 + 8*Math.sin(2.5*t + 0.4 * 8),
                                   y: -22, margin_x: 2,  margin_y: 2,  rotation: 0, velocity_x: 5, velocity_y: 0, draw: 1},
            box37:       { x: -36 + 8*Math.sin(2.5*t + 0.4 * 9),
                                   y: -26, margin_x: 2,  margin_y: 2,  rotation: 0, velocity_x: 5, velocity_y: 0, draw: 1},
            box38:       { x: -36 + 8*Math.sin(2.5*t + 0.4 * 10),
                                   y: -30, margin_x: 2,  margin_y: 2,  rotation: 0, velocity_x: 5, velocity_y: 0, draw: 1},
            box39:       { x: -36 + 8*Math.sin(2.5*t + 0.4 * -1),
                                   y: 14, margin_x: 2,  margin_y: 2,  rotation: 0, velocity_x: 5, velocity_y: 0, draw: 1},
            box40:       { x: -36 + 8*Math.sin(2.5*t + 0.4 * -2),
                                   y: 18, margin_x: 2,  margin_y: 2,  rotation: 0, velocity_x: 5, velocity_y: 0, draw: 1},
            box41:       { x: -36 + 8*Math.sin(2.5*t + 0.4 * 11),
                                   y: -34, margin_x: 2,  margin_y: 2,  rotation: 0, velocity_x: 5, velocity_y: 0, draw: 1},
            box42:       { x: -36 + 8*Math.sin(2.5*t + 0.4 * -3),
                                   y: 22, margin_x: 2,  margin_y: 2,  rotation: 0, velocity_x: 5, velocity_y: 0, draw: 1},
        },

        // level 3 items
        {
            left_wall: { x: -49, y: 0, margin_x: 1, margin_y: 50, rotation: 0, velocity_x: 0, velocity_y: 0, draw: 0 },
            right_wall: { x: 49, y: 0, margin_x: 1, margin_y: 50, rotation: 0, velocity_x: 0, velocity_y: 0, draw: 0 },
            upper_wall: { x: 0,  y: 49,margin_x: 50,margin_y: 1,  rotation: 0, velocity_x: 0, velocity_y: 0, draw: 0 },
            lower_wall: { x: 0,  y: -49,margin_x: 50,margin_y: 1, rotation: 0, velocity_x: 0, velocity_y: 0, draw: 0 },

            tower1:    { x: 10, y: 42, margin_x: 4, margin_y: 4, rotation: 0, velocity_x: 0, velocity_y: 0,  draw: 0},
            tower2:    { x: -10,y: 42, margin_x: 4, margin_y: 4, rotation: 0, velocity_x: 0, velocity_y: 0,  draw: 0},

        }
         ];

//       console.log("x: ", this.x_coord, "y: ", this.y_coord);

        // Compare the ball's current coordinates with those of the inanimate objects
        // If the ball is touching one of the inanimate objects, then the ball cannot move
        // through that object

        var col = this.yellow;

        for(var obj in object_coords[this.game_level])
        {
            if  ((this.x_coord*2 > (object_coords[this.game_level][obj].x - object_coords[this.game_level][obj].margin_x - 0.1)
              && (this.x_coord*2 < (object_coords[this.game_level][obj].x + object_coords[this.game_level][obj].margin_x + 0.1))
              && (this.y_coord*2 > (object_coords[this.game_level][obj].y - object_coords[this.game_level][obj].margin_y - 0.1))
              && (this.y_coord*2 < (object_coords[this.game_level][obj].y + object_coords[this.game_level][obj].margin_y + 0.1)))
              || (this.x_coord*2 > 49 || this.x_coord*2 < -49 || this.y_coord*2 > 49 || this.y_coord*2 < -49)) 
              {
                this.y_coord = this.x_coord = this.y_vel = this.x_vel = 0;
                var x = new Audio("assets/Crowd Boo.mp3"); 
                    x.play();
              }
        }



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

        //var old_vel = Math.sqrt(Math.pow(this.x_vel,2) + Math.pow(this.y_vel,2));
        this.x_vel_old = this.x_vel;
        this.y_vel_old = this.y_vel;
        
        for(var obj in object_coords[this.game_level]) {
            if(this.checkBallIntersect(object_coords[this.game_level][obj])) {
                /*if (Math.sqrt(Math.pow(this.x_acc,2) + Math.pow(this.y_acc,2)) > 7)
                {
                    var x = new Audio("assets/bat+hit+ball.wav"); 
                    x.play();
                }
                */
    
                console.log("collide");
//                col = this.blue;                
                object_coords[this.game_level][obj].x /= 2;//object_coords[this.game_level][obj].margin_x/2;
                object_coords[this.game_level][obj].y /= 2;//object_coords[this.game_level][obj].margin_y/2;

                // calculate bearing angle between ball and object (where 0 is defined as East)
                const dx = this.x_coord - object_coords[this.game_level][obj].x;
                const dy = this.y_coord - object_coords[this.game_level][obj].y;
                var theta = (Math.atan2(dy,dx) - object_coords[this.game_level][obj].rotation)*(180/Math.PI);

                // range of bearing angles of each face
                // use to determine which face the ball hits
                const y_angle = (Math.atan(object_coords[this.game_level][obj].margin_y/object_coords[this.game_level][obj].margin_x))*(180/Math.PI);
                const x_angle = (Math.atan(object_coords[this.game_level][obj].margin_x/object_coords[this.game_level][obj].margin_y))*(180/Math.PI);

                // determine the angle of direction of the ball
//                 const kappa = 1e-1;
//                 const phi = Math.atan(this.y_vel/(this.x_vel+kappa));

//                 var face_angle;
//                 var normal_x;
//                 var normal_y;


                // right face
                if(theta > -y_angle && theta < y_angle) {
                    this.x_vel = (-this.x_vel + 2*object_coords[this.game_level][obj].velocity_x);
                       console.log("right");   
//                     face_angle = 90 - object_coords[this.game_level][obj].rotation*(180/Math.PI);
//                     normal_x = Math.sin(face_angle);
//                     normal_y = Math.cos(face_angle);
//                     console.log(face_angle);
//                     this.x_vel = 2*normal_x;
//                     this.y_vel = 2*normal_y;

                }
                // if the ball hits top face
                else if(theta > y_angle && theta < (y_angle + 2*x_angle)) {
                    this.y_vel = (-this.y_vel + 2*object_coords[this.game_level][obj].velocity_y);
                    console.log("top");
//                     face_angle = object_coords[this.game_level][obj].rotation;
//                     normal_x = Math.sin(face_angle);
//                     normal_y = Math.cos(face_angle);
//                     this.x_vel = 2*normal_x;
//                     this.y_vel = 2*normal_y;
                }
                // etc.
                else if(theta < -y_angle && theta > (-y_angle - 2*x_angle)) {
                    this.y_vel = (-this.y_vel - 2*object_coords[this.game_level][obj].velocity_y);
                    console.log("bottom");
//                     face_angle = object_coords[this.game_level][obj].rotation;
//                     normal_x = Math.sin(face_angle);
//                     normal_y = Math.cos(face_angle);
//                     this.x_vel = 2*normal_x;
//                     this.y_vel = -2*normal_y;                    
                }
                else if(theta < (-y_angle - 2*x_angle) || theta > (y_angle + 2*x_angle)) {                    
                    this.x_vel = (-this.x_vel - 2*object_coords[this.game_level][obj].velocity_x);
                    console.log("left");
//                     face_angle = 90 - object_coords[this.game_level][obj].rotation;
//                     normal_x = Math.sin(face_angle);
//                     normal_y = Math.cos(face_angle);
//                     this.x_vel = -2*normal_x;
//                     this.y_vel = 2*normal_y;                    
                 }
                else {
                   this.x_vel *= -1;
                   this.y_vel *= -1;
                }

                var vel_diff = Math.sqrt(Math.pow(this.x_vel - this.x_vel_old,2) + Math.pow(this.y_vel - this.y_vel_old,2));
                //var vel_diff = old_vel - new_vel;

                if (Math.abs(vel_diff) > 1)
                {
                    var x = new Audio("assets/bat+hit+ball.wav"); 
                    x.play();
                }

                 
                 object_coords[this.game_level][obj].x *= 2;//object_coords[this.game_level][obj].margin_x/2;
                 object_coords[this.game_level][obj].y *= 2;//object_coords[this.game_level][obj].margin_y/2;
            }
        }
        
        // Velocity
        this.x_coord += this.x_vel * delta_time;
        this.y_coord += this.y_vel * delta_time;
        
        this.my_cross = Vec.of(0, 0, 1).cross(Vec.of(this.x_vel, this.y_vel, 0));
        this.phi += Math.sqrt(Math.pow(this.x_vel * delta_time, 2) + Math.pow(this.y_vel * delta_time, 2)) / 2;

        // Draw the basic map scene centered at the origin
        // The plane of the board faces the positive Z direction
        let baseboard = Mat4.identity();
        let wall = baseboard;

        // Draw the baseboard
        baseboard = baseboard.times(Mat4.scale(Vec.of(50, 50, 1)));
        this.shapes.simplebox.draw(graphics_state, baseboard, this.plastic.override({color: this.green}));

//        Draw the four walls of the baseboard (remains in all levels)
        for (var i = 0; i < 4; ++i)
        {
            this.shapes.simplebox.draw(graphics_state,
                wall.times(Mat4.rotation(Math.PI/2 * (i > 1), Vec.of(0, 0, 1)))
                    .times(Mat4.translation(Vec.of(0, ((i % 2) ? 49 : -49), 5)))
                    .times(Mat4.scale(Vec.of(50, 1, 4)))
                    , this.plastic.override({color: this.brown}));
        }

        // Draw castle gates (remains in all levels):
        this.shapes.castle.draw(graphics_state, 
            Mat4.identity()
                .times(Mat4.translation(Vec.of(object_coords[this.game_level].tower1.x, object_coords[this.game_level].tower1.y, this.z_coord + 8))), this.plastic.override({color: this.lightgrey}));
        this.shapes.castle.draw(graphics_state, 
            Mat4.identity()
                .times(Mat4.translation(Vec.of(object_coords[this.game_level].tower2.x, object_coords[this.game_level].tower2.y, this.z_coord + 8))), this.plastic.override({color: this.lightgrey}));

        // Main ball that rolls around (remains in all levels)
        this.shapes.ball.draw(graphics_state, 
                Mat4.identity()
                    .times(Mat4.scale(2))
                    .times(Mat4.translation(Vec.of(this.x_coord, this.y_coord, this.z_coord)))
                    .times(Mat4.rotation(this.phi, this.my_cross)),
                    this.shape_materials.ball || this.plastic.override({color: this.lightgrey}));

        // Only draw certain objects depending on the game level
        if (this.game_level == 0)
        {
        // level 0
            this.shapes.simplebox.draw(graphics_state, Mat4.identity().times(Mat4.translation(Vec.of(object_coords[0].box1.x, object_coords[0].box1.y, this.z_coord+2))).times(Mat4.scale(2)), this.plastic.override({color: this.brown}));
            this.shapes.simplebox.draw(graphics_state, Mat4.identity().times(Mat4.translation(Vec.of(object_coords[0].box2.x, object_coords[0].box2.y, this.z_coord+2))).times(Mat4.scale(2)), this.plastic.override({color: this.brown}));
            this.shapes.simplebox.draw(graphics_state, Mat4.identity().times(Mat4.translation(Vec.of(object_coords[0].box3.x, object_coords[0].box3.y, this.z_coord+2))).times(Mat4.scale(2)), this.plastic.override({color: this.brown}));

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
            this.draw_tree(graphics_state, Mat4.identity().times(Mat4.translation(Vec.of(0, 0, 2))).times(Mat4.rotation(Math.PI/2, Vec.of(1, 0, 0))).times(Mat4.translation(Vec.of(object_coords[this.game_level].tree_stump1.x, 4, -object_coords[this.game_level].tree_stump1.y))));
            this.shapes.simplebox.draw(graphics_state, Mat4.identity().times(Mat4.translation(Vec.of(object_coords[this.game_level].tree_stump1.x, object_coords[this.game_level].tree_stump1.y, this.z_coord + 2))).times(Mat4.scale(2)), this.plastic.override({color: this.brown}));

            this.draw_tree(graphics_state, Mat4.identity().times(Mat4.translation(Vec.of(0, 0, 2))).times(Mat4.rotation(Math.PI/2, Vec.of(1, 0, 0))).times(Mat4.translation(Vec.of(object_coords[this.game_level].tree_stump2.x, 4, object_coords[this.game_level].tree_stump2.y))).times(Mat4.rotation(Math.PI, Vec.of(0, 1, 0))));
            this.shapes.simplebox.draw(graphics_state, Mat4.identity().times(Mat4.translation(Vec.of(object_coords[this.game_level].tree_stump2.x, object_coords[this.game_level].tree_stump2.y, this.z_coord + 2))).times(Mat4.scale(2)), this.plastic.override({color: this.brown}));

            // object with flat shading
            this.shapes.pointy_boi.draw(graphics_state, Mat4.identity().times(Mat4.translation(Vec.of(object_coords[this.game_level].pointyboi.x, object_coords[this.game_level].pointyboi.y, 4))).times(Mat4.scale(3)), this.plastic.override({color: this.lightgrey}));
        }
        else // we have level 1+
        {
            for (var obj in object_coords[this.game_level])
            {
                if (object_coords[this.game_level][obj].draw == 1)
                {
                    this.shapes.simplebox.draw(graphics_state,
                            Mat4.identity()
                            .times(Mat4.translation(Vec.of(object_coords[this.game_level][obj].x, object_coords[this.game_level][obj].y, this.z_coord + 2)))
                            .times(Mat4.scale(Vec.of(object_coords[this.game_level][obj].margin_x, object_coords[this.game_level][obj].margin_y, 2)))
                            , this.plastic.override({color: this.brown}))
                }
            }
        }

        // Level transitions
        if (this.y_coord*2 > (object_coords[0].tower1.y) && this.x_coord*2 < (object_coords[0].tower1.x) && this.x_coord*2 > (object_coords[0].tower2.x))
        {
            this.game_level += 1;
            this.x_coord = this.y_coord = this.x_vel = this.y_vel = this.x_acc = this.y_acc = 0;
            if (this.game_level == 4) 
            {
                this.game_level = 0;
                this.cheer_temp = 0
            }
        }

        // Draw text line:
        this.shapes.text_line.draw(graphics_state,
            Mat4.identity()
                .times(Mat4.translation(Vec.of(-37, 55, 20)))    // z.axis = 2 for surface
                .times(Mat4.rotation(Math.PI/2, Vec.of(1, 0, 0)))
                .times(Mat4.scale(5)), this.shape_materials['text_line']);

        if (this.game_level == 0)
        {
            this.shapes.level1_text_line.draw(graphics_state,
                Mat4.identity()
                    .times(Mat4.translation(Vec.of(-15, 30, 2)))    // z.axis = 2 for surface
                    .times(Mat4.rotation(Math.PI/2 * 0, Vec.of(1, 0, 0)))
                    .times(Mat4.scale(5)), this.shape_materials['text_line']);
     
        }
        else if (this.game_level == 1)
        {
            this.shapes.level2_text_line.draw(graphics_state,
                Mat4.identity()
                    .times(Mat4.translation(Vec.of(0, 30, 2)))    // z.axis = 2 for surface
                    .times(Mat4.rotation(Math.PI/2 * 0, Vec.of(1, 0, 0)))
                    .times(Mat4.scale(5)), this.shape_materials['text_line']);
     
        }
        else if (this.game_level == 2)
        {
            this.shapes.level3_text_line.draw(graphics_state,
                Mat4.identity()
                    .times(Mat4.translation(Vec.of(0, 30, 2)))    // z.axis = 2 for surface
                    .times(Mat4.rotation(Math.PI/2 * 0, Vec.of(1, 0, 0)))
                    .times(Mat4.scale(5)), this.shape_materials['text_line']);
     
        }
        else if (this.game_level == 3)
        {
            if (this.cheer_temp == 0)
            {
                var x = new Audio("assets/cheer.wav"); 
                x.play();  
                this.cheer_temp = 1;  
            }
            this.shapes.level4_text_line.draw(graphics_state,
                Mat4.identity()
                    .times(Mat4.translation(Vec.of(-20, 30, 2)))    // z.axis = 2 for surface
                    .times(Mat4.rotation(Math.PI/2 * 0, Vec.of(1, 0, 0)))
                    .times(Mat4.scale(5)), this.shape_materials['text_line']);
    
            this.shapes.final_text_line.draw(graphics_state,
                Mat4.identity()
                    .times(Mat4.translation(Vec.of(-30, 0, 2)))    // z.axis = 2 for surface
                    .times(Mat4.scale(6)), this.shape_materials['text_line']);
     
        }
        

        graphics_state.camera_transform = Mat4.look_at(Vec.of(this.x_coord*2, (this.y_coord - 30)*2, (this.z_coord + 30)*2), Vec.of(this.x_coord*2, this.y_coord*2, this.z_coord*2), Vec.of(0, 0, 1));
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