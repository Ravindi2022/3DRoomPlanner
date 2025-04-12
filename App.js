// src/App.js
import React, { useState, useRef, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  FirstPersonControls,
  Grid,
  TransformControls
} from "@react-three/drei";
import * as THREE from "three";

/* Helper: Returns an interior camera position based on the door wall */
function getInsidePosition(doorWall, roomWidth, roomLength, roomHeight) {
  const offset = 1; // how far inside from the wall
  switch (doorWall) {
    case "front":
      return [0, roomHeight / 2, roomLength / 2 - offset];
    case "back":
      return [0, roomHeight / 2, -roomLength / 2 + offset];
    case "left":
      return [-roomWidth / 2 + offset, roomHeight / 2, 0];
    case "right":
      return [roomWidth / 2 - offset, roomHeight / 2, 0];
    default:
      return [0, roomHeight / 2, 0];
  }
}

/* Smooth camera transition for Orbit mode */
function CameraTransition({ targetPosition }) {
  const { camera } = useThree();
  useFrame(() => {
    camera.position.lerp(new THREE.Vector3(...targetPosition), 0.05);
  });
  return null;
}

/* CameraController:
   - In orbit mode, uses CameraTransition to smoothly move the camera.
   - In walk mode, immediately sets the camera position.
*/
function CameraController({ navMode, target }) {
  const { camera } = useThree();
  useEffect(() => {
    if (navMode === "walk") {
      camera.position.set(...target);
    }
  }, [target, navMode, camera]);
  return navMode === "orbit" ? <CameraTransition targetPosition={target} /> : null;
}

/* Floor Component:
   - Renders a grid and a floor plane whose color is customizable.
*/
function Floor({ width, length, floorColor }) {
  return (
    <group>
      <Grid
        position={[0, 0.01, 0]}
        args={[width, length]}
        cellSize={1}
        cellThickness={1}
        sectionSize={width}
        sectionThickness={1}
        fadeDistance={100}
        fadeStrength={1}
        infiniteGrid={false}
      />
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, length]} />
        <meshStandardMaterial color={floorColor} />
      </mesh>
    </group>
  );
}

/* Ceiling Component:
   - Uses box geometry to create a ceiling (roof) with a visible thickness.
   - The bottom of the ceiling is flush with the top of the walls.
*/
function Ceiling({ roomWidth, roomLength, roomHeight, ceilingColor, thickness = 0.2 }) {
  return (
    <mesh position={[0, roomHeight + thickness / 2, 0]}>
      <boxGeometry args={[roomWidth, thickness, roomLength]} />
      <meshStandardMaterial color={ceilingColor} />
    </mesh>
  );
}

/* Door Component:
   - Renders a door with its left side acting as the hinge.
   - Clicking toggles its open/closed state.
   - Uses the provided doorColor.
*/
function Door({ doorWidth, doorHeight, onToggle, color, ...props }) {
  const [open, setOpen] = useState(false);
  const doorRef = useRef();
  const closedAngle = 0;
  const openAngle = -Math.PI / 2; // 90° open

  useFrame(() => {
    if (doorRef.current) {
      doorRef.current.rotation.y = THREE.MathUtils.lerp(
        doorRef.current.rotation.y,
        open ? openAngle : closedAngle,
        0.1
      );
    }
  });

  const handleClick = (e) => {
    e.stopPropagation();
    setOpen(!open);
    if (onToggle) onToggle(!open);
  };

  return (
    <group {...props} onClick={handleClick}>
      {/* Shift the door so its left edge aligns with the hinge */}
      <mesh ref={doorRef} position={[doorWidth / 2, doorHeight / 2, 0]}>
        <boxGeometry args={[doorWidth, doorHeight, 0.1]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}

/* Window Component:
   - Renders a simple window as a plane.
   - Uses a double-sided material for full visibility.
   - Uses the provided windowColor.
*/
function Window({ windowWidth, windowHeight, color, ...props }) {
  return (
    <mesh {...props}>
      <planeGeometry args={[windowWidth, windowHeight]} />
      <meshStandardMaterial color={color} transparent opacity={0.6} side={THREE.DoubleSide} />
    </mesh>
  );
}

/* Walls Component:
   - Renders all four walls.
   - Conditionally places a Door and/or Window on selected walls.
   - Accepts doorOffset and windowOffset (in meters) to adjust horizontal placement.
*/
function Walls({
  width,
  length,
  height,
  color,
  doorWall,
  windowWall,
  onDoorToggle,
  doorColor,
  windowColor,
  doorOffset = 0,
  windowOffset = 0
}) {
  // For front/back walls, horizontal dimension is roomWidth.
  const doorWidthFB = width * 0.3;
  const doorHeight = height * 0.7;
  const windowWidthFB = width * 0.3;
  const windowHeight = height * 0.5;

  // For left/right walls, horizontal dimension is roomLength.
  const doorWidthSide = length * 0.3;
  const windowWidthSide = length * 0.3;
  const windowZOffset = 0.1; // increased offset for visibility

  return (
    <group>
      {/* Front Wall */}
      <mesh position={[0, height / 2, length / 2]}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color={color} side={THREE.DoubleSide} />
      </mesh>
      {doorWall === "front" && (
        <Door
          doorWidth={doorWidthFB}
          doorHeight={doorHeight}
          onToggle={onDoorToggle}
          color={doorColor}
          position={[-doorWidthFB / 2 + doorOffset, 0, length / 2 + windowZOffset]}
        />
      )}
      {windowWall === "front" && (
        <Window
          windowWidth={windowWidthFB}
          windowHeight={windowHeight}
          color={windowColor}
          position={[-windowWidthFB / 2 + windowOffset, 1, length / 2 + windowZOffset]}
        />
      )}

      {/* Back Wall */}
      <mesh position={[0, height / 2, -length / 2]}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color={color} side={THREE.DoubleSide} />
      </mesh>
      {doorWall === "back" && (
        <Door
          doorWidth={doorWidthFB}
          doorHeight={doorHeight}
          onToggle={onDoorToggle}
          color={doorColor}
          position={[-doorWidthFB / 2 + doorOffset, 0, -length / 2 - windowZOffset]}
          rotation={[0, Math.PI, 0]}
        />
      )}
      {windowWall === "back" && (
        <Window
          windowWidth={windowWidthFB}
          windowHeight={windowHeight}
          color={windowColor}
          position={[-windowWidthFB / 2 + windowOffset, 1, -length / 2 - windowZOffset]}
        />
      )}

      {/* Left Wall */}
      <mesh position={[-width / 2, height / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[length, height]} />
        <meshStandardMaterial color={color} side={THREE.DoubleSide} />
      </mesh>
      {doorWall === "left" && (
        <group position={[-width / 2, height / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
          <Door
            doorWidth={doorWidthSide}
            doorHeight={doorHeight}
            onToggle={onDoorToggle}
            color={doorColor}
            position={[-doorWidthSide / 2 + doorOffset, 0, windowZOffset]}
          />
        </group>
      )}
      {windowWall === "left" && (
        <group position={[-width / 2, height / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
          <Window
            windowWidth={windowWidthSide}
            windowHeight={windowHeight}
            color={windowColor}
            position={[-windowWidthSide / 2 + windowOffset, 1, windowZOffset]}
          />
        </group>
      )}

      {/* Right Wall */}
      <mesh position={[width / 2, height / 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[length, height]} />
        <meshStandardMaterial color={color} side={THREE.DoubleSide} />
      </mesh>
      {doorWall === "right" && (
        <group position={[width / 2, height / 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <Door
            doorWidth={doorWidthSide}
            doorHeight={doorHeight}
            onToggle={onDoorToggle}
            color={doorColor}
            position={[-doorWidthSide / 2 + doorOffset, 0, windowZOffset]}
          />
        </group>
      )}
      {windowWall === "right" && (
        <group position={[width / 2, height / 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <Window
            windowWidth={windowWidthSide}
            windowHeight={windowHeight}
            color={windowColor}
            position={[-windowWidthSide / 2 + windowOffset, 1, windowZOffset]}
          />
        </group>
      )}
    </group>
  );
}

/* ----- Furniture Components ----- */

/* Chair Component */
function Chair({ color }) {
  return (
    <group>
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[2, 0.3, 2]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[-0.8, 0.5, -0.8]}>
        <boxGeometry args={[0.3, 1, 0.3]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0.8, 0.5, -0.8]}>
        <boxGeometry args={[0.3, 1, 0.3]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[-0.8, 0.5, 0.8]}>
        <boxGeometry args={[0.3, 1, 0.3]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0.8, 0.5, 0.8]}>
        <boxGeometry args={[0.3, 1, 0.3]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}

/* Table Component */
function Table({ color }) {
  return (
    <group>
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[4, 0.3, 2]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[-1.7, 0.5, -0.8]}>
        <boxGeometry args={[0.3, 1, 0.3]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[1.7, 0.5, -0.8]}>
        <boxGeometry args={[0.3, 1, 0.3]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[-1.7, 0.5, 0.8]}>
        <boxGeometry args={[0.3, 1, 0.3]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[1.7, 0.5, 0.8]}>
        <boxGeometry args={[0.3, 1, 0.3]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}

/* Bed Component */
function Bed({ color }) {
  return (
    <group>
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[3, 1, 6]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[1.2, 1, 1.5]}>
        <boxGeometry args={[1, 0.5, 1.5]} />
        <meshStandardMaterial color={"#ffffff"} />
      </mesh>
    </group>
  );
}

/* Sofa Component */
function Sofa({ color }) {
  return (
    <group>
      <mesh position={[0, 0.75, 0]}>
        <boxGeometry args={[3, 1.5, 1]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 1.5, -0.4]}>
        <boxGeometry args={[3, 0.5, 0.8]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}

/* Cabinet Component */
function Cabinet({ color }) {
  return (
    <group>
      {/* Simple cabinet representation */}
      <mesh position={[0, 1.25, 0]}>
        <boxGeometry args={[1.5, 2.5, 0.8]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}

/* Wardrobes Component */
function Wardrobes({ color }) {
  return (
    <group>
      {/* Simple wardrobes representation */}
      <mesh position={[0, 1.5, 0]}>
        <boxGeometry args={[2, 3, 1]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}

/* Rack Component */
function Rack({ color }) {
  return (
    <group>
      {/* Simple rack (shelf) representation */}
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[2, 0.3, 1]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}

/* Editable Furniture Wrapper using TransformControls */
function Furniture({ item, onUpdate }) {
  const ref = useRef();

  const renderFurnitureComponent = () => {
    switch (item.type) {
      case "Sofa":
        return <Sofa color={item.color} />;
      case "Table":
        return <Table color={item.color} />;
      case "Cabinet":
        return <Cabinet color={item.color} />;
      case "Bed":
        return <Bed color={item.color} />;
      case "Wardrobes":
        return <Wardrobes color={item.color} />;
      case "Rack":
        return <Rack color={item.color} />;
      case "Chair":
        return <Chair color={item.color} />;
      default:
        return null;
    }
  };

  return (
    <TransformControls
      onDragEnd={() => {
        if (ref.current) {
          onUpdate(item.id, ref.current.position.toArray());
        }
      }}
    >
      <group ref={ref} position={item.position}>
        {renderFurnitureComponent()}
      </group>
    </TransformControls>
  );
}

/* ----- Main App Component ----- */
export default function App() {
  // Room dimensions & appearance
  const [roomWidth, setRoomWidth] = useState(8);
  const [roomLength, setRoomLength] = useState(8);
  const [roomHeight, setRoomHeight] = useState(4);
  const [wallColor, setWallColor] = useState("#ffffff");
  const [floorColor, setFloorColor] = useState("#cccccc");
  const [ceilingColor, setCeilingColor] = useState("#eeeeee");

  // Door and Window colors
  const [doorColor, setDoorColor] = useState("#654321");
  const [windowColor, setWindowColor] = useState("#ADD8E6");

  // Offsets for door and window positions on a wall (in meters)
  const [doorOffset, setDoorOffset] = useState(0);
  const [windowOffset, setWindowOffset] = useState(0);

  // Which walls get the door and window
  const [doorWall, setDoorWall] = useState("front");
  const [windowWall, setWindowWall] = useState("back");

  // Navigation mode: "orbit" or "walk"
  const [navMode, setNavMode] = useState("orbit");

  // Camera target for smooth transitions
  const externalCam = [0, 5, 10];
  const [cameraTarget, setCameraTarget] = useState(externalCam);

  // isInside state: true when user has entered the room
  const [isInside, setIsInside] = useState(false);

  // Door state handler (for additional logic)
  const handleDoorToggle = (isOpen) => {
    console.log("Door is now", isOpen ? "open" : "closed");
  };

  // Handlers to move camera inside/outside the room
  const handleGoInside = () => {
    setIsInside(true);
    const insidePos = getInsidePosition(doorWall, roomWidth, roomLength, roomHeight);
    setCameraTarget(insidePos);
  };
  const handleExitRoom = () => {
    setIsInside(false);
    setCameraTarget(externalCam);
  };

  // Furniture state and adding/updating
  const [furnitureType, setFurnitureType] = useState("Chair");
  const [furnitureColor, setFurnitureColor] = useState("#8b4513");
  const [furniturePosX, setFurniturePosX] = useState(0);
  const [furniturePosY, setFurniturePosY] = useState(0);
  const [furniturePosZ, setFurniturePosZ] = useState(0);
  const [furnitureItems, setFurnitureItems] = useState([]);

  const addFurniture = () => {
    const newItem = {
      id: Date.now(),
      type: furnitureType,
      color: furnitureColor,
      position: [Number(furniturePosX), Number(furniturePosY), Number(furniturePosZ)]
    };
    setFurnitureItems([...furnitureItems, newItem]);
  };

  const updateFurniture = (id, newPos) => {
    setFurnitureItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, position: newPos } : item))
    );
  };

  return (
    <div style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      {/* Top Navbar */}
      <nav
        style={{
          height: "50px",
          backgroundColor: "#E69DB8",
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
          boxShadow: "0 0 10px rgba(0,0,0,0.5)"
        }}
      >
        <h1 style={{ color: "#333", margin: 0 }}>3D House Designer</h1>
      </nav>

      <div style={{ display: "flex", flexDirection: "row", height: "calc(100vh - 50px)" }}>
        {/* 3D Scene */}
        <div style={{ flex: 5, borderRight: "1px solid #ddd" }}>
          <Canvas camera={{ position: cameraTarget }}>
            {navMode === "orbit" ? (
              <OrbitControls enablePan enableZoom enableRotate />
            ) : (
              <FirstPersonControls movementSpeed={5} lookSpeed={0.1} />
            )}
            <CameraController navMode={navMode} target={cameraTarget} />
            <ambientLight intensity={0.8} />
            <directionalLight position={[10, 10, 5]} intensity={1.5} />
            <Grid args={[100, 100]} position={[0, -0.01, 0]} />
            <Floor width={roomWidth} length={roomLength} floorColor={floorColor} />
            <Ceiling
              roomWidth={roomWidth}
              roomLength={roomLength}
              roomHeight={roomHeight}
              ceilingColor={ceilingColor}
            />
            <Walls
              width={roomWidth}
              length={roomLength}
              height={roomHeight}
              color={wallColor}
              doorWall={doorWall}
              windowWall={windowWall}
              onDoorToggle={handleDoorToggle}
              doorColor={doorColor}
              windowColor={windowColor}
              doorOffset={doorOffset}
              windowOffset={windowOffset}
            />
            {furnitureItems.map((item) => (
              <Furniture key={item.id} item={item} onUpdate={updateFurniture} />
            ))}
          </Canvas>
        </div>

        {/* Sidebar Panel */}
        <div
          style={{
            width: "300px",
            padding: "10px",
            backgroundColor: "#fff",
            fontFamily: "Helvetica, sans-serif",
            overflowY: "auto"
          }}
        >
          <h2 style={{ fontSize: "20px", margin: "10px 0" }}>Room Properties</h2>
          <div>
            <label>Width (m): </label>
            <input
              type="number"
              value={roomWidth}
              onChange={(e) => setRoomWidth(Number(e.target.value))}
              style={{ width: "50%" }}
            />
          </div>
          <div>
            <label>Length (m): </label>
            <input
              type="number"
              value={roomLength}
              onChange={(e) => setRoomLength(Number(e.target.value))}
              style={{ width: "50%" }}
            />
          </div>
          <div>
            <label>Height (m): </label>
            <input
              type="number"
              value={roomHeight}
              onChange={(e) => setRoomHeight(Number(e.target.value))}
              style={{ width: "50%" }}
            />
          </div>
          <div>
            <label>Wall Color: </label>
            <input
              type="color"
              value={wallColor}
              onChange={(e) => setWallColor(e.target.value)}
              style={{ width: "50%" }}
            />
          </div>
          <div>
            <label>Floor Color: </label>
            <input
              type="color"
              value={floorColor}
              onChange={(e) => setFloorColor(e.target.value)}
              style={{ width: "50%" }}
            />
          </div>
          <div>
            <label>Ceiling Color: </label>
            <input
              type="color"
              value={ceilingColor}
              onChange={(e) => setCeilingColor(e.target.value)}
              style={{ width: "50%" }}
            />
          </div>

          <h2 style={{ fontSize: "20px", margin: "10px 0" }}>Door / Window Settings</h2>
          <div>
            <label>Door Wall: </label>
            <select value={doorWall} onChange={(e) => setDoorWall(e.target.value)}>
              <option value="front">Front</option>
              <option value="back">Back</option>
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
          </div>
          <div>
            <label>Window Wall: </label>
            <select value={windowWall} onChange={(e) => setWindowWall(e.target.value)}>
              <option value="front">Front</option>
              <option value="back">Back</option>
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
          </div>
          <div>
            <label>Door Offset (m): </label>
            <input
              type="number"
              value={doorOffset}
              onChange={(e) => setDoorOffset(Number(e.target.value))}
              style={{ width: "50%" }}
            />
          </div>
          <div>
            <label>Window Offset (m): </label>
            <input
              type="number"
              value={windowOffset}
              onChange={(e) => setWindowOffset(Number(e.target.value))}
              style={{ width: "50%" }}
            />
          </div>
          <div>
            <label>Door Color: </label>
            <input
              type="color"
              value={doorColor}
              onChange={(e) => setDoorColor(e.target.value)}
              style={{ width: "50%" }}
            />
          </div>
          <div>
            <label>Window Color: </label>
            <input
              type="color"
              value={windowColor}
              onChange={(e) => setWindowColor(e.target.value)}
              style={{ width: "50%" }}
            />
          </div>

          <h2 style={{ fontSize: "20px", margin: "10px 0" }}>Navigation</h2>
          <div>
            <label>Mode: </label>
            <select value={navMode} onChange={(e) => setNavMode(e.target.value)}>
              <option value="orbit">Orbit</option>
              <option value="walk">Walk</option>
            </select>
          </div>
          {navMode === "orbit" && (
            <div>
              <button onClick={handleGoInside} style={{ width: "100%", marginTop: "10px" }}>
                Go Inside
              </button>
              <button onClick={handleExitRoom} style={{ width: "100%", marginTop: "10px" }}>
                Exit Room
              </button>
            </div>
          )}

          {/* Display Furniture Details only after entering the room */}
          {isInside && (
            <>
              <h2 style={{ fontSize: "20px", margin: "10px 0" }}>Furniture Details</h2>
              <div>
                <label>Type: </label>
                <select value={furnitureType} onChange={(e) => setFurnitureType(e.target.value)}>
                  {/* Sidebar options: Sofa, Table, Cabinet, Bed, Wardrobes, Rack, Chair */}
                  <option value="Sofa">Sofa</option>
                  <option value="Table">Table</option>
                  <option value="Cabinet">Cabinet</option>
                  <option value="Bed">Bed</option>
                  <option value="Wardrobes">Wardrobes</option>
                  <option value="Rack">Rack</option>
                  <option value="Chair">Chair</option>
                </select>
              </div>
              <div>
                <label>Color: </label>
                <input
                  type="color"
                  value={furnitureColor}
                  onChange={(e) => setFurnitureColor(e.target.value)}
                  style={{ width: "50%" }}
                />
              </div>
              <div>
                <label>Pos X (m): </label>
                <input
                  type="number"
                  value={furniturePosX}
                  onChange={(e) => setFurniturePosX(e.target.value)}
                  style={{ width: "50%" }}
                />
              </div>
              <div>
                <label>Pos Y (m): </label>
                <input
                  type="number"
                  value={furniturePosY}
                  onChange={(e) => setFurniturePosY(e.target.value)}
                  style={{ width: "50%" }}
                />
              </div>
              <div>
                <label>Pos Z (m): </label>
                <input
                  type="number"
                  value={furniturePosZ}
                  onChange={(e) => setFurniturePosZ(e.target.value)}
                  style={{ width: "50%" }}
                />
              </div>
              <button onClick={addFurniture} style={{ width: "100%", marginTop: "10px" }}>
                Add Furniture
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
