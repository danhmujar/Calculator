/**
 * BufferManager handles VAO and VBO lifecycle for dynamic WebGL rendering.
 * Implements WebGL 2.0 best practices for high-performance UI rendering.
 */
export class BufferManager {
    /**
     * Creates and initializes a Vertex Array Object (VAO) with position and texCoord attributes.
     * Interleaved format: [x, y, u, v, ...]
     * 
     * @param {WebGL2RenderingContext} gl 
     * @param {number[]} data - Initial vertex data
     * @param {number} usage - gl.STATIC_DRAW or gl.DYNAMIC_DRAW
     * @returns {Object} - Metadata containing vao, vbo, and vertex count
     */
    static createVAO(gl, data, usage = gl.STATIC_DRAW) {
        const vao = gl.createVertexArray();
        const vbo = gl.createBuffer();
        
        gl.bindVertexArray(vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        
        const floatData = new Float32Array(data);
        gl.bufferData(gl.ARRAY_BUFFER, floatData, usage);

        // Attribute 0: a_position (vec2) - [x, y]
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(
            0,          // index
            2,          // size (x, y)
            gl.FLOAT,    // type
            false,      // normalized
            4 * 4,      // stride (4 floats * 4 bytes)
            0           // offset
        );

        // Attribute 1: a_texCoord (vec2) - [u, v]
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(
            1,          // index
            2,          // size (u, v)
            gl.FLOAT,    // type
            false,      // normalized
            4 * 4,      // stride (4 floats * 4 bytes)
            2 * 4       // offset (2 floats * 4 bytes)
        );

        // Unbind to prevent accidental modification
        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        return {
            vao,
            vbo,
            count: data.length / 4,
            usage
        };
    }

    /**
     * Updates an existing VBO using Buffer Orphaning to avoid GPU pipeline stalls.
     * This is critical for dynamic UI elements that change size/position frequently.
     * 
     * @param {WebGL2RenderingContext} gl 
     * @param {WebGLBuffer} vbo 
     * @param {number[]} data - New vertex data
     * @param {number} usage - gl.DYNAMIC_DRAW
     */
    static updateBuffer(gl, vbo, data, usage = gl.DYNAMIC_DRAW) {
        const floatData = new Float32Array(data);
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        
        /**
         * Buffer Orphaning:
         * By calling bufferData with the same size/usage but no data, we tell the driver
         * it can discard the old buffer and give us a new block of memory if the old one
         * is still in use by a pending draw call.
         */
        gl.bufferData(gl.ARRAY_BUFFER, floatData.byteLength, usage); 
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, floatData);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }

    /**
     * Creates a specialized VAO for instanced batch rendering.
     * Combines static unit quad geometry with a dynamic buffer for instance attributes.
     * 
     * @param {WebGL2RenderingContext} gl 
     * @param {number[]} quadData - Interleaved unit quad data [x, y, u, v]
     * @param {number} maxInstances - Initial capacity for the instance buffer
     * @returns {Object} Metadata containing vao, quadVbo, and instanceVbo
     */
    static createInstancedVAO(gl, quadData, maxInstances = 2048) {
        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);

        // 1. Static Unit Quad (Geometry)
        const quadVbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, quadVbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(quadData), gl.STATIC_DRAW);

        // a_position (loc 0) - Unit space [0,1]
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 4 * 4, 0);
        
        // a_texCoord (loc 1) - Unit space [0,1]
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 4 * 4, 2 * 4);

        // 2. Dynamic Instance Data (Per-Instance Attributes)
        const instanceVbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, instanceVbo);
        
        /**
         * Instance Interleaved Format (14 floats total):
         * [pos.x, pos.y, size.w, size.h, uv.u, uv.v, uv.tw, uv.th, col.r, col.g, col.b, col.a, type, radius]
         */
        const stride = 14 * 4; 
        gl.bufferData(gl.ARRAY_BUFFER, maxInstances * stride, gl.DYNAMIC_DRAW);

        // Helper to setup instanced attributes
        const setupInstancedAttr = (index, size, offset) => {
            gl.enableVertexAttribArray(index);
            gl.vertexAttribPointer(index, size, gl.FLOAT, false, stride, offset * 4);
            gl.vertexAttribDivisor(index, 1); // Crucial: advance once per instance
        };

        setupInstancedAttr(2, 2, 0);  // a_instPos
        setupInstancedAttr(3, 2, 2);  // a_instSize
        setupInstancedAttr(4, 4, 4);  // a_instUV
        setupInstancedAttr(5, 4, 8);  // a_instColor
        setupInstancedAttr(6, 1, 12); // a_instType
        setupInstancedAttr(7, 1, 13); // a_instRadius

        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        return {
            vao,
            quadVbo,
            instanceVbo,
            stride,
            maxInstances
        };
    }

    /**
     * Updates the instance buffer using Buffer Orphaning to avoid GPU stalls.
     * 
     * @param {WebGL2RenderingContext} gl 
     * @param {WebGLBuffer} instanceVbo 
     * @param {Float32Array} data - The raw instance data to upload
     */
    static updateInstanceBuffer(gl, instanceVbo, data) {
        gl.bindBuffer(gl.ARRAY_BUFFER, instanceVbo);
        
        /**
         * Buffer Orphaning:
         * We pass the full size of the buffer with null data to tell the driver
         * to give us a fresh memory block if the current one is still being
         * used by the GPU. This prevents CPU-GPU sync stalls.
         */
        gl.bufferData(gl.ARRAY_BUFFER, data.byteLength, gl.DYNAMIC_DRAW);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, data);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }

    /**
     * Creates a Uniform Buffer Object (UBO).
     * 
     * @param {WebGL2RenderingContext} gl 
     * @param {number} size - Size in bytes
     * @param {number} bindingPoint - The uniform block binding point
     * @returns {WebGLBuffer}
     */
    static createUBO(gl, size, bindingPoint) {
        const ubo = gl.createBuffer();
        gl.bindBuffer(gl.UNIFORM_BUFFER, ubo);
        gl.bufferData(gl.UNIFORM_BUFFER, size, gl.DYNAMIC_DRAW);
        gl.bindBufferBase(gl.UNIFORM_BUFFER, bindingPoint, ubo);
        gl.bindBuffer(gl.UNIFORM_BUFFER, null);
        return ubo;
    }

    /**
     * Updates a UBO with new data.
     * 
     * @param {WebGL2RenderingContext} gl 
     * @param {WebGLBuffer} ubo 
     * @param {Float32Array} data 
     */
    static updateUBO(gl, ubo, data) {
        gl.bindBuffer(gl.UNIFORM_BUFFER, ubo);
        gl.bufferSubData(gl.UNIFORM_BUFFER, 0, data);
        gl.bindBuffer(gl.UNIFORM_BUFFER, null);
    }
    
    /**
     * Releases WebGL resources associated with a buffer object.
     * 
     * @param {WebGL2RenderingContext} gl 
     * @param {Object} bufferObj - Object returned by createVAO
     */
    static delete(gl, bufferObj) {
        if (!bufferObj) return;
        if (bufferObj.vao) gl.deleteVertexArray(bufferObj.vao);
        if (bufferObj.vbo) gl.deleteBuffer(bufferObj.vbo);
    }
}
