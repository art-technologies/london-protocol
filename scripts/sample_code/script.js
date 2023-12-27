// credits: https://p5js.org/examples/3d-ray-casting.htmls
const palettes = [
  {
    colours: ["#69D2E7", "#A7DBD8", "#E0E4CC", "#F38630", "#FA6900"],
    name: "Set 1",
  },
  {
    colours: ["#FE4365", "#FC9D9A", "#F9CDAD", "#C8C8A9", "#83AF9B"],
    name: "Set 2",
  },
  {
    colours: ["#ECD078", "#D95B43", "#C02942", "#542437", "#53777A"],
    name: "Set 3",
  },
  {
    colours: ["#556270", "#4ECDC4", "#C7F464", "#FF6B6B", "#C44D58"],
    name: "Set 4",
  },
  {
    colours: ["#774F38", "#E08E79", "#F1D4AF", "#ECE5CE", "#C5E0DC"],
    name: "Set 5",
  },
  {
    colours: ["#E8DDCB", "#CDB380", "#036564", "#033649", "#031634"],
    name: "Set 6",
  },
  {
    colours: ["#490A3D", "#BD1550", "#E97F02", "#F8CA00", "#8A9B0F"],
    name: "Set 7",
  },
  {
    colours: ["#594F4F", "#547980", "#45ADA8", "#9DE0AD", "#E5FCC2"],
    name: "Set 8",
  },
  {
    colours: ["#00A0B0", "#6A4A3C", "#CC333F", "#EB6841", "#EDC951"],
    name: "Set 9",
  },
  {
    colours: ["#E94E77", "#D68189", "#C6A49A", "#C6E5D9", "#F4EAD5"],
    name: "Set 10",
  },
  {
    colours: ["#D9CEB2", "#948C75", "#D5DED9", "#7A6A53", "#99B2B7"],
    name: "Set 11",
  },
  {
    colours: ["#FFFFFF", "#CBE86B", "#F2E9E1", "#1C140D", "#CBE86B"],
    name: "Set 12",
  },
  {
    colours: ["#EFFFCD", "#DCE9BE", "#555152", "#2E2633", "#99173C"],
    name: "Set 13",
  },
  {
    colours: ["#3FB8AF", "#7FC7AF", "#DAD8A7", "#FF9E9D", "#FF3D7F"],
    name: "Set 14",
  },
  {
    colours: ["#343838", "#005F6B", "#008C9E", "#00B4CC", "#00DFFC"],
    name: "Set 15",
  },
  {
    colours: ["#413E4A", "#73626E", "#B38184", "#F0B49E", "#F7E4BE"],
    name: "Set 16",
  },
  {
    colours: ["#99B898", "#FECEA8", "#FF847C", "#E84A5F", "#2A363B"],
    name: "Set 17",
  },
  {
    colours: ["#FF4E50", "#FC913A", "#F9D423", "#EDE574", "#E1F5C4"],
    name: "Set 18",
  },
  {
    colours: ["#554236", "#F77825", "#D3CE3D", "#F1EFA5", "#60B99A"],
    name: "Set 19",
  },
];

// pick palette using PRNG
const palette = palettes[prng.randInt(0, palettes.length)];

const lightColor = hexToRgb(
  palette.colours[editionNumber % palette.colours.length]
);
const ambientLightColor = hexToRgb(
  palette.colours[editionNumber % palette.colours.length]
);
const pointerColor = hexToRgb(
  palette.colours[editionNumber % palette.colours.length]
);

const colourToName = (rgbColour) => rgbColour.r + rgbColour.b + rgbColour.g;

// features approach #1
window.$verseFeatures = {
  Palette: palette.name,
  "Light Color": colourToName(lightColor),
};

// features approach 2
window.$verseFeatures["Ambient Color"] = colourToName(ambientLightColor);

const objects = [];
let eyeZ;

const spheres = [];
for (let i = 0; i < 10; i++) {
  spheres.push([prng.randInt(-100, 100), prng.randInt(-100, 100)]);
}

function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

function setup() {
  createCanvas(600, 600, WEBGL);

  eyeZ = height / 2 / tan((30 * PI * prng.rand()) / 180); // The default distance the camera is away from the origin.

  objects.push(new IntersectPlane(1, 0, 0, -100, 0, 0)); // Left wall
  objects.push(new IntersectPlane(1, 0, 0, 100, 0, 0)); // Right wall
  objects.push(new IntersectPlane(0, 1, 0, 0, -100, 0)); // Bottom wall
  objects.push(new IntersectPlane(0, 1, 0, 0, 100, 0)); // Top wall
  objects.push(new IntersectPlane(0, 0, 1, 0, 0, 0)); // Back wall

  noStroke();
  ambientMaterial(250);
}

function draw() {
  background(0);

  // Lights
  pointLight(lightColor.r, lightColor.g, lightColor.b, 0, 0, 400);
  ambientLight(ambientLightColor.r, ambientLightColor.g, ambientLightColor.b);

  // Left wall
  push();
  translate(-100, 0, 200);
  rotateY((90 * PI) / 180);
  plane(400, 200);
  pop();

  // Right wall
  push();
  translate(100, 0, 200);
  rotateY((90 * PI) / 180);
  plane(400, 200);
  pop();

  // Bottom wall
  push();
  translate(0, 100, 200);
  rotateX((90 * PI) / 180);
  plane(200, 400);
  pop();

  // Top wall
  push();
  translate(0, -100, 200);
  rotateX((90 * PI) / 180);
  plane(200, 400);
  pop();

  plane(200, 200); // Back wall

  for (let i = 0; i < spheres.length; i++) {
    push();
    translate(spheres[i][0], spheres[i][1], 200);
    fill(lightColor.r, lightColor.g, lightColor.b);
    sphere(5);
    pop();
  }

  const x = mouseX - width / 2;
  const y = mouseY - height / 2;

  const Q = createVector(0, 0, eyeZ); // A point on the ray and the default position of the camera.
  const v = createVector(x, y, -eyeZ); // The direction vector of the ray.

  let intersect; // The point of intersection between the ray and a plane.
  let closestLambda = eyeZ * 10; // The draw distance.

  for (let x = 0; x < objects.length; x += 1) {
    let object = objects[x];
    let lambda = object.getLambda(Q, v); // The value of lambda where the ray intersects the object

    if (lambda < closestLambda && lambda > 0) {
      // Find the position of the intersection of the ray and the object.
      intersect = p5.Vector.add(Q, p5.Vector.mult(v, lambda));
      closestLambda = lambda;
    }
  }

  // Cursor
  push();
  translate(intersect);
  fill(pointerColor.r, pointerColor.g, pointerColor.b);
  sphere(10);
  pop();

  var canvas = document.querySelector("#defaultCanvas0");
  document.body.style.margin = "0";
  document.body.style.overflow = "hidden";
  canvas.style.position = "absolute";

  resize();

  function resize() {
    letterbox(canvas, [window.innerWidth, window.innerHeight]);
  }

  // resize and reposition canvas to form a letterbox view
  function letterbox(element, parent) {
    var aspect = element.width / element.height;
    var pwidth = parent[0];
    var pheight = parent[1];

    var width = pwidth;
    var height = Math.round(width / aspect);
    var y = Math.floor(pheight - height) / 2;

    element.style.top = y + "px";
    element.style.width = width + "px";
    element.style.height = height + "px";
  }

  capturePreview();
}

// Class for a plane that extends to infinity.
class IntersectPlane {
  constructor(n1, n2, n3, p1, p2, p3) {
    this.normal = createVector(n1, n2, n3); // The normal vector of the plane
    this.point = createVector(p1, p2, p3); // A point on the plane
    this.d = this.point.dot(this.normal);
  }

  getLambda(Q, v) {
    return (-this.d - this.normal.dot(Q)) / this.normal.dot(v);
  }
}
