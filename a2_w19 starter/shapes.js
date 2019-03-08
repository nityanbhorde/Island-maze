window.Square = window.classes.Square = class Square extends Shape {
    constructor() {
        super("positions", "normals", "texture_coords");
        this.positions.push(     ...Vec.cast([-1, -1, 0], [1, -1, 0], [-1, 1, 0], [1, 1, 0] ));
        this.normals.push(       ...Vec.cast([ 0,  0, 1], [0,  0, 1], [ 0, 0, 1], [0, 0, 1] ));
        this.texture_coords.push(...Vec.cast([ 0, 0],     [1, 0],     [ 0, 1],    [1, 1]   ));
        this.indices.push(0, 1, 2, 1, 3, 2);
    }
}

window.Circle = window.classes.Circle = class Circle extends Shape {
    constructor(sections) {
        super("positions", "normals", "texture_coords");

        this.positions.push(...Vec.cast([0, 0, 0], [1, 0, 0]));
        this.normals.push(...Vec.cast(  [0, 0, 1], [0, 0, 1]));
        this.texture_coords.push(...Vec.cast([0.5, 0.5], [1, 0.5]));

        for (let i = 0; i < sections; ++i) {
            const angle = 2 * Math.PI * (i + 1) / sections,
                v = Vec.of(Math.cos(angle), Math.sin(angle)),
                id = i + 2;

            this.positions.push(...Vec.cast([v[0], v[1], 0]));
            this.normals.push(...Vec.cast(  [0,    0,    1]));
            this.texture_coords.push(...Vec.cast([(v[0] + 1) / 2, (v[1] + 1) / 2]));
            this.indices.push(
                0, id - 1, id);
        }
    }
}

window.Castle = window.classes.Castle = class Castle extends Shape {
    constructor() {
        super("positions", "normals", "texture_coords");

        let vec_a = Vec.of(-4,4,-8);
        let vec_b = Vec.of(-4,-4,-8);
        let vec_c = Vec.of(4,4,-8);
        let vec_d = Vec.of(4,-4,-8);
        let vec_e = Vec.of(-4,-4,8);
        let vec_f = Vec.of(4,-4,8);
        let vec_g = Vec.of(-4,4,8);
        let vec_h = Vec.of(4,4,8);
        let vec_i = Vec.of(6,6,8);
        let vec_j = Vec.of(6,-6,8);
        let vec_k = Vec.of(-6,6,8);
        let vec_l = Vec.of(-6,-6,8);
        let vec_m = Vec.of(6,6,10);
        let vec_n = Vec.of(-6,6,10);
        let vec_o = Vec.of(6,-6,10);
        let vec_p = Vec.of(-6,-6,10);
        let vec_q = Vec.of(4,4,10);
        let vec_r = Vec.of(-4,4,10);
        let vec_s = Vec.of(4,-4,10);
        let vec_t = Vec.of(-4,-4,10);
        let vec_u = Vec.of(4,4,12);
        let vec_v = Vec.of(4,-4,12);
        let vec_w = Vec.of(-4,4,12);
        let vec_z = Vec.of(-4,-4,12);
        let vec_a1 = Vec.of(6,6,12);
        let vec_b1 = Vec.of(6,-6,12);
        let vec_c1 = Vec.of(-6,6,12);
        let vec_d1 = Vec.of(-6,-6,12);
        let vec_e1 = Vec.of(4,6,12);
        let vec_f1 = Vec.of(4,-6,12);
        let vec_g1 = Vec.of(-4,6,12);
        let vec_h1 = Vec.of(-4,-6,12);
        let vec_i1 = Vec.of(6,4,12);
        let vec_j1 = Vec.of(6,-4,12);
        let vec_k1 = Vec.of(-6,4,12);
        let vec_l1 = Vec.of(-6,-4,12);
        let vec_m1 = Vec.of(4,6,10);
        let vec_n1 = Vec.of(4,-6,10);
        let vec_o1 = Vec.of(-4,6,10);
        let vec_p1 = Vec.of(-4,-6,10);
        let vec_q1 = Vec.of(6,4,10);
        let vec_r1 = Vec.of(6,-4,10);
        let vec_s1 = Vec.of(-6,4,10);
        let vec_t1 = Vec.of(-6,-4,10);
        let vec_u1 = Vec.of(4,6,8);
        let vec_v1 = Vec.of(4,-6,8);
        let vec_w1 = Vec.of(-4,6,8);
        let vec_z1 = Vec.of(-4,-6,8);
        let vec_a2 = Vec.of(6,4,8);
        let vec_b2 = Vec.of(6,-4,8);
        let vec_c2 = Vec.of(-6,4,8);
        let vec_d2 = Vec.of(-6,-4,8);

        this.positions.push(...Vec.cast(
            vec_d, vec_c, vec_a, vec_b,
            vec_f, vec_h, vec_g, vec_e,
            vec_c, vec_h, vec_g, vec_a,
            vec_f, vec_e, vec_b, vec_d,
            vec_a, vec_b, vec_e, vec_g,
            vec_c, vec_h, vec_f, vec_d,
            vec_l, vec_e, vec_f, vec_j,
            vec_k, vec_g, vec_e, vec_l,
            vec_i, vec_h, vec_g, vec_k,
            vec_j, vec_f, vec_h, vec_i,
            vec_e, vec_t, vec_r, vec_g,
            vec_h, vec_q, vec_s, vec_f,
            vec_f, vec_s, vec_t, vec_e,
            vec_g, vec_r, vec_q, vec_h,
            vec_s1, vec_r, vec_t, vec_t1,
            vec_p1, vec_t, vec_s, vec_n1,
            vec_r1, vec_s, vec_q, vec_q1,
            vec_m1, vec_q, vec_r, vec_o1,
            vec_b1, vec_f1, vec_v, vec_j1,
            vec_z, vec_h1, vec_d1, vec_l1,
            vec_w, vec_k1, vec_c1, vec_g1,
            vec_i1, vec_u, vec_e1, vec_a1,
            vec_h1, vec_z, vec_t, vec_p1,
            vec_w, vec_g1, vec_o1, vec_r,
            vec_e1, vec_u, vec_q, vec_m1,
            vec_v, vec_f1, vec_n1, vec_s,
            vec_j1, vec_v, vec_s, vec_r1,
            vec_z, vec_l1, vec_t1, vec_t,
            vec_k1, vec_w, vec_r, vec_s1,
            vec_u, vec_i1, vec_q1, vec_q,
            // Complex side +x
            vec_b1, vec_j1, vec_b2, vec_j,
                vec_r1, vec_q1, vec_a2, vec_b2,
                vec_i1, vec_a1, vec_i, vec_a2,
            // Complex side -x
            vec_c1, vec_k1, vec_c2, vec_k,
                vec_s1, vec_t1, vec_d2, vec_c2,
                vec_l1, vec_d1, vec_l, vec_d2,
            // Complex side +y
            vec_a1, vec_e1, vec_u1, vec_i,
                vec_m1, vec_o1, vec_w1, vec_u1,
                vec_g1, vec_c1, vec_k, vec_w1,
            // Complex side -y
            vec_d1, vec_h1, vec_z1, vec_l,
                vec_p1, vec_n1, vec_v1, vec_z1,
                vec_f1, vec_b1, vec_j, vec_v1
        ));

        this.texture_coords.push(...Vec.cast(
            [0,    2/3], [0.25, 2/3], [0,    1/3], [0.25, 1/3],
            [0.5,  2/3], [0.5,  1/3], [0.75, 2/3], [0.75, 1/3],
            [0.75, 2/3], [0.75, 1/3], [1,    2/3], [1,    1/3],
            [0.25, 2/3], [0.25, 1/3], [0.5,  2/3], [0.5,  1/3],
            [0.25, 2/3], [0.5,  2/3], [0.25, 1  ], [0.5,  1  ],
            [0.25, 1/3], [0.5,  1/3], [0.25, 0  ], [0.5,  0  ],
            [0.75, 2/3], [0.75, 1/3], [1,    2/3], [1,    1/3],
            [0.25, 2/3], [0.25, 1/3], [0.5,  2/3], [0.5,  1/3],
            [0.25, 2/3], [0.5,  2/3], [0.25, 1  ], [0.5,  1  ],
            [0.25, 1/3], [0.5,  1/3], [0.25, 0  ], [0.5,  0  ],
            [0.75, 2/3], [0.75, 1/3], [1,    2/3], [1,    1/3],
            [0.25, 2/3], [0.25, 1/3], [0.5,  2/3], [0.5,  1/3],
            [0.25, 2/3], [0.5,  2/3], [0.25, 1  ], [0.5,  1  ],
            [0.25, 1/3], [0.5,  1/3], [0.25, 0  ], [0.5,  0  ],
            [0.75, 2/3], [0.75, 1/3], [1,    2/3], [1,    1/3],
            [0.25, 2/3], [0.25, 1/3], [0.5,  2/3], [0.5,  1/3],
            [0.25, 2/3], [0.5,  2/3], [0.25, 1  ], [0.5,  1  ],
            [0.25, 1/3], [0.5,  1/3], [0.25, 0  ], [0.5,  0  ],
            [0.75, 2/3], [0.75, 1/3], [1,    2/3], [1,    1/3],
            [0.25, 2/3], [0.25, 1/3], [0.5,  2/3], [0.5,  1/3],
            [0.25, 2/3], [0.5,  2/3], [0.25, 1  ], [0.5,  1  ],
            [0.25, 1/3], [0.5,  1/3], [0.25, 0  ], [0.5,  0  ],
            [0.75, 2/3], [0.75, 1/3], [1,    2/3], [1,    1/3],
            [0.25, 2/3], [0.25, 1/3], [0.5,  2/3], [0.5,  1/3],
            [0.25, 2/3], [0.5,  2/3], [0.25, 1  ], [0.5,  1  ],
            [0.25, 1/3], [0.5,  1/3], [0.25, 0  ], [0.5,  0  ],
            [0.75, 2/3], [0.75, 1/3], [1,    2/3], [1,    1/3],
            [0.25, 2/3], [0.25, 1/3], [0.5,  2/3], [0.5,  1/3],
            [0.25, 2/3], [0.5,  2/3], [0.25, 1  ], [0.5,  1  ],
            [0.25, 1/3], [0.5,  1/3], [0.25, 0  ], [0.5,  0  ],
            // Complex side +x
            [0.75, 2/3], [0.75, 1/3], [1,    2/3], [1,    1/3],
            [0.25, 2/3], [0.25, 1/3], [0.5,  2/3], [0.5,  1/3],
            [0.25, 2/3], [0.25, 1/3], [0.5,  2/3], [0.5,  1/3],
            // Complex side -x
            [0.75, 2/3], [0.75, 1/3], [1,    2/3], [1,    1/3],
            [0.25, 2/3], [0.25, 1/3], [0.5,  2/3], [0.5,  1/3],
            [0.25, 2/3], [0.25, 1/3], [0.5,  2/3], [0.5,  1/3],
            // Complex side +y
            [0.75, 2/3], [0.75, 1/3], [1,    2/3], [1,    1/3],
            [0.25, 2/3], [0.25, 1/3], [0.5,  2/3], [0.5,  1/3],
            [0.25, 2/3], [0.25, 1/3], [0.5,  2/3], [0.5,  1/3],
            // Complex side -y
            [0.75, 2/3], [0.75, 1/3], [1,    2/3], [1,    1/3],
            [0.25, 2/3], [0.25, 1/3], [0.5,  2/3], [0.5,  1/3],
            [0.25, 2/3], [0.25, 1/3], [0.5,  2/3], [0.5,  1/3]
        )); 

        this.normals.push(...Vec.cast(
            ...Array(4).fill([ 0,  0, -1]),
            ...Array(4).fill([ 0,  0,  1]),
            ...Array(4).fill([ 0,  1,  0]),
            ...Array(4).fill([ 0, -1,  0]),
            ...Array(4).fill([-1,  0,  0]),
            ...Array(4).fill([ 1,  0,  0]),
            ...Array(4).fill([ 0,  0, -1]),
            ...Array(4).fill([ 0,  0, -1]),
            ...Array(4).fill([ 0,  0, -1]),
            ...Array(4).fill([ 0,  0, -1]),
            ...Array(4).fill([ 1,  0,  0]),
            ...Array(4).fill([-1,  0,  0]),
            ...Array(4).fill([ 0,  1,  0]),
            ...Array(4).fill([ 0, -1,  0]),
            ...Array(4).fill([ 0,  0,  1]),
            ...Array(4).fill([ 0,  0,  1]),
            ...Array(4).fill([ 0,  0,  1]),
            ...Array(4).fill([ 0,  0,  1]),
            ...Array(4).fill([ 0,  0,  1]),
            ...Array(4).fill([ 0,  0,  1]),
            ...Array(4).fill([ 0,  0,  1]),
            ...Array(4).fill([ 0,  0,  1]),
            ...Array(4).fill([ 1,  0,  0]),
            ...Array(4).fill([ 1,  0,  0]),
            ...Array(4).fill([-1,  0,  0]),
            ...Array(4).fill([-1,  0,  0]),
            ...Array(4).fill([ 0,  1,  0]),
            ...Array(4).fill([ 0,  1,  0]),
            ...Array(4).fill([ 0, -1,  0]),
            ...Array(4).fill([ 0, -1,  0]),
            // Complex side +x
            ...Array(4).fill([ 1,  0,  0]),
                ...Array(4).fill([ 1,  0,  0]),
                ...Array(4).fill([ 1,  0,  0]),
            // Complex side -x
            ...Array(4).fill([-1,  0,  0]),
                ...Array(4).fill([-1,  0,  0]),
                ...Array(4).fill([-1,  0,  0]),
            // Complex side +y
             ...Array(4).fill([ 0,  1,  0]),
                ...Array(4).fill([ 0,  1,  0]),
                ...Array(4).fill([ 0,  1,  0]),
            // Complex side -y
             ...Array(4).fill([ 0, -1,  0]),
                ...Array(4).fill([ 0, -1,  0]),
                ...Array(4).fill([ 0, -1,  0])
        ));

        this.indices.push(
            0, 1, 2, 0, 2, 3,
            4, 5, 6, 4, 6, 7,
            8, 9, 10, 8, 10, 11,    
            12, 13, 14, 12, 14, 15,
            16, 17, 18, 16, 18, 19,
            20, 21, 22, 20, 22, 23,
            24, 25, 26, 24, 26, 27,
            28, 29, 30, 28, 30, 31,
            32, 33, 34, 32, 34, 35,
            36, 37, 38, 36, 38, 39,
            40, 41, 42, 40, 42, 43,
            44, 45, 46, 44, 46, 47,
            48, 49, 50, 48, 50, 51,
            52, 53, 54, 52, 54, 55,
            56, 57, 58, 56, 58, 59,
            60, 61, 62, 60, 62, 63,
            64, 65, 66, 64, 66, 67,
            68, 69, 70, 68, 70, 71,
            72, 73, 74, 72, 74, 75,
            76, 77, 78, 76, 78, 79,
            80, 81, 82, 80, 82, 83,
            84, 85, 86, 84, 86, 87,
            88, 89, 90, 88, 90, 91,
            92, 93, 94, 92, 94, 95,
            96, 97, 98, 96, 98, 99,
            100, 101, 102, 100, 102, 103,
            104, 105, 106, 104, 106, 107,
            108, 109, 110, 108, 110, 111,
            112, 113, 114, 112, 114, 115,
            116, 117, 118, 116, 118, 119,
            // Complex side +x
            120, 121, 122, 120, 122, 123,
                 124, 125, 126, 124, 126, 127,
                 128, 129, 130, 128, 130, 131,
            // Complex side -x
            132, 133, 134, 132, 134, 135,
                 136, 137, 138, 136, 138, 139,
                 140, 141, 142, 140, 142, 143,
            // Complex side +y
            144, 145, 146, 144, 146, 147,
                 148, 149, 150, 148, 150, 151,
                 152, 153, 154, 152, 154, 155,
            // Complex side -y
            156, 157, 158, 156, 158, 159,
                 160, 161, 162, 160, 162, 163,
                 164, 165, 166, 164, 166, 167
        );
    }
}

window.Cube = window.classes.Cube = class Cube extends Shape {
    constructor() {
        super("positions", "normals", "texture_coords");

        this.positions.push(...Vec.cast(
            [-1,  1, -1], [-1, -1, -1], [ 1,  1, -1], [ 1, -1, -1],
            [-1, -1,  1], [ 1, -1,  1], [-1,  1,  1], [ 1,  1,  1],
            [-1,  1,  1], [ 1,  1,  1], [-1,  1, -1], [ 1,  1, -1],
            [-1, -1, -1], [ 1, -1, -1], [-1, -1,  1], [ 1, -1,  1],
            [-1, -1, -1], [-1, -1,  1], [-1,  1, -1], [-1,  1,  1],
            [ 1, -1, -1], [ 1, -1,  1], [ 1,  1, -1], [ 1,  1,  1] 
        ));

        this.texture_coords.push(...Vec.cast(
            [0,    2/3], [0.25, 2/3], [0,    1/3], [0.25, 1/3],
            [0.5,  2/3], [0.5,  1/3], [0.75, 2/3], [0.75, 1/3],
            [0.75, 2/3], [0.75, 1/3], [1,    2/3], [1,    1/3],
            [0.25, 2/3], [0.25, 1/3], [0.5,  2/3], [0.5,  1/3],
            [0.25, 2/3], [0.5,  2/3], [0.25, 1  ], [0.5,  1  ],
            [0.25, 1/3], [0.5,  1/3], [0.25, 0  ], [0.5,  0  ]
        )); 

        this.normals.push(...Vec.cast(
            ...Array(4).fill([ 0,  0, -1]),
            ...Array(4).fill([ 0,  0,  1]),
            ...Array(4).fill([ 0,  1,  0]),
            ...Array(4).fill([ 0, -1,  0]),
            ...Array(4).fill([-1,  0,  0]),
            ...Array(4).fill([ 1,  0,  0])
        ));

        this.indices.push(
            0, 2, 1, 1, 2, 3,
            4, 5, 6, 5, 7, 6,
            8, 9, 10, 9, 11, 10,    
            12, 13, 14, 13, 15, 14,
            16, 19, 18, 16, 17, 19,
            20, 22, 21, 21, 22, 23
        );
    }
}


window.SimpleCube = window.classes.SimpleCube = class SimpleCube extends Shape {
    constructor() {
      super( "positions", "normals", "texture_coords" );
      for( var i = 0; i < 3; i++ )                    
        for( var j = 0; j < 2; j++ ) {
          var square_transform = Mat4.rotation( i == 0 ? Math.PI/2 : 0, Vec.of(1, 0, 0) )
                         .times( Mat4.rotation( Math.PI * j - ( i == 1 ? Math.PI/2 : 0 ), Vec.of( 0, 1, 0 ) ) )
                         .times( Mat4.translation([ 0, 0, 1 ]) );
          Square.insert_transformed_copy_into( this, [], square_transform );
      }
    }
}

window.Tetrahedron = window.classes.Tetrahedron = class Tetrahedron extends Shape {
    constructor(using_flat_shading) {
        super("positions", "normals", "texture_coords");
        const s3 = Math.sqrt(3) / 4,
            v1 = Vec.of(Math.sqrt(8/9), -1/3, 0),
            v2 = Vec.of(-Math.sqrt(2/9), -1/3, Math.sqrt(2/3)),
            v3 = Vec.of(-Math.sqrt(2/9), -1/3, -Math.sqrt(2/3)),
            v4 = Vec.of(0, 1, 0);

        this.positions.push(...Vec.cast(
            v1, v2, v3,
            v1, v3, v4,
            v1, v2, v4,
            v2, v3, v4));

        this.normals.push(...Vec.cast(
            ...Array(3).fill(v1.plus(v2).plus(v3).normalized()),
            ...Array(3).fill(v1.plus(v3).plus(v4).normalized()),
            ...Array(3).fill(v1.plus(v2).plus(v4).normalized()),
            ...Array(3).fill(v2.plus(v3).plus(v4).normalized())));

        this.texture_coords.push(...Vec.cast(
            [0.25, s3], [0.75, s3], [0.5, 0], 
            [0.25, s3], [0.5,  0 ], [0,   0],
            [0.25, s3], [0.75, s3], [0.5, 2 * s3], 
            [0.75, s3], [0.5,  0 ], [1,   0]));

        this.indices.push(0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11);
    }
}

window.Cylinder = window.classes.Cylinder = class Cylinder extends Shape {
    constructor(sections) {
        super("positions", "normals", "texture_coords");

        this.positions.push(...Vec.cast([1, 0, 1], [1, 0, -1]));
        this.normals.push(...Vec.cast(  [1, 0, 0], [1, 0,  0]));
        this.texture_coords.push(...Vec.cast([0, 1], [0, 0]));

        for (let i = 0; i < sections; ++i) {
            const ratio = (i + 1) / sections,
                angle = 2 * Math.PI * ratio,
                v = Vec.of(Math.cos(angle), Math.sin(angle)),
                id = 2 * i + 2;

            this.positions.push(...Vec.cast([v[0], v[1], 1], [v[0], v[1], -1]));
            this.normals.push(...Vec.cast(  [v[0], v[1], 0], [v[0], v[1],  0]));
            this.texture_coords.push(...Vec.cast([ratio, 1], [ratio, 0]));
            this.indices.push(
                id, id - 1, id + 1,
                id, id - 1, id - 2);
        }
    }
}

window.Cone = window.classes.Cone = class Cone extends Shape {
    constructor(sections) {
        super("positions", "normals", "texture_coords");

        this.positions.push(...Vec.cast([1, 0, 0]));
        this.normals.push(...Vec.cast(  [0, 0, 1]));
        this.texture_coords.push(...Vec.cast([1, 0.5]));

        let t = Vec.of(0, 0, 1);
        for (let i = 0; i < sections; ++i) {
            const angle = 2 * Math.PI * (i + 1) / sections,
                v = Vec.of(Math.cos(angle), Math.sin(angle), 0),
                id = 2 * i + 1;

            this.positions.push(...Vec.cast(t, v));
            this.normals.push(...Vec.cast(
                v.mix(this.positions[id - 1], 0.5).plus(t).normalized(),
                v.plus(t).normalized()));
            this.texture_coords.push(...Vec.cast([0.5, 0.5], [(v[0] + 1) / 2, (v[1] + 1) / 2]));
            this.indices.push(
                id - 1, id, id + 1);
        }
    }
}

// This Shape defines a Sphere surface, with nice (mostly) uniform triangles.  A subdivision surface
// (see) Wikipedia article on those) is initially simple, then builds itself into a more and more 
// detailed shape of the same layout.  Each act of subdivision makes it a better approximation of 
// some desired mathematical surface by projecting each new point onto that surface's known 
// implicit equation.  For a sphere, we begin with a closed 3-simplex (a tetrahedron).  For each
// face, connect the midpoints of each edge together to make more faces.  Repeat recursively until 
// the desired level of detail is obtained.  Project all new vertices to unit vectors (onto the
// unit sphere) and group them into triangles by following the predictable pattern of the recursion.
window.Subdivision_Sphere = window.classes.Subdivision_Sphere = class Subdivision_Sphere extends Shape {
    constructor(max_subdivisions) {
        super("positions", "normals", "texture_coords");

        // Start from the following equilateral tetrahedron:
        this.positions.push(...Vec.cast([0, 0, -1], [0, .9428, .3333], [-.8165, -.4714, .3333], [.8165, -.4714, .3333]));

        // Begin recursion.
        this.subdivideTriangle(0, 1, 2, max_subdivisions);
        this.subdivideTriangle(3, 2, 1, max_subdivisions);
        this.subdivideTriangle(1, 0, 3, max_subdivisions);
        this.subdivideTriangle(0, 2, 3, max_subdivisions);

        for (let p of this.positions) {
            this.normals.push(p.copy());
            this.texture_coords.push(Vec.of(
                0.5 + Math.atan2(p[2], p[0]) / (2 * Math.PI),
                0.5 - Math.asin(p[1]) / Math.PI));
        }

        // Fix the UV seam by duplicating vertices with offset UV
        let tex = this.texture_coords;
        for (let i = 0; i < this.indices.length; i += 3) {
            const a = this.indices[i], b = this.indices[i + 1], c = this.indices[i + 2];
            if ([[a, b], [a, c], [b, c]].some(x => (Math.abs(tex[x[0]][0] - tex[x[1]][0]) > 0.5))
                && [a, b, c].some(x => tex[x][0] < 0.5))
            {
                for (let q of [[a, i], [b, i + 1], [c, i + 2]]) {
                    if (tex[q[0]][0] < 0.5) {
                        this.indices[q[1]] = this.positions.length;
                        this.positions.push(this.positions[q[0]].copy());
                        this.normals.push(this.normals[q[0]].copy());
                        tex.push(tex[q[0]].plus(Vec.of(1, 0)));
                    }
                }
            }
        }
    }

    subdivideTriangle(a, b, c, count) {
        if (count <= 0) {
            this.indices.push(a, b, c);
            return;
        }

        let ab_vert = this.positions[a].mix(this.positions[b], 0.5).normalized(),
            ac_vert = this.positions[a].mix(this.positions[c], 0.5).normalized(),
            bc_vert = this.positions[b].mix(this.positions[c], 0.5).normalized();

        let ab = this.positions.push(ab_vert) - 1,
            ac = this.positions.push(ac_vert) - 1,
            bc = this.positions.push(bc_vert) - 1;

        this.subdivideTriangle( a, ab, ac, count - 1);
        this.subdivideTriangle(ab,  b, bc, count - 1);
        this.subdivideTriangle(ac, bc,  c, count - 1);
        this.subdivideTriangle(ab, bc, ac, count - 1);
    }
}