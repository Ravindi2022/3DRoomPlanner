// src/App.js
import React, { useState, useRef, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  FirstPersonControls,
  Grid,
  TransformControls,
  Environment
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

/* Smooth camera transition for Orbit mode */
function CameraTransition({ targetPosition }) {
  const { camera } = useThree();
  useFrame(() => {
    camera.position.lerp(new THREE.Vector3(...targetPosition), 0.05);
  });
  return null;
}

/* CameraController Component */
function CameraController({ navMode, target }) {
  const { camera } = useThree();
  useEffect(() => {
    if (navMode === "walk") {
      camera.position.set(...target);
    }
  }, [target, navMode, camera]);
  return navMode === "orbit" ? <CameraTransition targetPosition={target} /> : null;
}

/* Floor Component */
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
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[width, length]} />
        <meshStandardMaterial color={floorColor} />
      </mesh>
    </group>
  );
}

/* Ceiling Component */
function Ceiling({ roomWidth, roomLength, roomHeight, ceilingColor, thickness = 0.2 }) {
  return (
    <mesh position={[0, roomHeight + thickness / 2, 0]} receiveShadow>
      <boxGeometry args={[roomWidth, thickness, roomLength]} />
      <meshStandardMaterial color={ceilingColor} />
    </mesh>
  );
}

/* Door Component */
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
      <mesh ref={doorRef} position={[doorWidth / 2, doorHeight / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[doorWidth, doorHeight, 0.05]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}

/* Window Component */
function Window({ windowWidth, windowHeight, color, ...props }) {
  return (
    <mesh {...props} receiveShadow>
      <planeGeometry args={[windowWidth, windowHeight]} />
      <meshStandardMaterial color={color} transparent opacity={0.6} side={THREE.DoubleSide} />
    </mesh>
  );
}

/* Walls Component */
function Walls({
  width,
  length,
  height,
  frontColor,
  backColor,
  leftColor,
  rightColor,
  doorWall,
  windowWall,
  onDoorToggle,
  doorColor,
  windowColor,
  doorOffset = 0,
  doorWidth,
  doorHeight,
  windowOffset = 0,
  windowWidth,
  windowHeight,
  windowHeightFromFloor = 1
}) {
  const getDoorTransform = (wall) => {
    switch (wall) {
      case "front":
        return {
          position: [-doorWidth/2 + doorOffset, 0, length/2],
          rotation: [0, 0, 0]
        };
      case "back":
        return {
          position: [-doorWidth/2 + doorOffset, 0, -length/2],
          rotation: [0, Math.PI, 0]
        };
      case "left":
        return {
          position: [-width/2, 0, -doorWidth/2 + doorOffset],
          rotation: [0, Math.PI/2, 0]
        };
      case "right":
        return {
          position: [width/2, 0, -doorWidth/2 + doorOffset],
          rotation: [0, -Math.PI/2, 0]
        };
      default:
        return { position: [0, 0, 0], rotation: [0, 0, 0] };
    }
  };

  const getWindowPosition = (wall) => {
    switch (wall) {
      case "front":
        return [-windowWidth/2 + windowOffset, windowHeightFromFloor + windowHeight / 2, length/2 + 0.1];
      case "back":
        return [-windowWidth/2 + windowOffset, windowHeightFromFloor + windowHeight / 2, -length/2 - 0.1];
      case "left":
        return [-width/2 - 0.1, windowHeightFromFloor + windowHeight / 2, -windowWidth/2 + windowOffset];
      case "right":
        return [width/2 + 0.1, windowHeightFromFloor + windowHeight / 2, -windowWidth/2 + windowOffset];
      default:
        return [0, windowHeightFromFloor + windowHeight / 2, 0];
    }
  };

  return (
    <group>
      {/* Front Wall */}
      <mesh position={[0, height/2, length/2]} rotation={[0, Math.PI, 0]} receiveShadow>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color={frontColor} side={THREE.DoubleSide} />
      </mesh>
      {doorWall === "front" && (
        <Door
          doorWidth={doorWidth}
          doorHeight={doorHeight}
          onToggle={onDoorToggle}
          color={doorColor}
          position={getDoorTransform("front").position}
          rotation={getDoorTransform("front").rotation}
        />
      )}
      {windowWall === "front" && (
        <Window
          windowWidth={windowWidth}
          windowHeight={windowHeight}
          color={windowColor}
          position={getWindowPosition("front")}
        />
      )}
      {/* Back Wall */}
      <mesh position={[0, height/2, -length/2]} receiveShadow>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color={backColor} side={THREE.DoubleSide} />
      </mesh>
      {doorWall === "back" && (
        <Door
          doorWidth={doorWidth}
          doorHeight={doorHeight}
          onToggle={onDoorToggle}
          color={doorColor}
          position={getDoorTransform("back").position}
          rotation={getDoorTransform("back").rotation}
        />
      )}
      {windowWall === "back" && (
        <Window
          windowWidth={windowWidth}
          windowHeight={windowHeight}
          color={windowColor}
          position={getWindowPosition("back")}
          rotation={[0, Math.PI, 0]}
        />
      )}
      {/* Left Wall */}
      <mesh position={[-width/2, height/2, 0]} rotation={[0, Math.PI/2, 0]} receiveShadow>
        <planeGeometry args={[length, height]} />
        <meshStandardMaterial color={leftColor} side={THREE.DoubleSide} />
      </mesh>
      {doorWall === "left" && (
        <Door
          doorWidth={doorWidth}
          doorHeight={doorHeight}
          onToggle={onDoorToggle}
          color={doorColor}
          position={getDoorTransform("left").position}
          rotation={getDoorTransform("left").rotation}
        />
      )}
      {windowWall === "left" && (
        <Window
          windowWidth={windowWidth}
          windowHeight={windowHeight}
          color={windowColor}
          position={getWindowPosition("left")}
        />
      )}
      {/* Right Wall */}
      <mesh position={[width/2, height/2, 0]} rotation={[0, -Math.PI/2, 0]} receiveShadow>
        <planeGeometry args={[length, height]} />
        <meshStandardMaterial color={rightColor} side={THREE.DoubleSide} />
      </mesh>
      {doorWall === "right" && (
        <Door
          doorWidth={doorWidth}
          doorHeight={doorHeight}
          onToggle={onDoorToggle}
          color={doorColor}
          position={getDoorTransform("right").position}
          rotation={getDoorTransform("right").rotation}
        />
      )}
      {windowWall === "right" && (
        <Window
          windowWidth={windowWidth}
          windowHeight={windowHeight}
          color={windowColor}
          position={getWindowPosition("right")}
        />
      )}
      {/* Roof */}
      <mesh position={[0, height, 0]} rotation={[-Math.PI/2, 0, 0]} receiveShadow>
        <planeGeometry args={[width, length]} />
        <meshStandardMaterial color={frontColor} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/* Furniture Components (Chair, Table, Bed, etc.) */
// ... (unchanged) ...

/* Editable Furniture Wrapper */
function Furniture({ item, onUpdate, onDelete }) {
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
  const [frontWallColor, setFrontWallColor] = useState("#ffffff");
  const [backWallColor, setBackWallColor] = useState("#ffffff");
  const [leftWallColor, setLeftWallColor] = useState("#ffffff");
  const [rightWallColor, setRightWallColor] = useState("#ffffff");
  const [floorColor, setFloorColor] = useState("#cccccc");
  const [ceilingColor, setCeilingColor] = useState("#eeeeee");

  // Door customization state
  const [doorColor, setDoorColor] = useState("#654321");
  const [doorWidth, setDoorWidth] = useState(1.2);
  const [doorHeight, setDoorHeight] = useState(2.1);
  const [doorHorizontalOffset, setDoorHorizontalOffset] = useState(0);

  // Window customization state
  const [windowColor, setWindowColor] = useState("#ADD8E6");
  const [windowWidth, setWindowWidth] = useState(2);
  const [windowHeight, setWindowHeight] = useState(1.5);
  const [windowHeightFromFloor, setWindowHeightFromFloor] = useState(1);
  const [windowHorizontalOffset, setWindowHorizontalOffset] = useState(0);

  // Which walls get the door and window
  const [doorWall, setDoorWall] = useState("front");
  const [windowWall, setWindowWall] = useState("front");

  // Navigation mode & camera
  const [navMode, setNavMode] = useState("orbit");
  const externalCam = [0, 5, 10];
  const [cameraTarget, setCameraTarget] = useState(externalCam);

  // Lights & inside/outside toggles
  const [lightsOn, setLightsOn] = useState(true);
  const [isInside, setIsInside] = useState(false);

  // Sync window onto same wall & offset it next to the door
  useEffect(() => {
    // always keep window on the same wall
    setWindowWall(doorWall);

    // calculate horizontal offset so window sits right next to the door
    const gap = 0.1; // meters between door and window
    setWindowHorizontalOffset(
      doorHorizontalOffset + doorWidth / 2 + windowWidth / 2 + gap
    );
  }, [doorWall, doorWidth, windowWidth, doorHorizontalOffset]);

  // Door toggle handler
  const handleDoorToggle = (isOpen) => {
    console.log("Door is now", isOpen ? "open" : "closed");
  };

  // Go inside / exit
  const handleGoInside = () => {
    setIsInside(true);
    const insidePos = getInsidePosition(doorWall, roomWidth, roomLength, roomHeight);
    setCameraTarget(insidePos);
  };
  const handleExitRoom = () => {
    setIsInside(false);
    setCameraTarget(externalCam);
  };

  // Furniture state
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
    setFurnitureItems(prev =>
      prev.map(item => item.id === id ? { ...item, position: newPos } : item)
    );
  };
  const removeFurniture = (id) => {
    setFurnitureItems(items => items.filter(item => item.id !== id));
  };

  return (
    <div style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      {/* Navbar */}
      <nav style={{ height: "50px", backgroundColor: "#E69DB8", display: "flex", alignItems: "center", padding: "0 20px", boxShadow: "0 0 10px rgba(0,0,0,0.5)" }}>
        <h1 style={{ color: "#333", margin: 0 }}>3D House Designer</h1>
      </nav>

      <div style={{ display: "flex", height: "calc(100vh - 50px)" }}>
        {/* 3D Canvas */}
        <div style={{ flex: 5, borderRight: "1px solid #ddd" }}>
          <Canvas shadows camera={{ position: cameraTarget }}>
            {navMode === "orbit"
              ? <OrbitControls enablePan enableZoom enableRotate />
              : <FirstPersonControls movementSpeed={5} lookSpeed={0.1} />
            }
            <CameraController navMode={navMode} target={cameraTarget} />
            {lightsOn && <>
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
              <pointLight position={[0, 8, 0]} intensity={0.8} castShadow />
              <pointLight position={[0, 4, 8]} intensity={0.6} castShadow />
              <pointLight position={[8, 4, 0]} intensity={0.6} castShadow />
              <Environment preset="sunset" />
            </>}
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
              frontColor={frontWallColor}
              backColor={backWallColor}
              leftColor={leftWallColor}
              rightColor={rightWallColor}
              doorWall={doorWall}
              windowWall={windowWall}
              onDoorToggle={handleDoorToggle}
              doorColor={doorColor}
              windowColor={windowColor}
              doorOffset={doorHorizontalOffset}
              doorWidth={doorWidth}
              doorHeight={doorHeight}
              windowOffset={windowHorizontalOffset}
              windowWidth={windowWidth}
              windowHeight={windowHeight}
              windowHeightFromFloor={windowHeightFromFloor}
            />
            {furnitureItems.map(item =>
              <Furniture key={item.id} item={item} onUpdate={updateFurniture} onDelete={removeFurniture} />
            )}
          </Canvas>
        </div>

        {/* Sidebar */}
        <div style={{ width: "300px", padding: "10px", backgroundColor: "#fff", overflowY: "auto" }}>
          <h2 style={{ fontSize: "20px", margin: "10px 0" }}>Room Properties</h2>
          {/* Room dimensions & colors */}
          <div><label>Width (m): </label><input type="number" value={roomWidth} onChange={e => setRoomWidth(Number(e.target.value))} style={{ width: "50%" }} /></div>
          <div><label>Length (m): </label><input type="number" value={roomLength} onChange={e => setRoomLength(Number(e.target.value))} style={{ width: "50%" }} /></div>
          <div><label>Height (m): </label><input type="number" value={roomHeight} onChange={e => setRoomHeight(Number(e.target.value))} style={{ width: "50%" }} /></div>
          <div><label>Front Wall: </label><input type="color" value={frontWallColor} onChange={e => setFrontWallColor(e.target.value)} style={{ width: "50%" }} /></div>
          <div><label>Back Wall: </label><input type="color" value={backWallColor} onChange={e => setBackWallColor(e.target.value)} style={{ width: "50%" }} /></div>
          <div><label>Left Wall: </label><input type="color" value={leftWallColor} onChange={e => setLeftWallColor(e.target.value)} style={{ width: "50%" }} /></div>
          <div><label>Right Wall: </label><input type="color" value={rightWallColor} onChange={e => setRightWallColor(e.target.value)} style={{ width: "50%" }} /></div>
          <div><label>Floor: </label><input type="color" value={floorColor} onChange={e => setFloorColor(e.target.value)} style={{ width: "50%" }} /></div>
          <div><label>Ceiling: </label><input type="color" value={ceilingColor} onChange={e => setCeilingColor(e.target.value)} style={{ width: "50%" }} /></div>
          <button style={{ margin: "10px 0", width: "100%", padding: "10px", background: "linear-gradient(to right,#7F00FF,#E100FF)", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}>
            Update Room
          </button>

          <h2 style={{ fontSize: "20px", margin: "10px 0" }}>Door / Window Settings</h2>
          <div>
            <label>Door Wall: </label>
            <select
              value={doorWall}
              onChange={e => {
                setDoorWall(e.target.value);
                setDoorHorizontalOffset(0);
              }}
              style={{ width: "50%" }}
            >
              <option value="front">Front</option>
              <option value="back">Back</option>
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
          </div>
          <div>
            <label>Door Offset (m): </label>
            <input type="number" value={doorHorizontalOffset} onChange={e => setDoorHorizontalOffset(Number(e.target.value))} style={{ width: "50%" }} />
          </div>
          <div>
            <label>Door Width (m): </label>
            <input type="number" value={doorWidth} onChange={e => setDoorWidth(Number(e.target.value))} style={{ width: "50%" }} />
          </div>
          <div>
            <label>Door Height (m): </label>
            <input type="number" value={doorHeight} onChange={e => setDoorHeight(Number(e.target.value))} style={{ width: "50%" }} />
          </div>
          <div>
            <label>Door Color: </label>
            <input type="color" value={doorColor} onChange={e => setDoorColor(e.target.value)} style={{ width: "50%" }} />
          </div>

          <div>
            <label>Window Width (m): </label>
            <input type="number" value={windowWidth} onChange={e => setWindowWidth(Number(e.target.value))} style={{ width: "50%" }} />
          </div>
          <div>
            <label>Window Height (m): </label>
            <input type="number" value={windowHeight} onChange={e => setWindowHeight(Number(e.target.value))} style={{ width: "50%" }} />
          </div>
          <div>
            <label>From Floor (m): </label>
            <input type="number" value={windowHeightFromFloor} onChange={e => setWindowHeightFromFloor(Number(e.target.value))} style={{ width: "50%" }} />
          </div>
          <div>
            <label>Window Color: </label>
            <input type="color" value={windowColor} onChange={e => setWindowColor(e.target.value)} style={{ width: "50%" }} />
          </div>

          <h2 style={{ fontSize: "20px", margin: "10px 0" }}>Navigation & Lights</h2>
          <div>
            <label>Mode: </label>
            <select value={navMode} onChange={e => setNavMode(e.target.value)} style={{ width: "50%" }}>
              <option value="orbit">Orbit</option>
              <option value="walk">Walk</option>
            </select>
          </div>
          {navMode === "orbit" && (
            <>
              <button onClick={handleGoInside} style={{ width: "100%", marginTop: "10px" }}>Go Inside</button>
              <button onClick={handleExitRoom} style={{ width: "100%", marginTop: "10px" }}>Exit Room</button>
            </>
          )}
          <button
            onClick={() => setLightsOn(!lightsOn)}
            style={{
              width: "100%",
              marginTop: "10px",
              padding: "10px",
              backgroundColor: lightsOn ? "#d32f2f" : "#388e3c",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer"
            }}
          >
            {lightsOn ? "Turn Lights Off" : "Turn Lights On"}
          </button>

          {isInside && (
            <>
              <h2 style={{ fontSize: "20px", margin: "10px 0" }}>Furniture Details</h2>
              <div>
                <label>Type: </label>
                <select value={furnitureType} onChange={e => setFurnitureType(e.target.value)} style={{ width: "50%" }}>
                  <option value="Sofa">Sofa</option>
                  <option value="Table">Table</option>
                  <option value="Cupboard">Cupboard</option>
                  <option value="Bed">Bed</option>
                  <option value="MirrorTable">MirrorTable</option>
                  <option value="BedsideTable">BedsideTable</option>
                  <option value="Chair">Chair</option>
                  <option value="TvTable">TvTable</option>
                </select>
              </div>
              <div>
                <label>Color: </label>
                <input type="color" value={furnitureColor} onChange={e => setFurnitureColor(e.target.value)} style={{ width: "50%" }} />
              </div>
              <div>
                <label>Pos X (m): </label>
                <input type="number" value={furniturePosX} onChange={e => setFurniturePosX(e.target.value)} style={{ width: "50%" }} />
              </div>
              <div>
                <label>Pos Y (m): </label>
                <input type="number" value={furniturePosY} onChange={e => setFurniturePosY(e.target.value)} style={{ width: "50%" }} />
              </div>
              <div>
                <label>Pos Z (m): </label>
                <input type="number" value={furniturePosZ} onChange={e => setFurniturePosZ(e.target.value)} style={{ width: "50%" }} />
              </div>
              <button onClick={addFurniture} style={{ width: "100%", marginTop: "10px", padding: "10px", backgroundColor: "#673ab7", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}>
                Add Furniture
              </button>
              {furnitureItems.length > 0 && (
                <div style={{ marginTop: "20px" }}>
                  <h3 style={{ fontSize: "16px", margin: "10px 0" }}>Placed Furniture</h3>
                  <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                    {furnitureItems.map(item => (
                      <div key={item.id} style={{ display: "flex", justifyContent: "space-between", padding: "5px", margin: "5px 0", backgroundColor: "#f0f0f0", borderRadius: "4px" }}>
                        <span>{item.type}</span>
                        <button onClick={() => removeFurniture(item.id)} style={{ backgroundColor: "#ff4444", color: "#fff", border: "none", padding: "5px 10px", borderRadius: "4px", cursor: "pointer" }}>
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
