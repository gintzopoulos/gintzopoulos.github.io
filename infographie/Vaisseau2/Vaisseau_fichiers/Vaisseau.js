// This program was developped by Daniel Audet and uses the file "basic-objects-IFS.js"
// from http://math.hws.edu/eck/cs424/notes2013/19_GLSL.html
//
//  It has been adapted to be compatible with the "MV.js" library developped
//  for the book "Interactive Computer Graphics" by Edward Angel and Dave Shreiner.
//

"use strict";

var gl;   // The webgl context.

var CoordsLoc;       // Location of the coords attribute variable in the standard texture mappping shader program.
var NormalLoc;
var TexCoordLoc;

var ProjectionLoc;     // Location of the uniform variables in the standard texture mappping shader program.
var ModelviewLoc;
var NormalMatrixLoc;
var alphaLoc;

var vcoordsboxLoc;     // Location of the coords attribute variable in the shader program used for texturing the environment box.
var vnormalboxLoc;
var vtexcoordboxLoc;

var modelviewboxLoc;
var projectionboxLoc;
var skyboxLoc;

var projection;   //--- projection matrix
var modelview;    // modelview matrix
var flattenedmodelview;    //--- flattened modelview matrix

var normalMatrix = mat3();  //--- create a 3X3 matrix that will affect normals

var rotator;   // A SimpleRotator object to enable rotation by mouse dragging.

 var sphere, cylinder, box, teapot, disk, torus, cone;
var box;  // model identifiers
//var hemisphereinside, hemisphereoutside, thindisk;
//var quartersphereinside, quartersphereoutside;

var prog;  // shader program identifier

var lightPosition = vec4(20.0, 20.0, 100.0, 1.0);

var lightAmbient = vec4(1.0, 1.0, 1.0, 1.0);
var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

var materialAmbient = vec4(0.0, 0.1, 0.3, 1.0);
var materialDiffuse = vec4(0.48, 0.55, 0.69, 1.0);
var materialSpecular = vec4(0.48, 0.55, 0.69, 1.0);
var materialShininess = 100.0;

var matriceDeplacement = mat4();

var ambientProduct, diffuseProduct, specularProduct;

//Listes objets
var aile;
var aileron,aileron2;
var tronc;
var avant;
var arriere;
var planetes;
var transparentList;
var reflechissantList;

//Textures ajoutés
var textureMetal1,textureMetal2,textureVert,textureRouge,textureBleu,textureOr,textureFenètre,textureNom,textureTerre,textureLune,textureJupiter,textureMercure;

var ntextures_tobeloaded;
var ntextures_loaded;

//Formes personnalisé
var trapeze,trapezeAngle,piedPorteInv,tétraèdre,cockpitObjet;
var cubeReflechissant;

var texIDmap0;  // environmental texture identifier
var texID1, texID2, texID3, texID4;  // standard texture identifiers
var  envbox;  // model identifiers
var  progbox;  // shader program identifier

var progmap 
var a_coordsmapLoc,a_normalmapLoc, u_modelviewmapLoc, u_projectionmapLoc, u_normalmatrixmapLoc, u_minvmapLoc, u_skyboxLoc;
var minv = mat3(); 

var ct = 0;
var img = new Array(6);
var projection;


function render() {
    gl.clearColor(0.79, 0.76, 0.27, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
modelview = translate(0,0,-50);
	gl.useProgram(progbox);
	projection = perspective(60.0, 1.0, 1.0, 2000.0);
	  if (texIDmap0.isloaded ) {  // if texture images have been loaded
		
       // flattenedmodelview = rotator.getViewMatrix();
		// modelview = unflatten(flattenedmodelview);

        // Draw the environment (box)
        // Select the shader program that is used for the environment box.

        gl.uniformMatrix4fv(projectionboxLoc, false, flatten(projection));

        gl.enableVertexAttribArray(vcoordsboxLoc);
        gl.disableVertexAttribArray(vnormalboxLoc);     // normals are not used for the box
        gl.disableVertexAttribArray(vtexcoordboxLoc);  // texture coordinates not used for the box

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, texIDmap0);
        // Send texture to sampler
        gl.uniform1i(skyboxLoc, 0);
		
        envbox.render();
	}
	
	 // flattenedmodelview = rotator.getViewMatrix();
    // modelview = unflatten(flattenedmodelview);
	modelview = translate(0,0,-50);
	 gl.enableVertexAttribArray(vnormalboxLoc);
	normalMatrix = extractNormalMatrix(modelview);
		
	gl.useProgram(progmap);
	gl.uniformMatrix4fv(u_projectionmapLoc, false, flatten(projection));
	reflechissantList.render();
	
    //--- Get the rotation matrix obtained from the displacement of the mouse
    //---  (note: the matrix obtained is already "flattened" by the function getViewMatrix)
    // flattenedmodelview = rotator.getViewMatrix();
    // modelview = unflatten(flattenedmodelview);
	modelview = translate(0,0,-50);
	 gl.enableVertexAttribArray(vnormalboxLoc);
	normalMatrix = extractNormalMatrix(modelview);
		

	 gl.useProgram(prog);
    var initialmodelview = modelview;
	tronc.render();
	modelview = initialmodelview;
	avant.render();
	modelview = initialmodelview;
	aileron.render();
	modelview = initialmodelview;
	aile.render();
	modelview = initialmodelview;
	arriere.render();
	modelview = initialmodelview;
	aileron2.render();
	modelview = initialmodelview;
	planetes.render();
	modelview = initialmodelview;
	transparentList.render();
	
	

	
	
	
}
function unflatten(matrix) {
    var result = mat4();
    result[0][0] = matrix[0]; result[1][0] = matrix[1]; result[2][0] = matrix[2]; result[3][0] = matrix[3];
    result[0][1] = matrix[4]; result[1][1] = matrix[5]; result[2][1] = matrix[6]; result[3][1] = matrix[7];
    result[0][2] = matrix[8]; result[1][2] = matrix[9]; result[2][2] = matrix[10]; result[3][2] = matrix[11];
    result[0][3] = matrix[12]; result[1][3] = matrix[13]; result[2][3] = matrix[14]; result[3][3] = matrix[15];

    return result;
}

function extractNormalMatrix(matrix) { // This function computes the transpose of the inverse of 
    // the upperleft part (3X3) of the modelview matrix (see http://www.lighthouse3d.com/tutorials/glsl-tutorial/the-normal-matrix/ )

    var result = mat3();
    var upperleft = mat3();
    var tmp = mat3();

    upperleft[0][0] = matrix[0][0];  // if no scaling is performed, one can simply use the upper left
    upperleft[1][0] = matrix[1][0];  // part (3X3) of the modelview matrix
    upperleft[2][0] = matrix[2][0];

    upperleft[0][1] = matrix[0][1];
    upperleft[1][1] = matrix[1][1];
    upperleft[2][1] = matrix[2][1];

    upperleft[0][2] = matrix[0][2];
    upperleft[1][2] = matrix[1][2];
    upperleft[2][2] = matrix[2][2];

    tmp = matrixinvert(upperleft);
    result = transpose(tmp);

    return result;
}

function matrixinvert(matrix) {

    var result = mat3();

    var det = matrix[0][0] * (matrix[1][1] * matrix[2][2] - matrix[2][1] * matrix[1][2]) -
                 matrix[0][1] * (matrix[1][0] * matrix[2][2] - matrix[1][2] * matrix[2][0]) +
                 matrix[0][2] * (matrix[1][0] * matrix[2][1] - matrix[1][1] * matrix[2][0]);

    var invdet = 1 / det;

    // inverse of matrix m
    result[0][0] = (matrix[1][1] * matrix[2][2] - matrix[2][1] * matrix[1][2]) * invdet;
    result[0][1] = (matrix[0][2] * matrix[2][1] - matrix[0][1] * matrix[2][2]) * invdet;
    result[0][2] = (matrix[0][1] * matrix[1][2] - matrix[0][2] * matrix[1][1]) * invdet;
    result[1][0] = (matrix[1][2] * matrix[2][0] - matrix[1][0] * matrix[2][2]) * invdet;
    result[1][1] = (matrix[0][0] * matrix[2][2] - matrix[0][2] * matrix[2][0]) * invdet;
    result[1][2] = (matrix[1][0] * matrix[0][2] - matrix[0][0] * matrix[1][2]) * invdet;
    result[2][0] = (matrix[1][0] * matrix[2][1] - matrix[2][0] * matrix[1][1]) * invdet;
    result[2][1] = (matrix[2][0] * matrix[0][1] - matrix[0][0] * matrix[2][1]) * invdet;
    result[2][2] = (matrix[0][0] * matrix[1][1] - matrix[1][0] * matrix[0][1]) * invdet;

    return result;
}

// The following function is used to create an "object" (called "model") containing all the informations needed
// to draw a particular element (sphere, cylinder, cube,...). 
// Note that the function "model.render" is defined inside "createModel" but it is NOT executed.
// That function is only executed when we call it explicitly in render().

function createModel(modelData) {

	// the next line defines an "object" in Javascript
	// (note that there are several ways to define an "object" in Javascript)
	var model = {};
	
	// the following lines defines "members" of the "object"
    model.coordsBuffer = gl.createBuffer();
    model.normalBuffer = gl.createBuffer();
    model.textureBuffer = gl.createBuffer();
    model.indexBuffer = gl.createBuffer();
    model.count = modelData.indices.length;

	// the "members" are then used to load data from "modelData" in the graphic card
    gl.bindBuffer(gl.ARRAY_BUFFER, model.coordsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, modelData.vertexPositions, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, model.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, modelData.vertexNormals, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, model.textureBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, modelData.vertexTextureCoords, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, modelData.indices, gl.STATIC_DRAW);

	// The following function is NOT executed here. It is only DEFINED to be used later when we
	// call the ".render()" method.
    model.render = function () {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.coordsBuffer);
        gl.vertexAttribPointer(CoordsLoc, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.vertexAttribPointer(NormalLoc, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.textureBuffer);
        gl.vertexAttribPointer(TexCoordLoc, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

        gl.uniformMatrix4fv(ModelviewLoc, false, flatten(modelview));    //--- load flattened modelview matrix
        gl.uniformMatrix3fv(NormalMatrixLoc, false, flatten(normalMatrix));  //--- load flattened normal matrix

        gl.drawElements(gl.TRIANGLES, this.count, gl.UNSIGNED_SHORT, 0);
        
    }
	
	// we now return the "object".
    return model;
}

function createModelbox(modelData) {  // For creating the environment box.
    var model = {};
    model.coordsBuffer = gl.createBuffer();
    model.indexBuffer = gl.createBuffer();
    model.count = modelData.indices.length;
    gl.bindBuffer(gl.ARRAY_BUFFER, model.coordsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, modelData.vertexPositions, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, modelData.indices, gl.STATIC_DRAW);
    model.render = function () {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.coordsBuffer);
        gl.vertexAttribPointer(vcoordsboxLoc, 3, gl.FLOAT, false, 0, 0);
        gl.uniformMatrix4fv(modelviewboxLoc, false, flatten(modelview));
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.drawElements(gl.TRIANGLES, this.count, gl.UNSIGNED_SHORT, 0);
    }
    return model;
}

function createModelmap(modelData) {  // For creating the reflexion box.
    var model = {};
    model.coordsBuffer = gl.createBuffer();
    model.normalBuffer = gl.createBuffer();
    model.indexBuffer = gl.createBuffer();
    model.count = modelData.indices.length;

	gl.bindBuffer(gl.ARRAY_BUFFER, model.coordsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, modelData.vertexPositions, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, model.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, modelData.vertexNormals, gl.STATIC_DRAW);
    //  Note here that no texture coordinates are provided for environmental mapping

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, modelData.indices, gl.STATIC_DRAW);

	
    model.render = function () {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.coordsBuffer);
        gl.vertexAttribPointer(a_coordsmapLoc, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.vertexAttribPointer(a_normalmapLoc, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

        gl.uniformMatrix4fv(u_modelviewmapLoc, false, flatten(modelview));   //--- load flattened modelview matrix
        gl.uniformMatrix3fv( u_normalmatrixmapLoc, false, flatten(normalMatrix));  //--- load flattened normal matrix

        gl.uniform1i(u_skyboxLoc, 0);

        gl.drawElements(gl.TRIANGLES, this.count, gl.UNSIGNED_SHORT, 0);
    }
	return model;
}

function createProgram(gl, vertexShaderSource, fragmentShaderSource) {
    var vsh = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vsh, vertexShaderSource);
    gl.compileShader(vsh);
    if (!gl.getShaderParameter(vsh, gl.COMPILE_STATUS)) {
        throw "Error in vertex shader:  " + gl.getShaderInfoLog(vsh);
    }
    var fsh = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fsh, fragmentShaderSource);
    gl.compileShader(fsh);
    if (!gl.getShaderParameter(fsh, gl.COMPILE_STATUS)) {
        throw "Error in fragment shader:  " + gl.getShaderInfoLog(fsh);
    }
    var prog = gl.createProgram();
    gl.attachShader(prog, vsh);
    gl.attachShader(prog, fsh);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        throw "Link error in program:  " + gl.getProgramInfoLog(prog);
    }
    return prog;
}

function getTextContent(elementID) {
    var element = document.getElementById(elementID);
    var fsource = "";
    var node = element.firstChild;
    var str = "";
    while (node) {
        if (node.nodeType == 3) // this is a text node
            str += node.textContent;
        node = node.nextSibling;
    }
    return str;
}


window.onload = function init() {
    // try {
       	var canvas = document.getElementById("glcanvas");
		gl = canvas.getContext("webgl");
		// if (!gl) {
			// gl = canvas.getContext("experimental-webgl");
		// }
		if (!gl) {
			throw "Could not create WebGL context.";
		}
		
		
	var vertexShaderSourcemap= getTextContent("vshadermap");
	var fragmentShaderSourcemap = getTextContent("fshadermap");
	
	progmap = createProgram(gl, vertexShaderSourcemap, fragmentShaderSourcemap);

	gl.useProgram(progmap);

	
	a_coordsmapLoc = gl.getAttribLocation(progmap, "vcoords");
	a_normalmapLoc = gl.getAttribLocation(progmap, "vnormal");

	u_modelviewmapLoc = gl.getUniformLocation(progmap, "modelview");
	u_projectionmapLoc = gl.getUniformLocation(progmap, "projection");
	u_normalmatrixmapLoc = gl.getUniformLocation(progmap, "normalMatrix");
	u_minvmapLoc = gl.getUniformLocation(progmap, "minv");
	u_skyboxLoc = gl.getUniformLocation(progmap, "skybox");

	
		
		var vertexShaderSourcebox = getTextContent("vshaderbox");
        var fragmentShaderSourcebox = getTextContent("fshaderbox");
        progbox = createProgram(gl, vertexShaderSourcebox, fragmentShaderSourcebox);

        gl.useProgram(progbox);

        vcoordsboxLoc = gl.getAttribLocation(progbox, "vcoords");
        vnormalboxLoc = gl.getAttribLocation(progbox, "vnormal");
        vtexcoordboxLoc = gl.getAttribLocation(progbox, "vtexcoord");

        modelviewboxLoc = gl.getUniformLocation(progbox, "modelview");
        projectionboxLoc = gl.getUniformLocation(progbox, "projection");

        skyboxLoc = gl.getUniformLocation(progbox, "skybox");


        
		
		
		
		
		// LOAD SHADER (standard texture mapping)
        var vertexShaderSource = getTextContent("vshader");
        var fragmentShaderSource = getTextContent("fshader");
        prog = createProgram(gl, vertexShaderSource, fragmentShaderSource);

        gl.useProgram(prog);
		
        // locate variables for further use
        CoordsLoc = gl.getAttribLocation(prog, "vcoords");
        NormalLoc = gl.getAttribLocation(prog, "vnormal");
        TexCoordLoc = gl.getAttribLocation(prog, "vtexcoord");

        ModelviewLoc = gl.getUniformLocation(prog, "modelview");
        ProjectionLoc = gl.getUniformLocation(prog, "projection");
        NormalMatrixLoc = gl.getUniformLocation(prog, "normalMatrix");
        alphaLoc = gl.getUniformLocation(prog, "alpha");

        gl.enableVertexAttribArray(CoordsLoc);
        gl.enableVertexAttribArray(NormalLoc);
		gl.disableVertexAttribArray(TexCoordLoc);  // we do not need texture coordinates

        gl.enable(gl.DEPTH_TEST);

        //  create a "rotator" monitoring mouse mouvement
        rotator = new SimpleRotator(canvas, render);
        //  set initial camera position at z=40, with an "up" vector aligned with y axis
        //   (this defines the initial value of the modelview matrix )
        rotator.setView([0, 0, 1], [0, 1, 0], 40);

        ambientProduct = mult(lightAmbient, materialAmbient);
        diffuseProduct = mult(lightDiffuse, materialDiffuse);
        specularProduct = mult(lightSpecular, materialSpecular);
		
		gl.uniform4fv(gl.getUniformLocation(prog, "ambientProduct"), flatten(ambientProduct));
		gl.uniform4fv(gl.getUniformLocation(prog, "diffuseProduct"), flatten(diffuseProduct));
		gl.uniform4fv(gl.getUniformLocation(prog, "specularProduct"), flatten(specularProduct));
		gl.uniform1f(gl.getUniformLocation(prog, "shininess"), materialShininess);

		gl.uniform4fv(gl.getUniformLocation(prog, "lightPosition"), flatten(lightPosition));

		projection = perspective(70.0, 1.0, 1.0, 200.0);
		gl.uniformMatrix4fv(ProjectionLoc, false, flatten(projection));  // send projection matrix to the shader program
		
		// In the following lines, we create different "elements" (sphere, cylinder, box, disk,...).
		// These elements are "objects" returned by the "createModel()" function.
		// The "createModel()" function requires one parameter which contains all the information needed
		// to create the "object". The functions "uvSphere()", "uvCylinder()", "cube()",... are described
		// in the file "basic-objects-IFS.js". They return an "object" containing vertices, normals, 
		// texture coordinates and indices.
		// 
		
		
		//Création des modèles:
		
        sphere = createModel(uvSphere(10.0, 25.0, 25.0));
        cylinder = createModel(uvCylinder(10.0, 20.0, 25.0, false, false));
		box = createModel(cube(10.0));
		trapeze = createModel(trapezeForm(10.0));
		trapezeAngle = createModel(trapezeFormAngle(10.0));
		piedPorteInv = createModel(piedPorteFormInver(10.0));
		tétraèdre = createModel(tétraèdreForm(10.0));
		cockpitObjet = createModel(cockpitForm(10.0));
		//disk = createModel(ring(5.0, 10.0, 25.0));
        torus = createModel(uvTorus(15.0, 5.0, 25.0, 25.0));
        cone = createModel(uvCone(10.0, 20.0, 25.0, true));
		
		envbox = createModelbox(cube(1000.0));
		cubeReflechissant = createModelmap(cube(10.0));
		
		//hemisphereinside = createModel(uvHemisphereInside(10.0, 25.0, 25.0));
		//hemisphereoutside = createModel(uvHemisphereOutside(10.0, 25.0, 25.0));
       // thindisk = createModel(ring(9.5, 10.0, 25.0));

		// quartersphereinside = createModel(uvQuartersphereInside(10.0, 25.0, 25.0));
		// quartersphereoutside = createModel(uvQuartersphereOutside(10.0, 25.0, 25.0));

		// managing arrow keys (to move up or down the model)
		initTexture();
		
		
		tronc = new Object();
		tronc.Objets = [cylinder,cylinder,trapeze,box,box,trapezeAngle,trapeze,piedPorteInv,box,box,box,trapeze,trapeze,trapezeAngle,trapezeAngle,trapeze,trapeze,piedPorteInv];
		tronc.listTransl = [vec3(0.0,6.1,3.0),vec3(0.0,6.1,-0.0),vec3(0.0,6.1,-3.0),vec3(0.0,6.3,-1.0),vec3(0.0,6.3,-3.2),vec3(0.0,6.1,-12.0),vec3(0.0,6.1,-9.1),vec3(0.0, -1.0, 6.8),vec3(0.0, -1.5, 5.0),vec3(0.0, -1.2, -5.0),vec3(0.0, 0.3, -1.0),vec3(0.0,2.0,-1.0),vec3(0.0,3.5,-7.0),vec3(0.0,3.5,2.0),vec3(0.0,4.25,1.35),vec3(0.0,6.2,-7.0),vec3(0.0,4.5,-7.0),vec3(0.0,-2.5,8.2)];
		tronc.listRotate = [vec4(-180.0, 0, 1, 0),vec4(-180.0, 0, 1, 0),vec4(180.0, 0, -15, 15),vec4(90.0, 1, 0, 0),vec4(90.0, 1, 0, 0),vec4(180.0, 0, -15, 15),vec4(180.0, 0, -15, 15),vec4(180.0, 0, -15, 15),vec4(140.0, 1, 0, 0),vec4(90.0, 1, 0, 0),vec4(90.0, 1, 0, 0),vec4(90.0, 1, 0, 0),vec4(90.0, 1, 0, 0),vec4(90.0, 1, 0, 0),vec4(90.0, 1, 0, 0),vec4(90.0, 1, 0, 0),vec4(90.0, 1, 0, 0),vec4(90.0, 1, 0, 0)];
		tronc.listScale = [vec3(0.05, 0.05, 0.5),vec3(0.07, 0.07, 0.4),vec3(0.27,0.4,0.13),vec3(0.15,0.3,0.15),vec3(0.18,0.35,0.19),vec3(0.33,0.32,0.15),vec3(0.27,0.4,0.13),vec3(0.8, 0.35, 0.15),vec3(0.79, 0.2, 0.25),vec3(0.78, 2.0, 0.15),vec3(0.8, 2.8, 0.15),vec3(0.8, 2.8, 0.2),vec3(0.58,1.6,0.2),vec3(0.59,0.5,0.2),vec3(0.42,0.4,0.2),vec3(0.32,0.4,0.15),vec3(0.47,1.3,0.2),vec3(0.71,1.1,0.5)];
		tronc.texts = [textureMetal1,textureMetal2,textureRouge,textureMetal1,textureMetal2,textureRouge,textureRouge,textureRouge,textureRouge,textureRouge,textureRouge,textureRouge,textureRouge,textureRouge,textureRouge,textureRouge,textureRouge,textureRouge];
		tronc.render = function(){ render_Object(tronc,vec4(0.6,0.5,0.7,1.0),vec4(0.5,0.2,0.5,1.0),vec4(0.5,0.8,0.5,1.0),500,false,false); }
		
		avant = new Object();
		avant.Objets = [box,box,box,box,box,  box,box,box,box,box,  trapeze,trapeze,trapeze,box,cockpitObjet];
		avant.listTransl = [vec3(-2.0,-3.2,20.0),vec3(-1.0,-3.2,20.0),vec3(0.0,-3.2,20.0),vec3(1.0,-3.2,20.0),vec3(2.0,-3.2,20.0),  vec3(2.0,-0.7,21.5),vec3(-2.0,-0.7,21.5),vec3(-1.0,-0.7,21.5),vec3(0.0,-0.7,21.5),vec3(1.0,-0.7,21.5),vec3(0.0,0.5,19.9),vec3(0.0,-2.46,17.1),vec3(0.0,-1.8,19.0),vec3(0.0,-2.0,14.0),vec3(0.0,1.255,16.0)];
		avant.listRotate = [vec4(180.0, 0, -30, 15),vec4(180.0, 0, -30, 15),vec4(180.0, 0, -30, 15),vec4(180.0, 0, -30, 15),vec4(180.0, 0, -30, 15),  vec4(180.0, 0, 45, 15),vec4(180.0, 0, 45, 15),vec4(180.0, 0, 45, 15),vec4(180.0, 0, 45, 15),vec4(180.0, 0, 45, 15),vec4(180.0, 0, 45, 15),vec4(180.0, 1, 0, 0),vec4(180.0, 0, -29, 15),vec4(90.0, 1, 0, 0),vec4(90.0, 1, 0, 0)];
		avant.listScale = [vec3(0.05,0.05,0.4),vec3(0.05,0.05,0.4),vec3(0.05,0.05,0.4),vec3(0.05,0.05,0.4),vec3(0.05,0.05,0.4),  vec3(0.05,0.05,0.1),vec3(0.05,0.05,0.1),vec3(0.05,0.05,0.1),vec3(0.05,0.05,0.1),vec3(0.05,0.05,0.1),vec3(0.4,0.05,0.15),vec3(0.71,0.5,0.4),vec3(0.68,0.33,0.5),vec3(0.7, 0.27, 0.6),vec3(0.81, 0.6, 0.34)];
		avant.texts = [textureRouge,textureRouge,textureRouge,textureRouge,textureRouge,textureRouge,textureRouge,textureRouge,textureRouge,textureRouge,textureMetal2,textureRouge,textureRouge,textureRouge,textureFenètre];
		avant.render = function(){ render_Object(avant,vec4(0.6,0.8,0.5,1.0),vec4(0.6,0.8,0.5,1.0),vec4(0.5,0.5,0.5,1.0),500,false,false); }
		
		aileron = new Object();
		aileron.Objets = [box,box,box,piedPorteInv,piedPorteInv,piedPorteInv,piedPorteInv];
		aileron.listTransl = [vec3(-8.5,0.2,11.8),vec3(8.5,0.2,11.8),vec3(0.0,0.2,11.4),vec3(7.4,0.2,12.0),vec3(-7.4,0.2,12.0),vec3(2.5,0.2,10.2),vec3(-2.5,0.2,10.2)];
		aileron.listRotate = [vec4(90.0, 0, 1, 0),vec4(90.0, 0, 1, 0),vec4(90.0, 1, 0, 0),vec4(270.0, 0.5, 0, 15),vec4(270.0, -0.5, 0, -15),vec4(180.0, -15, 15, 0),vec4(180.0, 15, 15, 0)];
		aileron.listScale = [vec3(0.2, 0.08, 0.05),vec3(0.2, 0.08, 0.05),vec3(1.7, 0.05, 0.05),vec3(0.06, 0.2, 0.1),vec3(0.06, 0.2, 0.1),vec3(0.06, 1.2, 0.2),vec3(0.06, 1.2, 0.2)];
		aileron.texts = [textureMetal2,textureMetal2,textureRouge,textureRouge,textureRouge,textureRouge,textureRouge];
		aileron.render = function(){ render_Object(aileron,vec4(0.5,0.5,0.5,1.0),vec4(0.5,0.5,0.5,1.0),vec4(0.5,0.5,0.5,1.0),100,false,false); }
		
		aile = new Object();
		aile.Objets = [torus,cylinder,cylinder,cone,torus,cylinder,cylinder,cone,box,box,box,piedPorteInv,piedPorteInv,piedPorteInv,piedPorteInv,piedPorteInv,piedPorteInv,piedPorteInv,piedPorteInv];
		aile.listTransl = [vec3(-6.0,-0.2,-2.0),vec3(-6.0,1.0,-7.5),vec3(-6.0,-0.2,-7.0),vec3(-6.0,-0.2,-14.0),vec3(6.0,-0.2,-2.0),vec3(6.0,1.0,-7.5),vec3(6.0,-0.2,-7.0),vec3(6.0,-0.2,-14.0),vec3(-18.0,0.2,-6.0),vec3(18.0,0.2,-6.0),vec3(0.0,0.2,-6.5),vec3(-5.0,0.2,-4.5),vec3(5.0,0.2,-4.5),vec3(16.0,0.2,-4.5),vec3(-16.0,0.2,-4.5),vec3(6.5,0.2,-10.0),vec3(-6.5,0.2,-10.0),vec3(11.0,0.2,-9.0),vec3(-11.0,0.2,-9.0)];
		aile.listRotate = [vec4(-180.0, 0, 1, 0),vec4(-180.0, 0, 1, 0),vec4(-180.0, 0, 1, 0),vec4(-180.0, 0, 1, 0),vec4(-180.0, 0, 1, 0),vec4(-180.0, 0, 1, 0),vec4(-180.0, 0, 1, 0),vec4(-180.0, 0, 1, 0),vec4(90.0, 0, 1, 0),vec4(90.0, 0, 1, 0),vec4(90.0, 1, 0, 0),vec4(270.0, 0, 0, 15),vec4(270.0, 0, 0, -15),vec4(270.0, 0, 0, 15),vec4(270.0, 0, 0, -15),vec4(180.0, -15, 15, 0),vec4(180.0, 15, 15, 0),vec4(180.0, -15, 15, 0),vec4(180.0, 15, 15, 0)];
		aile.listScale = [vec3(0.12, 0.12, 0.3),vec3(0.1, 0.1, 0.3),vec3(0.15, 0.15, 0.55),vec3(0.17, 0.17, 0.2),vec3(0.12, 0.12, 0.3),vec3(0.1, 0.1, 0.3),vec3(0.15, 0.15, 0.55),vec3(0.17, 0.17, 0.2),vec3(0.5, 0.11, 0.08),vec3(0.5, 0.11, 0.08),vec3(3.6, 0.35, 0.07),vec3(0.05, 0.6, 0.15),vec3(0.05, 0.6, 0.15),vec3(0.05, 0.4, 0.15),vec3(0.05, 0.4, 0.15),vec3(0.08, 1.6, 0.3),vec3(0.08, 1.6, 0.3),vec3(0.09, 1.4, 0.2),vec3(0.09, 1.4, 0.2)];
		aile.texts = [textureMetal1,textureOr,textureMetal1,textureMetal1,textureMetal1,textureOr,textureMetal1,textureMetal1,textureMetal2,textureMetal2,textureRouge,textureRouge,textureRouge,textureRouge,textureRouge,textureMetal2,textureMetal2,textureRouge,textureRouge];
		aile.render = function(){ render_Object(aile,vec4(0.1,0.6,1.0,1.0),vec4(0.1,0.6,1.0,1.0),vec4(0.1,0.6,1.0,1.0),100,false,false); }
		
		
		arriere = new Object();
		arriere.Objets = [torus,cylinder,cylinder,cone,box,box,box,box,piedPorteInv,piedPorteInv,box,box,trapeze,trapezeAngle,box,box];
		arriere.listTransl = [vec3(0.0,-1.2,-10.0),vec3(0.0,-2.2,-14.0),vec3(0.0,-1.2,-14.0),vec3(0.0,-1.2,-20.0),vec3(0.0,-5.75,-14.1),vec3(0.0,9.2,-16.0),vec3(0.0,2.5,-15.5),vec3(0.0,4.0,-18.0),vec3(0.0,7.5,-18.05),vec3(0.0,8.0,-15.0),vec3(2.5,-0.5,-16.0),vec3(-2.5,-0.5,-16.0),vec3(0.0,2.0,-16.3),vec3(0.0,-0.5,-16.8),vec3(0.0,4.5,-16.5),vec3(0.0,-4.2,-14.5)];
		arriere.listRotate = [vec4(-180.0, 0, 1, 0),vec4(-180.0, 0, 1, 0),vec4(-180.0, 0, 1, 0),vec4(-180.0, 0, 1, 0),vec4(90.0, 0, 1, 0),vec4(90.0, 0, 1, 0),vec4(90.0, 1, 6, 1),vec4(90.0, 1, 6, 1),vec4(180.0, 0, -20, -5),vec4(0.0, 0, 1, 0),vec4(-70.0, 0, 1, 0),vec4(70.0, 0, 1, 0),vec4(140.0, 1, 0, 0),vec4(-90.0, 1, 0, 0),vec4(90.0, 0, 1, 0),vec4(90.0, -0.2, 1, -0.2)];
		arriere.listScale = [vec3(0.1, 0.1, 0.3),vec3(0.1, 0.1, 0.3),vec3(0.15, 0.15, 0.4),vec3(0.15, 0.15, 0.2),vec3(0.3, 0.11, 0.08),vec3(0.5, 0.11, 0.08),vec3(0.3,0.6,0.04),vec3(0.2,0.7,0.04),vec3(0.055, 0.3, 0.08),vec3(0.05, 0.2, 0.2),vec3(0.3,0.3,0.2),vec3(0.3,0.3,0.2),vec3(0.58,0.2,0.5),vec3(0.65,0.4,0.3),vec3(0.25,0.9,0.05),vec3(0.25,0.30,0.05)];
		arriere.texts = [textureMetal1,textureOr,textureMetal1,textureMetal1,textureMetal2,textureMetal2,textureRouge,textureMetal2,textureMetal2,textureRouge,textureRouge,textureRouge,textureRouge,textureRouge,textureRouge,textureRouge];
		arriere.render = function(){ render_Object(arriere,vec4(0.3,0.3,0.3,1.0),vec4(0.3,0.3,0.3,1.0),vec4(0.5,0.5,0.5,1.0),100,false,false); }
		
		
		aileron2 = new Object();
		aileron2.Objets = [cylinder,cylinder,trapeze,cylinder,cylinder,trapeze];
		aileron2.listTransl = [vec3(-8.6,6.75,-5.6),vec3(8.6,6.75,-5.6),vec3(6.0,5.7,-8.0),vec3(2.0,4.2,-8.0),vec3(-2.0,4.2,-8.0),vec3(-6.0,5.7,-8.0)];
		aileron2.listRotate = [vec4(-180.0, 0, 1, 0),vec4(-180.0, 0, 1, 0),vec4(90.0, 0.2,-1, 0.2),vec4(-180.0, 0, 1, 0),vec4(-180.0, 0, 1, 0),vec4(90.0, 0.2,1, -0.2)];
		aileron2.listScale = [vec3(0.033, 0.033, 0.4),vec3(0.033, 0.033, 0.4),vec3(0.45,0.07,0.7),vec3(0.1, 0.1, 0.25),vec3(0.1, 0.1, 0.25),vec3(0.45,0.07,0.7)];
		aileron2.texts = [textureMetal2,textureMetal2,textureRouge,textureRouge,textureRouge,textureRouge];
		aileron2.render = function(){ render_Object(aileron2,vec4(0.5,0.5,0.5,1.0),vec4(0.5,0.5,0.5,1.0),vec4(0.5,0.5,0.5,1.0),100,false,false); }
		
		
		planetes = new Object();
		planetes.Objets = [sphere,sphere,sphere,sphere];
		planetes.listTransl = [vec3(-35.6,6.75,-55.6),vec3(55.6,-6.75,-75.6),vec3(20.6,75.75,-125.6),vec3(-35.6,6.75,-35.6)];
		planetes.listRotate = [vec4(90.0, 0, 1, 0),vec4(90.0, 0, -1, 0),vec4(90.0, 0, -1, 0),vec4(90.0, 0, -1, 0)];
		planetes.listScale = [vec3(1.4, 1.4, 1.4),vec3(2.0, 2.0, 2.0),vec3(4.5, 4.5, 4.5),vec3(0.3, 0.3, 0.3)];
		planetes.texts = [textureTerre,textureMercure,textureJupiter,textureLune];
		planetes.render = function(){ render_Object(planetes,vec4(0.5,0.5,0.5,1.0),vec4(0.5,0.5,0.5,1.0),vec4(0.5,0.5,0.5,1.0),100,false,false); }
		
		
		transparentList = new Object();
		transparentList.Objets = [box];
		transparentList.listTransl = [vec3(-10.0,20.0,0.0)];
		transparentList.listRotate = [vec4(90.0, 0, 1, 0)];
		transparentList.listScale = [vec3(1.1, 1.1, 1.1)];
		transparentList.texts = [textureNom];
		transparentList.render = function(){ render_Object(transparentList,vec4(0.5,0.5,0.5,1.0),vec4(0.5,0.5,0.5,1.0),vec4(0.5,0.5,0.5,1.0),100,true,false); }

		
		reflechissantList = new Object();
		reflechissantList.Objets = [cubeReflechissant];
		reflechissantList.listTransl = [vec3(10.0,20.0,0.0)];
		reflechissantList.listRotate = [vec4(90.0, 0, 1, 0)];
		reflechissantList.listScale = [vec3(1.0, 1.0, 1.0)];
		reflechissantList.texts = [textureNom];
		reflechissantList.render = function(){ render_Object(reflechissantList,vec4(0.5,0.5,0.5,1.0),vec4(0.5,0.5,0.5,1.0),vec4(0.5,0.5,0.5,1.0),100,false,true); }

		
		document.addEventListener("keydown", MoveKeyPress, false);
		
		document.onkeydown = function (e) {
			switch (e.key) {
				case 'Home':
					// resize the canvas to the current window width and height
					resize(canvas);
					break;
			}
		};

    // }
    // catch (e) {
        // document.getElementById("message").innerHTML =
             // "Could not initialize WebGL: " + e;
        // return;
    // }

	resize(canvas);  // size the canvas to the current window width and height

	
    render();
	
	
	//Rotation planètes
	var angle=0;
	setInterval(function () {
		
		for(var i = 0; i < planetes.Objets.length;i++){
			
		planetes.listRotate[i][0]+=0.15;
		}
		transparentList.listRotate[0][0]+=0.25;
		reflechissantList.listRotate[0][0]+=0.25;

	planetes.listTransl[3][0]+=Math.cos(angle)/5;	
	planetes.listTransl[3][2]-=Math.sin(angle)/5;
	angle+=0.01;
	
	render();
	},1);
	
	
}

function resize(canvas) {  // ref. https://webglfundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html
  var realToCSSPixels = window.devicePixelRatio;

  var actualPanelWidth = Math.floor(0.85 * window.innerWidth * realToCSSPixels); // because, in the HTML file, we have set the right panel to be 85% of the window width
  var actualPanelHeight = Math.floor(0.96 * window.innerHeight * realToCSSPixels); 

  var minDimension = Math.min(actualPanelWidth, actualPanelHeight);
    
   // Ajust the canvas to this dimension (square)
    canvas.width  = minDimension;
    canvas.height = minDimension;
	
	gl.viewport(0, 0, canvas.width, canvas.height);

}

function render_Object(objet,amb,diff,spec,shin,estTransparant,estReflechissant) {
	var program;
	program = prog;
	if(estReflechissant){program = progmap;}
	
	// console.log();
    var initialmodelview = modelview;
	
	 	 	 
	 for(var i = 0; i<objet.Objets.length; i++){
		
	gl.enableVertexAttribArray(TexCoordLoc); 
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, objet.texts[i]);
	gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);
				
	ambientProduct = mult(lightAmbient, amb);
	diffuseProduct = mult(lightDiffuse, diff);
	specularProduct = mult(lightSpecular, spec);

	gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"), flatten(ambientProduct));
	gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"), flatten(diffuseProduct));
	gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), flatten(specularProduct));
	gl.uniform1f(gl.getUniformLocation(program, "shininess"), shin);
	
	if(!estReflechissant){
	if(estTransparant == false){
	gl.depthMask(true);
	gl.uniform1f(alphaLoc, 1);
	}
	else{
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
	gl.enable(gl.BLEND);		
	gl.uniform1f(alphaLoc, 0.6); 
	}
	}	
	modelview = initialmodelview;
	modelview = mult(modelview, matriceDeplacement);
	modelview = mult(modelview, translate(objet.listTransl[i][0],objet.listTransl[i][1],objet.listTransl[i][2]));
	modelview = mult(modelview, rotate(objet.listRotate[i][0],objet.listRotate[i][1],objet.listRotate[i][2],objet.listRotate[i][3]));
	normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling
	modelview = mult(modelview, scale(objet.listScale[i][0],objet.listScale[i][1],objet.listScale[i][2]));
	// modelview = mult(modelview, scale(0.95,0.95,0.95));
	objet.Objets[i].render();
	}
	
}

function MoveKeyPress(event){
	switch(event.keyCode){
		case 37:  //left arrow
		matriceDeplacement = mult(rotate(1 ,0 ,-1 ,0), matriceDeplacement);
		break;
		
		case 38:  //upper arrow
		matriceDeplacement = mult(translate(0 ,0 ,1), matriceDeplacement);
		break;
	
		case 39:  //right arrow
		matriceDeplacement = mult(rotate(1 ,0 ,1 ,0), matriceDeplacement);
		break;
		
		case 40:  //down arrow
		matriceDeplacement = mult(translate(0 ,0 ,-1), matriceDeplacement);
		break;
	}	
}


function initTexture() {
	
    textureMetal1 = gl.createTexture();
    textureMetal1.image = new Image();
    textureMetal1.image.onload = function () {
        handleLoadedTexture(textureMetal1)
    }
    textureMetal1.image.src = "metal2.jpg";
	ntextures_tobeloaded++;
	
	
	
	textureVert = gl.createTexture();
    textureVert.image = new Image();
    textureVert.image.onload = function () {
        handleLoadedTexture(textureVert)
    }
    textureVert.image.src = "vert.jpg";
	ntextures_tobeloaded++;
	
	
	
	textureRouge = gl.createTexture();
    textureRouge.image = new Image();
    textureRouge.image.onload = function () {
        handleLoadedTexture(textureRouge)
    }
    textureRouge.image.src = "rouge.jpg";
	ntextures_tobeloaded++;
	
	
	
	textureBleu = gl.createTexture();
    textureBleu.image = new Image();
    textureBleu.image.onload = function () {
        handleLoadedTexture(textureBleu)
    }
    textureBleu.image.src = "bleu2.jpg";
	ntextures_tobeloaded++;
	
	
	
	textureMetal2 = gl.createTexture();
    textureMetal2.image = new Image();
    textureMetal2.image.onload = function () {
        handleLoadedTexture(textureMetal2)
    }
    textureMetal2.image.src = "marron.jpg";
	ntextures_tobeloaded++;
	
	
	textureOr = gl.createTexture();
    textureOr.image = new Image();
    textureOr.image.onload = function () {
        handleLoadedTexture(textureOr)
    }
    textureOr.image.src = "Or.jpg";
	ntextures_tobeloaded++;
	
	
	
	textureFenètre = gl.createTexture();
    textureFenètre.image = new Image();
    textureFenètre.image.onload = function () {
        handleLoadedTexture(textureFenètre)
    }
    textureFenètre.image.src = "fenetre.jpg";
	ntextures_tobeloaded++;
	
	
	
	textureNom = gl.createTexture();
    textureNom.image = new Image();
    textureNom.image.onload = function () {
        handleLoadedTexture(textureNom)
    }
    textureNom.image.src = "rouge2.jpg";
	ntextures_tobeloaded++;
	
	
	textureTerre = gl.createTexture();
    textureTerre.image = new Image();
    textureTerre.image.onload = function () {
        handleLoadedTexture(textureTerre)
    }
    textureTerre.image.src = "earth.jpg";
	ntextures_tobeloaded++;
	
	
	textureLune = gl.createTexture();
    textureLune.image = new Image();
    textureLune.image.onload = function () {
        handleLoadedTexture(textureLune)
    }
    textureLune.image.src = "moon1.png";
	ntextures_tobeloaded++;
	
	
	textureJupiter = gl.createTexture();
    textureJupiter.image = new Image();
    textureJupiter.image.onload = function () {
        handleLoadedTexture(textureJupiter)
    }
    textureJupiter.image.src = "jupiter.jpg";
	ntextures_tobeloaded++;
	
	
		textureMercure = gl.createTexture();
    textureMercure.image = new Image();
    textureMercure.image.onload = function () {
        handleLoadedTexture(textureMercure)
    }
    textureMercure.image.src = "mercure.jpg";
	ntextures_tobeloaded++;
	
	
	
    var urls = [
       "nebula_posx.png", "nebula_negx.png",
       "nebula_posy.png", "nebula_negy.png",
       "nebula_posz.png", "nebula_negz.png"
    ];

    texIDmap0 = gl.createTexture();
    texIDmap0.isloaded = false;  // this class member is created only to check if the image has been loaded

    for (var i = 0; i < 6; i++) {
        img[i] = new Image();
        img[i].onload = function () {  // this function is called when the image download is complete

            handleLoadedTextureMap(texIDmap0);
        }
        img[i].src = urls[i];   // this line starts the image downloading thread

    }

}

function handleLoadedTexture(texture) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

	ntextures_loaded++;
    render();  // Call render function when the image has been loaded (to make sure the model is displayed)

    gl.bindTexture(gl.TEXTURE_2D, null);
}



function handleLoadedTextureMap(texture) {

    ct++;
    if (ct == 6) {
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        var targets = [
           gl.TEXTURE_CUBE_MAP_POSITIVE_X, gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
           gl.TEXTURE_CUBE_MAP_POSITIVE_Y, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
           gl.TEXTURE_CUBE_MAP_POSITIVE_Z, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z
        ];
        for (var j = 0; j < 6; j++) {
            gl.texImage2D(targets[j], 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img[j]);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        }
        gl.generateMipmap(gl.TEXTURE_CUBE_MAP);

        texture.isloaded = true;

        render();  // Call render function when the image has been loaded (to insure the model is displayed)

        gl.bindTexture(gl.TEXTURE_2D, null);
    }
}
