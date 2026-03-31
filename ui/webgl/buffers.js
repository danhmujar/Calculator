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
