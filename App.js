// src/App.js
import React, { useState, useRef, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  FirstPersonControls,
  Grid,
  TransformControls,
} from "@react-three/drei";
import * as THREE from "three";

/* Helper: Returns an interior camera position based on the door wall */
function getInsidePosition(doorWall, roomWidth, roomLength, roomHeight) {
  const offset = 1;
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

/* Camera Transition Component for orbit mode */
function CameraTransition({ targetPosition }) {
  const { camera } = useThree();
  useFrame(() => {
    camera.position.lerp(new THREE.Vector3(...targetPosition), 0.05);
  });
  return null;
}

/* Camera Controller Component */
function CameraController({ navMode, target }) {
  const { camera } = useThree();
  useEffect(() => {
    if (navMode === "walk") {
      camera.position.set(...target);
    }
  }, [target, navMode, camera]);
  return navMode === "orbit" ? <CameraTransition targetPosition={target} /> : null;
}

/* Floor Component with shadows enabled */
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
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow // Make floor receive shadows
      >
        <planeGeometry args={[width, length]} />
        <meshStandardMaterial color={floorColor} />
      </mesh>
    </group>
  );
}

/* Ceiling Component */
function Ceiling({ roomWidth, roomLength, roomHeight, ceilingColor, thickness = 0.2 }) {
  return (
    <mesh
      position={[0, roomHeight + thickness / 2, 0]}
      receiveShadow
    >
      <boxGeometry args={[roomWidth, thickness, roomLength]} />
      <meshStandardMaterial color={ceilingColor} />
    </mesh>
  );
}

/* Door Component with shadows */
function Door({ doorWidth, doorHeight, onToggle, color, ...props }) {
  const [open, setOpen] = useState(false);
  const doorRef = useRef();
  const closedAngle = 0;
  const openAngle = -Math.PI / 2;
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
      <mesh
        ref={doorRef}
        position={[doorWidth / 2, doorHeight / 2, 0]}
        castShadow // Door casts shadow
        receiveShadow
      >
        <boxGeometry args={[doorWidth, doorHeight, 0.1]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}

/* Window Component */
function Window({ windowWidth, windowHeight, color, ...props }) {
  return (
    <mesh
      {...props}
      receiveShadow
    >
      <planeGeometry args={[windowWidth, windowHeight]} />
      <meshStandardMaterial
        color={color}
        transparent
        opacity={0.6}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/* Walls Component with Door, Window, and shadows */
function Walls({ width, length, height, color, doorWall, windowWall, onDoorToggle, doorColor, windowColor, doorOffset = 0, windowOffset = 0 }) {
  const doorWidthFB = width * 0.3;
  const doorHeight = height * 0.7;
  const windowWidthFB = width * 0.3;
  const windowHeight = height * 0.5;
  const doorWidthSide = length * 0.3;
  const windowWidthSide = length * 0.3;
  return (
    <group>
      {/* Front Wall */}
      <mesh
        position={[0, height / 2, length / 2]}
        rotation={[0, Math.PI, 0]}
        receiveShadow
      >
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color={color} side={THREE.DoubleSide} />
      </mesh>
      {doorWall === "front" && (
        <Door
          doorWidth={doorWidthFB}
          doorHeight={doorHeight}
          onToggle={onDoorToggle}
          color={doorColor}
          position={[-doorWidthFB / 2 + doorOffset, 0, length / 2 + 0.1]}
        />
      )}
      {windowWall === "front" && (
        <Window
          windowWidth={windowWidthFB}
          windowHeight={windowHeight}
          color={windowColor}
          position={[-windowWidthFB / 2 + windowOffset, 1, length / 2 + 0.1]}
        />
      )}
      {/* Back Wall */}
      <mesh position={[0, height / 2, -length / 2]} receiveShadow>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color={color} side={THREE.DoubleSide} />
      </mesh>
      {doorWall === "back" && (
        <Door
          doorWidth={doorWidthFB}
          doorHeight={doorHeight}
          onToggle={onDoorToggle}
          color={doorColor}
          position={[-doorWidthFB / 2 + doorOffset, 0, -length / 2 - 0.1]}
          rotation={[0, Math.PI, 0]}
        />
      )}
      {windowWall === "back" && (
        <Window
          windowWidth={windowWidthFB}
          windowHeight={windowHeight}
          color={windowColor}
          position={[-windowWidthFB / 2 + windowOffset, 1, -length / 2 - 0.1]}
        />
      )}
      {/* Left Wall */}
      <mesh
        position={[-width / 2, height / 2, 0]}
        rotation={[0, Math.PI / 2, 0]}
        receiveShadow
      >
        <planeGeometry args={[length, height]} />
        <meshStandardMaterial color={color} side={THREE.DoubleSide} />
      </mesh>
      {doorWall === "left" && (
        <group
          position={[-width / 2, height / 2, 0]}
          rotation={[0, Math.PI / 2, 0]}
        >
          <Door
            doorWidth={doorWidthSide}
            doorHeight={doorHeight}
            onToggle={onDoorToggle}
            color={doorColor}
            position={[-doorWidthSide / 2 + doorOffset, 0, 0.1]}
          />
        </group>
      )}
      {windowWall === "left" && (
        <group
          position={[-width / 2, height / 2, 0]}
          rotation={[0, Math.PI / 2, 0]}
        >
          <Window
            windowWidth={windowWidthSide}
            windowHeight={windowHeight}
            color={windowColor}
            position={[-windowWidthSide / 2 + windowOffset, 1, 0.1]}
          />
        </group>
      )}
      {/* Right Wall */}
      <mesh
        position={[width / 2, height / 2, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        receiveShadow
      >
        <planeGeometry args={[length, height]} />
        <meshStandardMaterial color={color} side={THREE.DoubleSide} />
      </mesh>
      {doorWall === "right" && (
        <group
          position={[width / 2, height / 2, 0]}
          rotation={[0, -Math.PI / 2, 0]}
        >
          <Door
            doorWidth={doorWidthSide}
            doorHeight={doorHeight}
            onToggle={onDoorToggle}
            color={doorColor}
            position={[-doorWidthSide / 2 + doorOffset, 0, 0.1]}
          />
        </group>
      )}
      {windowWall === "right" && (
        <group
          position={[width / 2, height / 2, 0]}
          rotation={[0, -Math.PI / 2, 0]}
        >
          <Window
            windowWidth={windowWidthSide}
            windowHeight={windowHeight}
            color={windowColor}
            position={[-windowWidthSide / 2 + windowOffset, 1, 0.1]}
          />
        </group>
      )}
      {/* Roof */}
      <mesh position={[0, height, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[width, length]} />
        <meshStandardMaterial color={color} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/* ----- Furniture Components with Shadows ----- */
function Chair({ color }) {
  return (
    <group>
      <mesh position={[0, 1, 0]} castShadow receiveShadow>
        <boxGeometry args={[2, 0.3, 2]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[-0.8, 0.5, -0.8]} castShadow>
        <boxGeometry args={[0.3, 1, 0.3]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0.8, 0.5, -0.8]} castShadow>
        <boxGeometry args={[0.3, 1, 0.3]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[-0.8, 0.5, 0.8]} castShadow>
        <boxGeometry args={[0.3, 1, 0.3]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0.8, 0.5, 0.8]} castShadow>
        <boxGeometry args={[0.3, 1, 0.3]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}

function Table({ color }) {
  return (
    <group>
      <mesh position={[0, 1, 0]} castShadow receiveShadow>
        <boxGeometry args={[4, 0.3, 2]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[-1.7, 0.5, -0.8]} castShadow>
        <boxGeometry args={[0.3, 1, 0.3]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[1.7, 0.5, -0.8]} castShadow>
        <boxGeometry args={[0.3, 1, 0.3]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[-1.7, 0.5, 0.8]} castShadow>
        <boxGeometry args={[0.3, 1, 0.3]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[1.7, 0.5, 0.8]} castShadow>
        <boxGeometry args={[0.3, 1, 0.3]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}

function Bed({ color }) {
  return (
    <group>
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[3, 1, 6]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[1.2, 1, 1.5]} castShadow>
        <boxGeometry args={[1, 0.5, 1.5]} />
        <meshStandardMaterial color={"#ffffff"} />
      </mesh>
    </group>
  );
}

function Cupboard({ color }) {
  return (
    <group>
      <mesh position={[0, 1.25, 0]} castShadow>
        <boxGeometry args={[2, 2.5, 1]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}

function MirrorTable({ color }) {
  return (
    <group>
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[1.5, 0.2, 1]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}

function BedsideTable({ color }) {
  return (
    <group>
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}

function Sofa({ color }) {
  return (
    <group>
      <mesh position={[0, 0.75, 0]} castShadow>
        <boxGeometry args={[3, 1.5, 1]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 1.5, -0.4]} castShadow>
        <boxGeometry args={[3, 0.5, 0.8]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}

function TvTable({ color }) {
  return (
    <group>
      <mesh position={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[2, 0.3, 1]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.15, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.5, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}

/* Editable Furniture Wrapper using TransformControls */
function Furniture({ item, onUpdate }) {
  const ref = useRef();
  return (
    <TransformControls
      onDragEnd={() => {
        if (ref.current) {
          onUpdate(item.id, ref.current.position.toArray());
        }
      }}
    >
      <group ref={ref} position={item.position}>
        {item.type === "Chair" && <Chair color={item.color} />}
        {item.type === "Table" && <Table color={item.color} />}
        {item.type === "Bed" && <Bed color={item.color} />}
        {item.type === "Cupboard" && <Cupboard color={item.color} />}
        {item.type === "MirrorTable" && <MirrorTable color={item.color} />}
        {item.type === "BedsideTable" && <BedsideTable color={item.color} />}
        {item.type === "Sofa" && <Sofa color={item.color} />}
        {item.type === "TvTable" && <TvTable color={item.color} />}
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

  // Lights on/off state
  const [lightsOn, setLightsOn] = useState(true);

  // Door state handler
  const handleDoorToggle = (isOpen) => {
    console.log("Door is now", isOpen ? "open" : "closed");
  };

  // Handlers to move camera inside/outside the room
  const handleGoInside = () => {
    const insidePos = getInsidePosition(doorWall, roomWidth, roomLength, roomHeight);
    setCameraTarget(insidePos);
  };
  const handleExitRoom = () => {
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
      position: [Number(furniturePosX), Number(furniturePosY), Number(furniturePosZ)],
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
          boxShadow: "0 0 10px rgba(0,0,0,0.5)",
        }}
      >
        <h1 style={{ color: "#333", margin: 0 }}>3D House Designer</h1>
      </nav>

      <div style={{ display: "flex", flexDirection: "row", height: "calc(100vh - 50px)" }}>
        {/* 3D Scene */}
        <div style={{ flex: 5, borderRight: "1px solid #ddd" }}>
          <Canvas shadows camera={{ position: cameraTarget }}>
            {navMode === "orbit" ? (
              <OrbitControls enablePan enableZoom enableRotate />
            ) : (
              <FirstPersonControls movementSpeed={5} lookSpeed={0.1} />
            )}
            <CameraController navMode={navMode} target={cameraTarget} />
            {lightsOn && (
              <>
                <ambientLight intensity={0.8} castShadow />
                <directionalLight
                  castShadow
                  position={[10, 10, 5]}
                  intensity={1.5}
                  shadow-mapSize-width={1024}
                  shadow-mapSize-height={1024}
                  shadow-camera-left={-10}
                  shadow-camera-right={10}
                  shadow-camera-top={10}
                  shadow-camera-bottom={-10}
                />
              </>
            )}
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
            overflowY: "auto",
          }}
        >
          {/* Room Properties Section */}
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
          <button
            onClick={() => console.log("Update Room")}
            style={{
              display: "block",
              width: "100%",
              padding: "10px",
              background: "linear-gradient(to right, #7F00FF, #E100FF)",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
              marginBottom: "20px",
            }}
          >
            Update Room
          </button>

          {/* Windows / Door Section */}
          <h2 style={{ fontSize: "20px", margin: "10px 0" }}>
            Door / Window Settings
          </h2>
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

          {/* Navigation Section */}
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

          {/* Light Settings Section */}
          <h2 style={{ fontSize: "20px", margin: "10px 0" }}>Light Settings</h2>
          <button
            onClick={() => setLightsOn(!lightsOn)}
            style={{
              display: "block",
              width: "100%",
              padding: "10px",
              backgroundColor: lightsOn ? "#d32f2f" : "#388e3c",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
              marginBottom: "20px",
            }}
          >
            {lightsOn ? "Turn Lights Off" : "Turn Lights On"}
          </button>

          {/* Furniture Details Section */}
          <h2 style={{ fontSize: "20px", margin: "10px 0" }}>Furniture Details</h2>
          <div>
            <label>Type: </label>
            <select value={furnitureType} onChange={(e) => setFurnitureType(e.target.value)}>
              <option value="Chair">Chair</option>
              <option value="Table">Table</option>
              <option value="Bed">Bed</option>
              <option value="Cupboard">Cupboard</option>
              <option value="MirrorTable">Mirror Table</option>
              <option value="BedsideTable">Bedside Table</option>
              <option value="Sofa">Sofa</option>
              <option value="TvTable">TV Table</option>
              <option value="Cabinet">Cabinet</option>
              <option value="Wardrobe">Wardrobe</option>
              <option value="Rack">Rack</option>
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
          <button
            onClick={addFurniture}
            style={{
              width: "100%",
              marginTop: "10px",
              padding: "10px",
              backgroundColor: "#673ab7",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Add Furniture
          </button>
        </div>
      </div>
    </div>
  );
}

/* ----- CameraController and CameraTransition declared above ----- */
