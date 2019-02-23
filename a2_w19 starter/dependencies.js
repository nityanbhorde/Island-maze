// Subclasses of Shader each store and manage a complete GPU program.  This Shader is 
// the simplest example of one.  It samples pixels from colors that are directly assigned 
// to the vertices.  Materials here are minimal, without any settings.
window.Basic_Shader = window.classes.Basic_Shader = class Basic_Shader extends Shader {
    material() {
        return {
            shader: this
        }
    }
    
    // The shader will pull single entries out of the vertex arrays, by their data fields'
    // names.  Map those names onto the arrays we'll pull them from.  This determines
    // which kinds of Shapes this Shader is compatible with.  Thanks to this function, 
    // Vertex buffers in the GPU can get their pointers matched up with pointers to 
    // attribute names in the GPU.  Shapes and Shaders can still be compatible even
    // if some vertex data feilds are unused. 
    map_attribute_name_to_buffer_name(name) {
        // Use a simple lookup table.
        return {
            object_space_pos: "positions",
            color: "colors"
        }[name];
    }

    // Define how to synchronize our JavaScript's variables to the GPU's:
    update_GPU(g_state, model_transform, material, gpu=this.g_addrs, gl=this.gl) {
        const PCM = g_state.projection_transform.times(g_state.camera_transform).times(model_transform);
        gl.uniformMatrix4fv(gpu.projection_camera_model_transform_loc, false, Mat.flatten_2D_to_1D(PCM.transposed()));
    }

    // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
    shared_glsl_code() {
        return `
            precision mediump float;
            varying vec4 VERTEX_COLOR;`;
    }

    // ********* VERTEX SHADER *********
    vertex_glsl_code() {
        return `
            attribute vec4 color;
            attribute vec3 object_space_pos;
            uniform mat4 projection_camera_model_transform;

            void main() {
                // The vertex's final resting place (in NDCS).
                gl_Position = projection_camera_model_transform * vec4(object_space_pos, 1.0);

                // Use the hard-coded color of the vertex.
                VERTEX_COLOR = color;
            }`;
    }

    // ********* FRAGMENT SHADER *********
    fragment_glsl_code() {
        return `
            void main() {
                // The interpolation gets done directly on the per-vertex colors.
                gl_FragColor = VERTEX_COLOR;
            }`;
    }
}


// THE DEFAULT SHADER: This uses the Phong Reflection Model, with optional Gouraud shading. 
// Wikipedia has good defintions for these concepts.  Subclasses of class Shader each store 
// and manage a complete GPU program.  This particular one is a big "master shader" meant to 
// handle all sorts of lighting situations in a configurable way. 
// Phong Shading is the act of determining brightness of pixels via vector math.  It compares
// the normal vector at that pixel to the vectors toward the camera and light sources.
//
// *** How Shaders Work:
// The "vertex_glsl_code" string below is code that is sent to the graphics card at runtime, 
// where on each run it gets compiled and linked there.  Thereafter, all of your calls to draw 
// shapes will launch the vertex shader program once per vertex in the shape (three times per 
// triangle), sending results on to the next phase.  The purpose of this vertex shader program 
// is to calculate the final resting place of vertices in screen coordinates; each vertex 
// starts out in local object coordinates and then undergoes a matrix transform to get there.
//
// Likewise, the "fragment_glsl_code" string is used as the Fragment Shader program, which gets 
// sent to the graphics card at runtime.  The fragment shader runs once all the vertices in a 
// triangle / element finish their vertex shader programs, and thus have finished finding out 
// where they land on the screen.  The fragment shader fills in (shades) every pixel (fragment) 
// overlapping where the triangle landed.  It retrieves different values (such as vectors) that 
// are stored at three extreme points of the triangle, and then interpolates the values weighted 
// by the pixel's proximity to each extreme point, using them in formulas to determine color.
// The fragment colors may or may not become final pixel colors; there could already be other 
// triangles' fragments occupying the same pixels.  The Z-Buffer test is applied to see if the 
// new triangle is closer to the camera, and even if so, blending settings may interpolate some 
// of the old color into the result.  Finally, an image is displayed onscreen.
window.Phong_Shader = window.classes.Phong_Shader = class Phong_Shader extends Shader {

    // Define an internal class "Material" that stores the standard settings found in Phong lighting.
    material(color, properties) {
        // Possible properties: ambient, diffusivity, specularity, smoothness, texture.
        return new class Material {
            constructor(shader, color=Color.of(0, 0, 0, 1), ambient=0, diffusivity=1, specularity=1, smoothness=40) {
                // Assign defaults.
                Object.assign(this, {
                    shader,
                    color,
                    ambient,
                    diffusivity,
                    specularity,
                    smoothness
                });

                // Optionally override defaults.
                Object.assign(this, properties);
            }

            // Easily make temporary overridden versions of a base material, such as
            // of a different color or diffusivity.  Use "opacity" to override only that.
            override(properties) {
                const copied = new this.constructor();
                Object.assign(copied, this);
                Object.assign(copied, properties);
                copied.color = copied.color.copy();
                if (properties["opacity"] != undefined)
                    copied.color[3] = properties["opacity"];
                return copied;
            }
        }
        (this,color);
    }

    // We'll pull single entries out per vertex by field name.  Map
    // those names onto the vertex array names we'll pull them from.
    map_attribute_name_to_buffer_name(name) {
        // Use a simple lookup table.
        return {
            object_space_pos: "positions",
            normal: "normals",
            tex_coord: "texture_coords"
        }[name];
    }
    
    // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
    shared_glsl_code() 
    {
        return `
            precision mediump float;

            // We're limited to only so many inputs in hardware.  Lights are costly (lots of sub-values).
            const int N_LIGHTS = 2;
            uniform float ambient, diffusivity, specularity, smoothness, animation_time, attenuation_factor[N_LIGHTS];

            // Flags for alternate shading methods
            uniform bool GOURAUD, COLOR_NORMALS, USE_TEXTURE;
            uniform vec4 lightPosition[N_LIGHTS], lightColor[N_LIGHTS], shapeColor;
            
            // Specifier "varying" means a variable's final value will be passed from the vertex shader
            // on to the next phase (fragment shader), then interpolated per-fragment, weighted by the 
            // pixel fragment's proximity to each of the 3 vertices (barycentric interpolation).       
            varying vec3 N, E;                     
            varying vec2 f_tex_coord;             
            varying vec4 VERTEX_COLOR;            
            varying vec3 L[N_LIGHTS];
            varying float dist[N_LIGHTS];

            vec3 phong_model_lights( vec3 N ) {
                vec3 result = vec3(0.0);
                for(int i = 0; i < N_LIGHTS; i++) {
                    vec3 H = normalize( L[i] + E );
                    
                    float attenuation_multiplier = 1.0;// / (1.0 + attenuation_factor[i] * (dist[i] * dist[i]));
                    float diffuse  =      max( dot(N, L[i]), 0.0 );
                    float specular = pow( max( dot(N, H), 0.0 ), smoothness );

                    result += attenuation_multiplier * ( shapeColor.xyz * diffusivity * diffuse + lightColor[i].xyz * specularity * specular );
                }
                return result;
            }`;
    }

    // ********* VERTEX SHADER *********
    vertex_glsl_code() {
        return `
            attribute vec3 object_space_pos, normal;
            attribute vec2 tex_coord;

            uniform mat4 camera_transform, camera_model_transform, projection_camera_model_transform;
            uniform mat3 inverse_transpose_modelview;

            void main() {
                // The vertex's final resting place (in NDCS).
                gl_Position = projection_camera_model_transform * vec4(object_space_pos, 1.0);
                
                // The final normal vector in screen space.
                N = normalize( inverse_transpose_modelview * normal );
                
                // Directly use original texture coords and interpolate between.
                f_tex_coord = tex_coord;

                // Bypass all lighting code if we're lighting up vertices some other way.
                if( COLOR_NORMALS ) {
                    // In "normals" mode, rgb color = xyz quantity. Flash if it's negative.
                    VERTEX_COLOR = vec4( N[0] > 0.0 ? N[0] : sin( animation_time * 3.0   ) * -N[0],             
                                         N[1] > 0.0 ? N[1] : sin( animation_time * 15.0  ) * -N[1],
                                         N[2] > 0.0 ? N[2] : sin( animation_time * 45.0  ) * -N[2] , 1.0 );
                    return;
                }
                
                // The rest of this shader calculates some quantities that the Fragment shader will need:
                vec3 camera_space_pos = ( camera_model_transform * vec4(object_space_pos, 1.0) ).xyz;
                E = normalize( -camera_space_pos );

                // Light positions use homogeneous coords.  Use w = 0 for a directional light source -- a vector instead of a point.
                for( int i = 0; i < N_LIGHTS; i++ ) {
                    L[i] = normalize( ( camera_transform * lightPosition[i] ).xyz - lightPosition[i].w * camera_space_pos );

                    // Is it a point light source?  Calculate the distance to it from the object.  Otherwise use some arbitrary distance.
                    dist[i]  = lightPosition[i].w > 0.0 ? distance((camera_transform * lightPosition[i]).xyz, camera_space_pos)
                                                        : distance( attenuation_factor[i] * -lightPosition[i].xyz, object_space_pos.xyz );
                }

                // Gouraud shading mode?  If so, finalize the whole color calculation here in the vertex shader,
                // one per vertex, before we even break it down to pixels in the fragment shader.   As opposed 
                // to Smooth "Phong" Shading, where we *do* wait to calculate final color until the next shader.
                if( GOURAUD ) {
                    VERTEX_COLOR      = vec4( shapeColor.xyz * ambient, shapeColor.w);
                    VERTEX_COLOR.xyz += phong_model_lights( N );
                }
            }`;
    }

    // ********* FRAGMENT SHADER *********
    // A fragment is a pixel that's overlapped by the current triangle.
    // Fragments affect the final image or get discarded due to depth.
    fragment_glsl_code() {
        return `
            uniform sampler2D texture;

            void main() {
                // Do smooth "Phong" shading unless options like "Gouraud mode" are wanted instead.
                // Otherwise, we already have final colors to smear (interpolate) across vertices.
                if( GOURAUD || COLOR_NORMALS ) {
                    gl_FragColor = VERTEX_COLOR;
                    return;
                }                                 
                // If we get this far, calculate Smooth "Phong" Shading as opposed to Gouraud Shading.
                // Phong shading is not to be confused with the Phong Reflection Model.

                // Sample the texture image in the correct place.
                vec4 tex_color = texture2D( texture, f_tex_coord );                    

                // Compute an initial (ambient) color:
                if( USE_TEXTURE )
                    gl_FragColor = vec4( ( tex_color.xyz + shapeColor.xyz ) * ambient, shapeColor.w * tex_color.w ); 
                else
                    gl_FragColor = vec4( shapeColor.xyz * ambient, shapeColor.w );
                
                // Compute the final color with contributions from lights.
                gl_FragColor.xyz += phong_model_lights( N );
            }`;
    }

    // Define how to synchronize our JavaScript's variables to the GPU's:
    update_GPU(g_state, model_transform, material, gpu=this.g_addrs, gl=this.gl) {

        // First, send the matrices to the GPU, additionally cache-ing some products of them we know we'll need:
        this.update_matrices(g_state, model_transform, gpu, gl);
        gl.uniform1f(gpu.animation_time_loc, g_state.animation_time / 1000);

        if (g_state.gouraud === undefined) {
            g_state.gouraud = g_state.color_normals = false;
        }

        // Keep the flags seen by the shader program up-to-date and make sure they are declared.
        gl.uniform1i(gpu.GOURAUD_loc, g_state.gouraud);
        gl.uniform1i(gpu.COLOR_NORMALS_loc, g_state.color_normals);

        // Send the desired shape-wide material qualities to the graphics card, where they will
        // tweak the Phong lighting formula.
        gl.uniform4fv(gpu.shapeColor_loc,  material.color);
        gl.uniform1f( gpu.ambient_loc,     material.ambient);
        gl.uniform1f( gpu.diffusivity_loc, material.diffusivity);
        gl.uniform1f( gpu.specularity_loc, material.specularity);
        gl.uniform1f( gpu.smoothness_loc,  material.smoothness);

        // NOTE: To signal not to draw a texture, omit the texture parameter from Materials.
        if (material.texture) {
            gpu.shader_attributes["tex_coord"].enabled = true;
            gl.uniform1f(gpu.USE_TEXTURE_loc, 1);
            gl.bindTexture(gl.TEXTURE_2D, material.texture.id);
        }
        else {
            gl.uniform1f(gpu.USE_TEXTURE_loc, 0);
            gpu.shader_attributes["tex_coord"].enabled = false;
        }

        if (!g_state.lights.length)
            return;
        var lightPositions_flattened = [],
            lightColors_flattened = [],
            lightAttenuations_flattened = [];
        for (var i = 0; i < 4 * g_state.lights.length; i++) {
            lightPositions_flattened.push(g_state.lights[Math.floor(i / 4)].position[i % 4]);
            lightColors_flattened.push(g_state.lights[Math.floor(i / 4)].color[i % 4]);
            lightAttenuations_flattened[Math.floor(i / 4)] = g_state.lights[Math.floor(i / 4)].attenuation;
        }
        gl.uniform4fv(gpu.lightPosition_loc, lightPositions_flattened);
        gl.uniform4fv(gpu.lightColor_loc, lightColors_flattened);
        gl.uniform1fv(gpu.attenuation_factor_loc, lightAttenuations_flattened);
    }

    // Helper function for sending matrices to GPU.
    update_matrices(g_state, model_transform, gpu, gl) {
        // (PCM will mean Projection * Camera * Model)
        let [P,C,M] = [g_state.projection_transform, g_state.camera_transform, model_transform],
            CM = C.times(M),
            PCM = P.times(CM),
            inv_CM = Mat4.inverse(CM).sub_block([0, 0], [3, 3]);

        // Send the current matrices to the shader.  Go ahead and pre-compute
        // the products we'll need of the of the three special matrices and just
        // cache and send those.  They will be the same throughout this draw
        // call, and thus across each instance of the vertex shader.
        // Transpose them since the GPU expects matrices as column-major arrays.                                  
        gl.uniformMatrix4fv(gpu.camera_transform_loc, false, Mat.flatten_2D_to_1D(C.transposed()));
        gl.uniformMatrix4fv(gpu.camera_model_transform_loc, false, Mat.flatten_2D_to_1D(CM.transposed()));
        gl.uniformMatrix4fv(gpu.projection_camera_model_transform_loc, false, Mat.flatten_2D_to_1D(PCM.transposed()));
        gl.uniformMatrix3fv(gpu.inverse_transpose_modelview_loc, false, Mat.flatten_2D_to_1D(inv_CM));
    }
}

// Movement_Controls is a Scene_Component that can be attached to a canvas, like any 
// other Scene, but it is a Secondary Scene Component -- meant to stack alongside other
// scenes.  Rather than drawing anything it embeds both first-person and third-person
// style controls into the website.  These can be uesd to manually move your camera or
// other objects smoothly through your scene using key, mouse, and HTML button controls
// to help you explore what's in it.
window.Movement_Controls = window.classes.Movement_Controls = class Movement_Controls extends Scene_Component {
    constructor(context, control_box, canvas=context.canvas) {
        super(context, control_box);
        
        // Data members
        [this.context,this.roll,this.look_around_locked,this.invert] = [context, 0, true, true];
        [this.thrust,this.pos,this.z_axis] = [Vec.of(0, 0, 0), Vec.of(0, 0, 0), Vec.of(0, 0, 0)];

        // The camera matrix is not actually stored here inside Movement_Controls; instead, track
        // an external matrix to modify. This target is a reference (made with closures) kept
        // in "globals" so it can be seen and set by other classes.  Initially, the default target
        // is the camera matrix that Shaders use, stored in the global graphics_state object.
        this.target = function() {
            return context.globals.movement_controls_target()
        };
        context.globals.movement_controls_target = function(t) {
            return context.globals.graphics_state.camera_transform
        };
        context.globals.movement_controls_invert = this.will_invert = ()=>true;
        context.globals.has_controls = true;

        [this.radians_per_frame,this.meters_per_frame,this.speed_multiplier] = [1 / 200, 20, 1];

        // *** Mouse controls: ***
        this.mouse = { "from_center": Vec.of(0, 0) };

        // Measure mouse steering, for rotating the flyaround camera:
        const mouse_position = ( e, rect=canvas.getBoundingClientRect() ) => Vec.of(
            e.clientX - (rect.left + rect.right) / 2,
            e.clientY - (rect.bottom + rect.top) / 2);

        // Set up mouse response.  The last one stops us from reacting if the mouse leaves the canvas.
        document.addEventListener("mouseup", e=>{
            this.mouse.anchor = undefined;
        });
        canvas.addEventListener("mousedown", e=>{
            e.preventDefault();
            this.mouse.anchor = mouse_position(e);
        });
        canvas.addEventListener("mousemove", e=>{
            e.preventDefault();
            this.mouse.from_center = mouse_position(e);
        }
        );
        canvas.addEventListener("mouseout", e=>{
            if (!this.mouse.anchor)
                this.mouse.from_center.scale(0)
        });
    }

    show_explanation(document_element) {}
    
    // This function of a scene sets up its keyboard shortcuts.
    make_control_panel() {
        const globals = this.globals;
        this.control_panel.innerHTML += "Click and drag the scene to <br> spin your viewpoint around it.<br>";
        this.key_triggered_button("Up", [" "], ()=>this.thrust[1] = -1, undefined, ()=>this.thrust[1] = 0);
        this.key_triggered_button("Forward", ["w"], ()=>this.thrust[2] = 1, undefined, ()=>this.thrust[2] = 0);
        this.new_line();
        this.key_triggered_button("Left", ["a"], ()=>this.thrust[0] = 1, undefined, ()=>this.thrust[0] = 0);
        this.key_triggered_button("Back", ["s"], ()=>this.thrust[2] = -1, undefined, ()=>this.thrust[2] = 0);
        this.key_triggered_button("Right", ["d"], ()=>this.thrust[0] = -1, undefined, ()=>this.thrust[0] = 0);
        this.new_line();
        this.key_triggered_button("Down", ["z"], ()=>this.thrust[1] = 1, undefined, ()=>this.thrust[1] = 0);

        const speed_controls = this.control_panel.appendChild(document.createElement("span"));
        speed_controls.style.margin = "30px";
        this.key_triggered_button("-", ["o"], ()=>this.speed_multiplier /= 1.2, "green", undefined, undefined, speed_controls);
        this.live_string(box=>{
            box.textContent = "Speed: " + this.speed_multiplier.toFixed(2)
        }, speed_controls);
        this.key_triggered_button("+", ["p"], ()=>this.speed_multiplier *= 1.2, "green", undefined, undefined, speed_controls);
        this.new_line();
        this.key_triggered_button("Roll left", [","], ()=>this.roll = 1, undefined, ()=>this.roll = 0);
        this.key_triggered_button("Roll right", ["."], ()=>this.roll = -1, undefined, ()=>this.roll = 0);
        this.new_line();
        this.key_triggered_button("(Un)freeze mouse look around", ["f"], ()=>this.look_around_locked ^= 1, "green");
        this.new_line();
        this.live_string(box=>box.textContent = "Position: " + this.pos[0].toFixed(2) + ", " + this.pos[1].toFixed(2) + ", " + this.pos[2].toFixed(2));
        this.new_line();
        // The facing directions are actually affected by the left hand rule:
        this.live_string(box=>box.textContent = "Facing: "
            + ((this.z_axis[0] > 0 ? "West " : "East ")
            + (this.z_axis[1] > 0 ? "Down " : "Up ")
            + (this.z_axis[2] > 0 ? "North" : "South")));
        this.new_line();
        this.key_triggered_button("Go to world origin", ["r"], ()=>this.target().set_identity(4, 4), "orange");
        this.new_line();
        this.key_triggered_button("Attach to global camera", ["Shift", "R"],
            () => globals.movement_controls_target = ()=>globals.graphics_state.camera_transform, "blue");
        this.new_line();
    }

    first_person_flyaround(radians_per_frame, meters_per_frame, leeway=70) {
        const sign = this.will_invert ? 1 : -1;
        const do_operation = this.target()[this.will_invert ? "pre_multiply" : "post_multiply"].bind(this.target());
        // Compare mouse's location to all four corners of a dead box.
        const offsets_from_dead_box = {
            plus: [this.mouse.from_center[0] + leeway, this.mouse.from_center[1] + leeway],
            minus: [this.mouse.from_center[0] - leeway, this.mouse.from_center[1] - leeway]
        };
        // Apply a camera rotation movement, but only when the mouse is past a minimum distance (leeway) from the canvas's center:
        if (!this.look_around_locked) {
            // start increasing until outside a leeway window from the center.
            // Steer according to "mouse_from_center" vector, but don't
            for (let i = 0; i < 2; i++) {
                let o = offsets_from_dead_box,
                    velocity = ((o.minus[i] > 0 && o.minus[i]) || (o.plus[i] < 0 && o.plus[i])) * radians_per_frame;
                    do_operation(Mat4.rotation(sign * velocity, Vec.of(i, 1 - i, 0)));
            }
        }

        if (this.roll != 0)
            do_operation(Mat4.rotation(sign * .1, Vec.of(0, 0, this.roll)));
        
        // Now apply translation movement of the camera, in the newest local coordinate frame.
        do_operation(Mat4.translation(this.thrust.times(sign * meters_per_frame)));
    }
    third_person_arcball(radians_per_frame) {
        const sign = this.will_invert ? 1 : -1;
        const do_operation = this.target()[this.will_invert ? "pre_multiply" : "post_multiply"].bind(this.target());

        // Spin the scene around a point on an axis determined by user mouse drag.
        const dragging_vector = this.mouse.from_center.minus(this.mouse.anchor);
        if (dragging_vector.norm() <= 0)
            return;

        // The presumed distance to the scene is a hard-coded 25 units.
        do_operation(Mat4.translation([0, 0, sign * 25]));
        do_operation(Mat4.rotation(radians_per_frame * dragging_vector.norm(), Vec.of(dragging_vector[1], dragging_vector[0], 0)));
        do_operation(Mat4.translation([0, 0, sign * -25]));
    }

    // Camera code starts here.
    display(graphics_state, dt=graphics_state.animation_delta_time / 1000) {
        const m = this.speed_multiplier * this.meters_per_frame,
            r = this.speed_multiplier * this.radians_per_frame;
        
        // Do first-person.  Scale the normal camera aiming speed by dt for smoothness.
        this.first_person_flyaround(dt * r, dt * m);

        // Also apply third-person "arcball" camera mode if a mouse drag is occurring.
        if (this.mouse.anchor)
            this.third_person_arcball(dt * r);

        const inv = Mat4.inverse(this.target());
        this.pos = inv.times(Vec.of(0, 0, 0, 1));
        this.z_axis = inv.times(Vec.of(0, 0, 1, 0));
    }
}
