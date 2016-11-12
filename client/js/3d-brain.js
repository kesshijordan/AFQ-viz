//tracklist js

//Data : track names
console.log('huh?')
var tracks=["NOTExpectingthisCluster 1","Cluster 2", "Cluster 3", "Cluster 4", "Cluster 5", "Cluster 6", "Cluster 7", "Cluster 8", "Cluster 9", "Cluster 10" ]
// color Palettes in Hex format, HTML needs colors in d3colors format
// colors are the Tableau20 colors
var colors = [0x1F77B4, 0xAEC7E8, 0xFF7F0E, 0xFFBB78, 0x2CA02C, 0x98DF8A, 0xD62728, 0xFF9896, 0x9467BD, 0xC5B0D5, 0x8C564B, 0xC49C94, 0xE377C2, 0xF7B6D2, 0x7F7F7F, 0xC7C7C7, 0xBCBD22, 0xDBDB8D, 0x17BECF, 0x9EDAE5];
var d3colors = ["#1F77B4", "#AEC7E8", "#FF7F0E", "#FFBB78", "#2CA02C", "#98DF8A", "#D62728", "#FF9896", "#9467BD", "#C5B0D5", "#8C564B", "#C49C94", "#E377C2", "#F7B6D2", "#7F7F7F", "#C7C7C7", "#BCBD22", "#DBDB8D", "#17BECF", "#9EDAE5"];
// highlightColors[i] = (colors[i] + 10 lightness) converted to RGB hex
var highlightColors = [0x2991DB, 0xD7E4F4, 0xFF9A42, 0xFFD6AD, 0x37C837, 0xBCEAB3, 0xDF5353, 0xFFC8C7, 0xAC8ACC, 0xDDD0E6, 0xA96C60, 0xD5B9B3, 0xECA2D6, 0xFCE3EE, 0x999, 0xE0E0E0, 0xDCDC38, 0xE8E8B5, 0x30D6E8, 0xC7EAF0];

var m = {top: 20, right: 10, bottom: 10, left: 20},
w = 400 - m.left - m.right,
h = 350 - m.top - m.bottom;


// =========== three js part

var container;

var camera, scene, renderer;
var directionalLight;

var sizeX = 600, sizeY = 500;

var brain;
var lh, rh;

var groups = new THREE.Object3D();
groups.name='keshbundles'
var line_material = new THREE.LineBasicMaterial({
	linewidth: 1.5
});

line_material.color.setHex( 0x969696 );


init();
animate();

var mouseDown = 0;
var mouseMove = false;
document.body.onmousedown = function() {
  ++mouseDown;
}
document.body.onmouseup = function() {
  --mouseDown;
}

var showStats = false;
var stats;

function init() {

    // We put the container inside a div with id #threejsbrain
    var puthere = document.getElementById("threejsbrain");
    container = document.createElement('div');
    puthere.appendChild(container);

    // var WIDTH = window.innerWidth,
        // HEIGHT = window.innerHeight;

    Width = container.clientWidth;

    var brainOpacity = 0.1;
    var lineInitialOpacity = 0.3;

    // camera = new THREE.PerspectiveCamera(45, WIDTH / HEIGHT, 1, 2000);
    camera = new THREE.PerspectiveCamera( 45, Width / sizeY, 1, 2000 );
    camera.position.y = -15;
	camera.up.set(0, 0, 1);

    // scene
    scene = new THREE.Scene();

    var ambient = new THREE.AmbientLight(0x111111);
    scene.add(ambient);

    directionalLight = new THREE.DirectionalLight(0xffeedd, 1);
    directionalLight.position.set(0, -1, 0);
    scene.add(directionalLight);

    // texture
    var manager = new THREE.LoadingManager();
    manager.onProgress = function (item, loaded, total) {
        //console.log(item, loaded, total);
    };

    // renderer
    renderer = new THREE.WebGLRenderer();

    renderer.setSize(Width, sizeY);
    container.appendChild(renderer.domElement);

    // dom event
    domEvents = new THREEx.DomEvents(camera, renderer.domElement);

    // model
    // Load our brain
    material = new THREE.MeshBasicMaterial();

    // load brain surface
    var loader = new THREE.OBJLoader(manager);
    loader.load('data/freesurf.OBJ', function (object) {
        brain = object;
        rh = object.getObjectByName('rh.pial.asc');
        lh = object.getObjectByName('lh.pial.asc');

        object.traverse(function (child) {
            if (child instanceof THREE.Mesh) {
                child.material.opacity = brainOpacity;
                child.material.depthWrite = false;
                child.material.transparent = true;

            }
        });

		object.rotation.x = Math.PI / 2;
		object.scale.set(1.75, 1.75, 1.75);
        scene.add(object);
    });

	var guiConfigObj = {"Brain Opacity" : 0.1};
	var gui = new DAT.GUI({ autoPlace: false });
	// gui.domElement.id = 'gui';
	var guiContainer = $('.moveGUI').append($(gui.domElement));
	var opacity = gui.add(guiConfigObj, "Brain Opacity", 0, 1);
	gui.close();

	opacity.onChange( function(value) {
		brain.traverse(function (child) {
			if (child instanceof THREE.Mesh) {
				child.material.opacity = value;
			}
		})
	});


    // contain all bundles in this Group object
    // each bundle is represented by an Object3D
    // load fiber bundle using jQuery
    //example: Unc 0 and 1; IFOF 2 and 4
    //example: Arc  3, 4, 5ish
	var bundleIdx = 0;
    $.getJSON("data/slf_L_tier_0.json", function(json) {
        for (var key in json) {
            if (json.hasOwnProperty(key)) {
                var oneBundle = json[key];
				var combined = new THREE.Geometry();

                for (var subkey in oneBundle) {
                    if (oneBundle.hasOwnProperty(subkey)) {
						var geometry = new THREE.Geometry();
                        var oneStreamLine = oneBundle[subkey];

                        // draw this stream line in scene
                        for (var i = 0; i < oneStreamLine.length - 1; i++) {
                            geometry.vertices.push(new THREE.Vector3(oneStreamLine[i][0], oneStreamLine[i][1], oneStreamLine[i][2]));
                            geometry.vertices.push(new THREE.Vector3(oneStreamLine[i+1][0], oneStreamLine[i+1][1], oneStreamLine[i+1][2]));
                        }

						var line = new THREE.LineSegments(geometry, line_material);

						combined.merge(line.geometry, line.matrix);
                    }
                }
				var bundleLine = new THREE.LineSegments(combined, line_material);
				bundleLine.scale.set(0.05,0.05,0.05);

				bundleLine.name = tracks[ bundleIdx ];
				bundleLine.idx = bundleIdx;
				++bundleIdx;

                groups.add(bundleLine);
            }
        }
        console.log('groups before traverse')
		console.log(groups)

		unregister_list = []
		function register_event_listener(mesh, event_name, callback) {
		domEvents.addEventListener(mesh, event_name, callback)
		unregister_list.push(function (){domEvents.removeEventListener(mesh, event_name, callback)}) //append
		}

        groups.traverse(function (child) {
        	console.log('child')
        	console.log(child)
        	console.log('child over')
			if (child instanceof THREE.LineSegments) {
				console.log('IFFING round 1')
				console.log(child)
                child.material.opacity = lineInitialOpacity;
                child.material.transparent = true;
                child.position.set(0, 0.8, -0.5);
                // these are the LISTENERS that fire on an EVENT
                register_event_listener(child, 'mouseover', function(event) {
        					if(!mouseDown) {
								mouseoverBundle(child.idx);
        						return renderer.render(scene, camera);
        					}
                });
                register_event_listener(child, 'mousemove', function(event) {
        					mouseMove = true;
        				});

        		// this is a listener for the CLICK event:
                register_event_listener(child, 'mousedown', function(event) {
        					mouseMove = false;
        				});
        				register_event_listener(child, 'mouseup', function(event) {
        					if(!mouseMove) {
        						var myBundle = d3.selectAll("input.tracks")[0][child.idx];
        						myBundle.checked = !myBundle.checked;
        						showHideTrackDetails(myBundle.checked, myBundle.name)
        						// Lets say you want to hide the bundle on click -- try replacing
        						// highlightBundle w/ a function that hides the bundle
        						highlightBundle(myBundle.checked, myBundle.name)
        						return renderer.render(scene, camera);
        					} else {
        						mouseMove = false;
        					}
                });
                register_event_listener(child, 'mouseout', function(event) {
        					var myBundle = d3.selectAll("input.tracks")[0][child.idx];
        					showHideTrackDetails(myBundle.checked, myBundle.name)
        					highlightBundle(myBundle.checked, myBundle.name)
        					return renderer.render(scene, camera);
                });
            }
            else{
            console.log('ELSEING')
            console.log(child)
            }
        });

  		scene.add(groups);
    });

	if (showStats ) {
		stats = new Stats();
		container.appendChild( stats.dom );
	}

    window.addEventListener('resize', onWindowResize, false);
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.addEventListener('change', lightUpdate);
}

//function to send a json object to the server from the client
function onFinerButton() {
	var myObject = { "my_key": "my_value" }; //hardcoded object record status of all bundles

	$.ajax({
		type: "POST",
		url: "/generate",
		data: JSON.stringify(myObject), //doing something to object (sending it to server.py)
		contentType: 'application/json',
		dataType: 'json',
		error: function() {
			alert("error");
		},
		//success: function(data) {
		//	console.log("success", data);
		//}
		success: function(json) {

		console.log('removing groups.children')
		//var selectedObject = scene.getObjectByName(object.name);
    	scene.remove(scene.getObjectByName(groups.name));
    	unregister_list.forEach(function (F){F()})
    	unregister_list = []
		//scene.remove(groups.children)
		console.log(groups)
		console.log('just printed groups 1')
		console.log('adding bundleLine new')
		groups = new THREE.Object3D();
		groups.name='keshbundles_new'

		var bundleIdx = 0
      	for (var key in json) {
            if (json.hasOwnProperty(key)) {
                var oneBundle = json[key];
                console.log("KEY")
                console.log(key)
                console.log('json')
                console.log(json[key])
				var combined = new THREE.Geometry();

                for (var subkey in oneBundle) {
                    if (oneBundle.hasOwnProperty(subkey)) {
						var geometry = new THREE.Geometry();
                        var oneStreamLine = oneBundle[subkey];

                        // draw this stream line in scene
                        for (var i = 0; i < oneStreamLine.length - 1; i++) {
                            geometry.vertices.push(new THREE.Vector3(oneStreamLine[i][0], oneStreamLine[i][1], oneStreamLine[i][2]));
                            geometry.vertices.push(new THREE.Vector3(oneStreamLine[i+1][0], oneStreamLine[i+1][1], oneStreamLine[i+1][2]));
                        }

						var line = new THREE.LineSegments(geometry, line_material);

						combined.merge(line.geometry, line.matrix);
                    }
                }
				var bundleLine = new THREE.LineSegments(combined, line_material);
				bundleLine.scale.set(0.05,0.05,0.05);

				bundleLine.name = tracks[ key ];
				bundleLine.idx = bundleIdx;
				++bundleIdx;

				groups.add(bundleLine)

            }
        }

		console.log('button pre transverse')

        groups.traverse(function (child) {
        	console.log('button child')
        	console.log(child)
        	console.log('button child over')
        	var lineInitialOpacity = 0.3; // TODO: HOW DO I GET THIS FROM THE INIT INTO ONFINERBUTTON????
			if (child instanceof THREE.LineSegments) {
				console.log('IFFING')
				console.log(child)
                child.material.opacity = lineInitialOpacity;
                child.material.transparent = true;
                child.position.set(0, 0.8, -0.5);
                // these are the LISTENERS that fire on an EVENT
                console.log('dom event pre')
                console.log(domEvents)

                //domEvents = new THREEx.DomEvents(camera, renderer.domElement); //KESHTEST
                domEvents.addEventListener(child, 'mouseover', function(event) {
        					if(!mouseDown) {
								mouseoverBundle(child.idx);
        						return renderer.render(scene, camera);
        					}
                });
                domEvents.addEventListener(child, 'mousemove', function(event) {
        					mouseMove = true;
        				});

        		// this is a listener for the CLICK event:
                domEvents.addEventListener(child, 'mousedown', function(event) {
        					mouseMove = false;
        				});
        				domEvents.addEventListener(child, 'mouseup', function(event) {
        					if(!mouseMove) {
        						var myBundle = d3.selectAll("input.tracks")[0][child.idx];
        						myBundle.checked = !myBundle.checked;
        						showHideTrackDetails(myBundle.checked, myBundle.name)
        						// Lets say you want to hide the bundle on click -- try replacing
        						// highlightBundle w/ a function that hides the bundle
        						highlightBundle(myBundle.checked, myBundle.name)
        						return renderer.render(scene, camera);
        					} else {
        						mouseMove = false;
        					}
                });
                domEvents.addEventListener(child, 'mouseout', function(event) {
        					var myBundle = d3.selectAll("input.tracks")[0][child.idx];
        					showHideTrackDetails(myBundle.checked, myBundle.name)
        					highlightBundle(myBundle.checked, myBundle.name)
        					return renderer.render(scene, camera);
                });
            }
            else{
            console.log('ELSEING')
            console.log(child)
            console.log("done elseing")}
        });

		//scene.remove(groups.children)
  		scene.add(groups); //UNCOMMENT THIS

		}
	})
	//TESTING KESH
	window.addEventListener('resize', onWindowResize, false);
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.addEventListener('change', lightUpdate);
}

function onWindowResize() {
    var Width = container.clientWidth;

    camera.aspect = Width / sizeY;
    camera.updateProjectionMatrix();

    renderer.setSize(Width, sizeY);
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
    controls.update();
	if (showStats )
		stats.update();
}

function lightUpdate() {
    directionalLight.position.copy(camera.position);
}



// func to highlight specified bundle based on left panel checkboxes
function highlightBundle(state, name) {

	var tem_line_material = new THREE.LineBasicMaterial({
		opacity: 0.5,
		linewidth: 2.5,
        transparent: true
	});

	bundle = groups.children[name];

	if (bundle !== undefined) {
		if (state === true) {
			tem_line_material.color.setHex( colors[name] );
			bundle.material = tem_line_material;
			return renderer.render(scene, camera);

		} else {
			bundle.material = line_material;
			return renderer.render(scene, camera);
		}
	}
}

// func to HIDE specified bundle based on left panel checkboxes
function hideBundle(state, name) {

	var tem_line_material = new THREE.LineBasicMaterial({
		opacity: 0,
		linewidth: 2.5,
        transparent: true
	});

	var tem_line_material2 = new THREE.LineBasicMaterial({
		opacity: 1,
		linewidth: 2.5,
        transparent: true
	});

	bundle = groups.children[name];

	if (bundle !== undefined) {
		if (state === true) {
			tem_line_material.color.setHex( colors[name] );
			bundle.material = tem_line_material;
			return renderer.render(scene, camera);

		} else {

			bundle.material = line_material;
			return renderer.render(scene, camera);
		}
	}
}

// func to highlight specified bundle based on mouseover
function mouseoverBundle(name) {

	var tem_line_material = new THREE.LineBasicMaterial({
		opacity: 0.75,
		linewidth: 2,
		transparent: true
	});

	bundle = groups.children[name];

	if (bundle !== undefined) {
		tem_line_material.color.setHex( highlightColors[name] );
		bundle.material = tem_line_material;
		return renderer.render(scene, camera);
	}
}

var $window = $(window),
$stickyEl = $('#statcontent')
$elTop = $stickyEl.offset() || {top: 0}
$elTop = $elTop.top




$window.scroll(function() {
    $stickyEl.toggleClass('sticky', $window.scrollTop() > elTop);
});
