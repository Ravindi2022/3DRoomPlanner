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
   - Includes interior and exterior door handles.
   - Clicking toggles its open/closed state.
   - Uses the provided doorColor.
*/
function Door({ doorWidth, doorHeight, onToggle, color, ...props }) {
  const [open, setOpen] = useState(false);
  const doorRef = useRef();
  const closedAngle = 0;
  const openAngle = -Math.PI / 2;

  // Door handle dimensions
  const handleWidth = 0.03;
  const handleHeight = 0.15;
  const handleDepth = 0.04;
  const handleDistance = 0.08;
  const handleHorizontalPosition = doorWidth * 0.8;

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

  // Function to create a handle mesh
  const createHandlePart = (args, position) => (
    <mesh position={position}>
      <boxGeometry args={args} />
      <meshStandardMaterial color="#C0C0C0" />
    </mesh>
  );

  // Function to create a complete handle (interior or exterior)
  const createHandle = (isExterior) => {
    const zOffset = isExterior ? 0.025 + handleDistance/2 : -(0.025 + handleDistance/2);
    const mountDirection = isExterior ? -1 : 1;
    
    return (
      <group position={[handleHorizontalPosition - doorWidth/2, 0, zOffset]}>
        {/* Main handle bar */}
        {createHandlePart(
          [handleWidth, handleHeight, handleDepth],
          [0, 0, 0]
        )}
        
        {/* Handle mounts */}
        {createHandlePart(
          [handleWidth * 1.5, handleWidth * 1.5, handleDistance],
          [0, handleHeight/2 - handleWidth/2, mountDirection * handleDistance/2]
        )}
        {createHandlePart(
          [handleWidth * 1.5, handleWidth * 1.5, handleDistance],
          [0, -handleHeight/2 + handleWidth/2, mountDirection * handleDistance/2]
        )}

        {/* Backplate */}
        {createHandlePart(
          [handleWidth * 3, handleHeight * 1.2, 0.01],
          [0, 0, mountDirection * handleDistance]
        )}
      </group>
    );
  };

  return (
    <group {...props} onClick={handleClick}>
      <mesh ref={doorRef} position={[doorWidth / 2, doorHeight / 2, 0]}>
        {/* Door panel */}
        <boxGeometry args={[doorWidth, doorHeight, 0.05]} />
        <meshStandardMaterial color={color} />

        {/* Exterior Handle */}
        {createHandle(true)}

        {/* Interior Handle */}
        {createHandle(false)}

        {/* Door frame trim */}
        <mesh position={[0, 0, 0.028]}>
          <boxGeometry args={[doorWidth + 0.05, doorHeight + 0.05, 0.01]} />
          <meshStandardMaterial color={color} metalness={0.1} roughness={0.8} />
        </mesh>
      </mesh>
    </group>
  );
}

/* Window Component:
   - Renders a realistic window with frame, glass panes, and sill
   - Uses glass material with reflections and transparency
   - Includes window frame with mullions and trim
*/
function Window({ windowWidth, windowHeight, color, ...props }) {
  // Frame dimensions
  const frameThickness = 0.05;
  const frameBreadth = 0.08;
  const sillDepth = 0.15;
  const sillThickness = 0.04;

  return (
    <group {...props}>
      {/* Window glass panes (2x2 grid) */}
      {[
        [-windowWidth/4, windowHeight/4],
        [windowWidth/4, windowHeight/4],
        [-windowWidth/4, -windowHeight/4],
        [windowWidth/4, -windowHeight/4]
      ].map(([x, y], i) => (
        <mesh key={i} position={[x, y, 0]}>
          <planeGeometry args={[windowWidth/2 - frameBreadth, windowHeight/2 - frameBreadth]} />
          <meshPhysicalMaterial 
            color={color}
            transparent
            opacity={0.2}
            roughness={0}
            metalness={0.2}
            clearcoat={1}
            clearcoatRoughness={0.1}
            envMapIntensity={1}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      {/* Window frame - outer frame */}
      <group>
        {/* Vertical sides */}
        {[-windowWidth/2, windowWidth/2].map((x, i) => (
          <mesh key={i} position={[x, 0, frameThickness/2]}>
            <boxGeometry args={[frameBreadth, windowHeight + frameBreadth*2, frameThickness]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.3} metalness={0.1} />
          </mesh>
        ))}
        {/* Horizontal sides */}
        {[-windowHeight/2, windowHeight/2].map((y, i) => (
          <mesh key={i} position={[0, y, frameThickness/2]}>
            <boxGeometry args={[windowWidth + frameBreadth*2, frameBreadth, frameThickness]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.3} metalness={0.1} />
          </mesh>
        ))}
      </group>

      {/* Window mullions (cross pieces) */}
      <group>
        {/* Vertical mullion */}
        <mesh position={[0, 0, frameThickness/2]}>
          <boxGeometry args={[frameBreadth, windowHeight, frameThickness]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.3} metalness={0.1} />
        </mesh>
        {/* Horizontal mullion */}
        <mesh position={[0, 0, frameThickness/2]}>
          <boxGeometry args={[windowWidth, frameBreadth, frameThickness]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.3} metalness={0.1} />
        </mesh>
      </group>

      {/* Window sill */}
      <group position={[0, -windowHeight/2 - sillThickness/2, sillDepth/2]}>
        {/* Main sill */}
        <mesh>
          <boxGeometry args={[windowWidth + frameBreadth*4, sillThickness, sillDepth]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.3} metalness={0.1} />
        </mesh>
        {/* Sill front trim */}
        <mesh position={[0, -sillThickness/2, -sillDepth/2 + frameThickness/2]}>
          <boxGeometry args={[windowWidth + frameBreadth*4, sillThickness, frameThickness]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.3} metalness={0.1} />
        </mesh>
      </group>

      {/* Window trim - interior side */}
      <group position={[0, 0, frameThickness]}>
        {/* Vertical trim pieces */}
        {[-windowWidth/2 - frameBreadth, windowWidth/2 + frameBreadth].map((x, i) => (
          <mesh key={i} position={[x, 0, 0]}>
            <boxGeometry args={[frameBreadth, windowHeight + frameBreadth*4, frameThickness/2]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.3} metalness={0.1} />
          </mesh>
        ))}
        {/* Horizontal trim pieces */}
        {[-windowHeight/2 - frameBreadth, windowHeight/2 + frameBreadth].map((y, i) => (
          <mesh key={i} position={[0, y, 0]}>
            <boxGeometry args={[windowWidth + frameBreadth*4, frameBreadth, frameThickness/2]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.3} metalness={0.1} />
          </mesh>
        ))}
      </group>
    </group>
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
  frontWallColor,
  backWallColor,
  leftWallColor,
  rightWallColor,
  doorWall,
  windowWall,
  onDoorToggle,
  doorColor,
  windowColor,
  doorOffset,
  doorWidth,
  doorHeight,
  windowOffset,
  windowWidth,
  windowHeight,
  windowHeightFromFloor
}) {
  // For front/back walls, horizontal dimension is roomWidth.
  const doorWidthFB = width * 0.3;
  const windowWidthFB = width * 0.3;

  // For left/right walls, horizontal dimension is roomLength.
  const windowWidthSide = length * 0.3;
  const windowZOffset = 0.1; // increased offset for visibility

  // Helper function to get window position for each wall
  const getWindowPosition = (wall) => {
    switch (wall) {
      case "front":
        return [-windowWidth / 2 + windowOffset, windowHeightFromFloor + windowHeight / 2, length / 2 + 0.1];
      case "back":
        return [-windowWidth / 2 + windowOffset, windowHeightFromFloor + windowHeight / 2, -length / 2 - 0.1];
      case "left":
        return [-width / 2 - 0.1, windowHeightFromFloor + windowHeight / 2, -windowWidth / 2 + windowOffset];
      case "right":
        return [width / 2 + 0.1, windowHeightFromFloor + windowHeight / 2, -windowWidth / 2 + windowOffset];
      default:
        return [0, windowHeightFromFloor + windowHeight / 2, 0];
    }
  };

  // Helper function to get door position and rotation for each wall
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

  return (
    <group>
      {/* Front Wall */}
      <mesh position={[0, height / 2, length / 2]}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color={frontWallColor} side={THREE.DoubleSide} />
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
      <mesh position={[0, height / 2, -length / 2]}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color={backWallColor} side={THREE.DoubleSide} />
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
      <mesh position={[-width / 2, height / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[length, height]} />
        <meshStandardMaterial color={leftWallColor} side={THREE.DoubleSide} />
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
          rotation={[0, Math.PI / 2, 0]}
        />
      )}

      {/* Right Wall */}
      <mesh position={[width / 2, height / 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[length, height]} />
        <meshStandardMaterial color={rightWallColor} side={THREE.DoubleSide} />
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
          rotation={[0, -Math.PI / 2, 0]}
        />
      )}
    </group>
  );
}

/* ----- Furniture Components ----- */

/* Furniture size configurations */
const FURNITURE_SIZES = {
  Chair: {
    Small: { width: 0.5, depth: 0.5, height: 0.8, seatHeight: 0.4 },
    Medium: { width: 0.6, depth: 0.6, height: 0.9, seatHeight: 0.45 },
    Large: { width: 0.7, depth: 0.7, height: 1.0, seatHeight: 0.5 }
  },
  Table: {
    Small: { width: 1.2, depth: 0.6, height: 0.7 },
    Medium: { width: 1.6, depth: 0.8, height: 0.73 },
    Large: { width: 2.0, depth: 1.0, height: 0.75 }
  },
  Bed: {
    Small: { width: 1.4, depth: 1.9, height: 0.5 }, // Single bed
    Medium: { width: 1.6, depth: 2.0, height: 0.5 }, // Double bed
    Large: { width: 2.1, depth: 2.4, height: 0.5 }  // King size bed
  },
  Sofa: {
    Small: { width: 1.6, depth: 0.8, height: 0.9 },
    Medium: { width: 2.2, depth: 1.0, height: 1.0 },
    Large: { width: 2.8, depth: 1.2, height: 1.0 }
  },
  Cabinet: {
    Small: { width: 0.8, depth: 0.4, height: 1.6 },
    Medium: { width: 1.0, depth: 0.5, height: 2.0 },
    Large: { width: 1.2, depth: 0.6, height: 2.4 }
  },
  Wardrobes: {
    Small: { width: 1.6, depth: 0.5, height: 2.4 },
    Medium: { width: 2.0, depth: 0.6, height: 3.0 },
    Large: { width: 2.4, depth: 0.7, height: 3.2 }
  },
  Rack: {
    Small: { width: 1.2, depth: 0.3, height: 1.2 },
    Medium: { width: 1.8, depth: 0.4, height: 1.6 },
    Large: { width: 2.4, depth: 0.5, height: 2.0 }
  }
};

/* Chair Component - Now with size support */
function Chair({ color, size = "Medium" }) {
  const dims = FURNITURE_SIZES.Chair[size];
  return (
    <group>
      {/* Seat cushion */}
      <mesh position={[0, dims.seatHeight, 0]}>
        <boxGeometry args={[dims.width, 0.1, dims.depth]} />
        <meshStandardMaterial color={color} roughness={0.7} metalness={0.1} />
      </mesh>
      {/* Backrest cushion */}
      <mesh position={[0, dims.height - 0.2, -dims.depth/2 + 0.05]}>
        <boxGeometry args={[dims.width, (dims.height - dims.seatHeight) * 0.8, 0.1]} />
        <meshStandardMaterial color={color} roughness={0.7} metalness={0.1} />
      </mesh>
      {/* Frame */}
      <group>
        {/* Legs */}
        {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z], i) => (
          <mesh key={i} position={[x * (dims.width/2 - 0.05), dims.seatHeight/2, z * (dims.depth/2 - 0.05)]}>
            <cylinderGeometry args={[0.02, 0.02, dims.seatHeight]} />
            <meshStandardMaterial color="#A0A0A0" roughness={0.2} metalness={0.8} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/* Table Component - Now with size support */
function Table({ color, size = "Medium" }) {
  const dims = FURNITURE_SIZES.Table[size];
  return (
    <group>
      {/* Table top */}
      <mesh position={[0, dims.height, 0]}>
        <boxGeometry args={[dims.width, 0.04, dims.depth]} />
        <meshStandardMaterial color={color} roughness={0.6} metalness={0.1} />
      </mesh>
      {/* Legs */}
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z], i) => (
        <group key={i} position={[x * (dims.width/2 - 0.1), dims.height/2, z * (dims.depth/2 - 0.1)]}>
          <mesh>
            <cylinderGeometry args={[0.02, 0.02, dims.height]} />
            <meshStandardMaterial color="#A0A0A0" roughness={0.2} metalness={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* Bed Component - Now with size support */
function Bed({ color, size = "Medium" }) {
  const dims = FURNITURE_SIZES.Bed[size];
  
  // Define pillow positions based on size
  const getPillowPositions = () => {
    switch(size) {
      case "Small":
        return [[-0.3]];
      case "Medium":
        return [[-0.4, 0.4]];
      case "Large":
        return [[-0.6, 0, 0.6]];
      default:
        return [[-0.4, 0.4]]; // Default to Medium
    }
  };

  return (
    <group>
      {/* Bed frame */}
      <mesh position={[0, dims.height/2, 0]}>
        <boxGeometry args={[dims.width, dims.height, dims.depth]} />
        <meshStandardMaterial color="#8B4513" roughness={0.8} metalness={0.1} />
      </mesh>
      {/* Mattress */}
      <mesh position={[0, dims.height + 0.1, 0]}>
        <boxGeometry args={[dims.width - 0.1, 0.2, dims.depth - 0.2]} />
        <meshStandardMaterial color={color} roughness={0.9} metalness={0} />
      </mesh>
      {/* Pillows */}
      {getPillowPositions()[0].map((x, i) => (
        <mesh key={i} position={[x, dims.height + 0.25, -dims.depth/2 + 0.3]}>
          <boxGeometry args={[0.5, 0.1, 0.4]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.9} metalness={0} />
        </mesh>
      ))}
    </group>
  );
}

/* Sofa Component - Now with size support */
function Sofa({ color, size = "Medium" }) {
  const dims = FURNITURE_SIZES.Sofa[size];
  const numCushions = size === "Small" ? 2 : size === "Medium" ? 3 : 4;
  const cushionWidth = (dims.width - 0.4) / numCushions;
  
  return (
    <group>
      {/* Base frame */}
      <mesh position={[0, dims.height/4, 0]}>
        <boxGeometry args={[dims.width, dims.height/2, dims.depth]} />
        <meshStandardMaterial color="#4A4A4A" roughness={0.8} metalness={0.1} />
      </mesh>
      {/* Seat cushions */}
      {Array.from({ length: numCushions }, (_, i) => {
        const x = -dims.width/2 + cushionWidth/2 + cushionWidth * i + 0.2;
        return (
          <mesh key={i} position={[x, dims.height/2, 0]}>
            <boxGeometry args={[cushionWidth - 0.1, 0.2, dims.depth - 0.2]} />
            <meshStandardMaterial color={color} roughness={0.9} metalness={0} />
          </mesh>
        );
      })}
      {/* Backrest */}
      <mesh position={[0, dims.height * 0.75, -dims.depth/2 + 0.1]}>
        <boxGeometry args={[dims.width, dims.height/2, 0.2]} />
        <meshStandardMaterial color={color} roughness={0.9} metalness={0} />
      </mesh>
    </group>
  );
}

/* Cabinet Component - Now with size support */
function Cabinet({ color, size = "Medium" }) {
  const dims = FURNITURE_SIZES.Cabinet[size];
  return (
    <group>
      {/* Main body */}
      <mesh position={[0, dims.height/2, 0]}>
        <boxGeometry args={[dims.width, dims.height, dims.depth]} />
        <meshStandardMaterial color={color} roughness={0.6} metalness={0.1} />
      </mesh>
      {/* Doors */}
      {[-1, 1].map((x, i) => (
        <group key={i}>
          <mesh position={[x * dims.width/4, dims.height/2, dims.depth/2 + 0.01]}>
            <boxGeometry args={[dims.width/2 - 0.02, dims.height - 0.04, 0.02]} />
            <meshStandardMaterial color={color} roughness={0.6} metalness={0.1} />
          </mesh>
          {/* Handle */}
          <mesh position={[x * (dims.width/4 + 0.15), dims.height/2, dims.depth/2 + 0.03]}>
            <cylinderGeometry args={[0.01, 0.01, 0.1]} rotation={[Math.PI/2, 0, 0]} />
            <meshStandardMaterial color="#C0C0C0" roughness={0.2} metalness={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* Wardrobes Component - Now with size support */
function Wardrobes({ color, size = "Medium" }) {
  const dims = FURNITURE_SIZES.Wardrobes[size];
  const numDoors = size === "Small" ? 2 : size === "Medium" ? 3 : 4;
  const doorWidth = dims.width / numDoors;
  
  return (
    <group>
      {/* Main body */}
      <mesh position={[0, dims.height/2, 0]}>
        <boxGeometry args={[dims.width, dims.height, dims.depth]} />
        <meshStandardMaterial color={color} roughness={0.6} metalness={0.1} />
      </mesh>
      {/* Doors */}
      {Array.from({ length: numDoors }, (_, i) => {
        const x = -dims.width/2 + doorWidth/2 + doorWidth * i;
        return (
          <group key={i}>
            <mesh position={[x, dims.height/2, dims.depth/2 + 0.01]}>
              <boxGeometry args={[doorWidth - 0.02, dims.height - 0.04, 0.02]} />
              <meshStandardMaterial color={color} roughness={0.6} metalness={0.1} />
            </mesh>
            {/* Handle */}
            <mesh position={[x + 0.15, dims.height/2, dims.depth/2 + 0.03]}>
              <cylinderGeometry args={[0.01, 0.01, 0.15]} rotation={[Math.PI/2, 0, 0]} />
              <meshStandardMaterial color="#C0C0C0" roughness={0.2} metalness={0.8} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/* Rack Component - Now with size support */
function Rack({ color, size = "Medium" }) {
  const dims = FURNITURE_SIZES.Rack[size];
  const numShelves = size === "Small" ? 2 : size === "Medium" ? 3 : 4;
  
  return (
    <group>
      {/* Vertical supports */}
      {[-1, 1].map((x, i) => (
        <mesh key={i} position={[x * (dims.width/2 - 0.025), dims.height/2, 0]}>
          <boxGeometry args={[0.05, dims.height, dims.depth]} />
          <meshStandardMaterial color="#2F4F4F" roughness={0.5} metalness={0.5} />
        </mesh>
      ))}
      {/* Shelves */}
      {Array.from({ length: numShelves }, (_, i) => {
        const y = dims.height / (numShelves - 1) * i;
        return (
          <mesh key={i} position={[0, y, 0]}>
            <boxGeometry args={[dims.width - 0.1, 0.03, dims.depth]} />
            <meshStandardMaterial color={color} roughness={0.6} metalness={0.1} />
          </mesh>
        );
      })}
    </group>
  );
}

/* Editable Furniture Wrapper using TransformControls */
function Furniture({ item, onUpdate, onDelete }) {
  const ref = useRef();

  const renderFurnitureComponent = () => {
    switch (item.type) {
      case "Sofa":
        return <Sofa color={item.color} size={item.size} />;
      case "Table":
        return <Table color={item.color} size={item.size} />;
      case "Cabinet":
        return <Cabinet color={item.color} size={item.size} />;
      case "Bed":
        return <Bed color={item.color} size={item.size} />;
      case "Wardrobes":
        return <Wardrobes color={item.color} size={item.size} />;
      case "Rack":
        return <Rack color={item.color} size={item.size} />;
      case "Chair":
        return <Chair color={item.color} size={item.size} />;
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

/* LightBulb Component */
function LightBulb({ position, color, intensity, isOn = true }) {
  // Calculate glow color based on intensity and whether light is on
  const glowColor = isOn ? color : "#404040";
  const glowIntensity = isOn ? intensity : 0;

  return (
    <group position={position}>
      {/* Main light source */}
      {isOn && (
        <pointLight 
          color={color} 
          intensity={intensity * 2} // Increased intensity for better illumination
          distance={20} // Increased distance
          decay={1.5} // Reduced decay for better spread
          castShadow // Enable shadow casting
        />
      )}
      
      {/* Glass bulb */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.08, 32, 32]} />
        <meshPhysicalMaterial
          color={glowColor}
          emissive={glowColor}
          emissiveIntensity={glowIntensity * 0.5}
          transparent={true}
          opacity={0.9}
          roughness={0}
          metalness={0}
          clearcoat={1}
          clearcoatRoughness={0}
          transmission={0.6}
          thickness={0.05}
        />
      </mesh>

      {/* Inner filament */}
      <mesh position={[0, 0, 0]}>
        <torusGeometry args={[0.02, 0.002, 16, 32]} />
        <meshStandardMaterial
          color={glowColor}
          emissive={glowColor}
          emissiveIntensity={glowIntensity}
        />
      </mesh>
      
      {/* Screw base (threaded) */}
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.04, 0.035, 0.12, 32, 4]} />
        <meshStandardMaterial 
          color="#B8B8B8" 
          metalness={0.9} 
          roughness={0.3}
        />
      </mesh>

      {/* Base connector */}
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.045, 0.045, 0.02, 32]} />
        <meshStandardMaterial 
          color="#A0A0A0" 
          metalness={0.8} 
          roughness={0.2}
        />
      </mesh>
      
      {/* Ceiling mount plate */}
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.02, 32]} />
        <meshStandardMaterial 
          color="#909090" 
          metalness={0.7} 
          roughness={0.3}
        />
      </mesh>

      {/* Decorative ring */}
      <mesh position={[0, 0.14, 0]}>
        <torusGeometry args={[0.09, 0.01, 16, 32]} />
        <meshStandardMaterial 
          color="#A0A0A0" 
          metalness={0.8} 
          roughness={0.2}
        />
      </mesh>
    </group>
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

  // Door customization state
  const [doorWidth, setDoorWidth] = useState(1.2); // default 1.2 meters wide
  const [doorHeight, setDoorHeight] = useState(2.1); // default 2.1 meters tall (standard door height)
  const [doorHorizontalOffset, setDoorHorizontalOffset] = useState(0); // center position

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

  // Add furniture size state
  const [furnitureSize, setFurnitureSize] = useState("Medium");

  const addFurniture = () => {
    const newItem = {
      id: Date.now(),
      type: furnitureType,
      color: furnitureColor,
      size: furnitureSize,
      position: [Number(furniturePosX), Number(furniturePosY), Number(furniturePosZ)]
    };
    setFurnitureItems([...furnitureItems, newItem]);
  };

  const updateFurniture = (id, newPos) => {
    setFurnitureItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, position: newPos } : item))
    );
  };

  // Function to remove furniture
  const removeFurniture = (id) => {
    setFurnitureItems(furnitureItems.filter(item => item.id !== id));
  };

  // Window customization state
  const [windowWidth, setWindowWidth] = useState(2); // default 2 meters wide
  const [windowHeight, setWindowHeight] = useState(1.5); // default 1.5 meters tall
  const [windowHeightFromFloor, setWindowHeightFromFloor] = useState(1); // default 1 meter from floor
  const [windowHorizontalOffset, setWindowHorizontalOffset] = useState(0); // center position

  // Light bulb state
  const [lightColor, setLightColor] = useState("#FFFFFF");
  const [lightIntensity, setLightIntensity] = useState(1);
  const [lightPosition, setLightPosition] = useState([0, 0, 0]);
  const [isLightOn, setIsLightOn] = useState(true);

  // Update light position when room dimensions change
  useEffect(() => {
    setLightPosition([0, roomHeight - 0.2, 0]);
  }, [roomHeight]);

  // Individual wall colors
  const [frontWallColor, setFrontWallColor] = useState("#FFFFFF");
  const [backWallColor, setBackWallColor] = useState("#FFFFFF");
  const [leftWallColor, setLeftWallColor] = useState("#FFFFFF");
  const [rightWallColor, setRightWallColor] = useState("#FFFFFF");

  // Add view mode state
  const [viewMode, setViewMode] = useState("3D");

  // Camera positions for different views
  const get3DPosition = () => [0, 5, 10];
  const get2DPosition = () => [0, roomHeight * 2, 0];

  // Update external camera position based on view mode
  useEffect(() => {
    const newPosition = viewMode === "3D" ? get3DPosition() : get2DPosition();
    if (!isInside) {
      setCameraTarget(newPosition);
    }
  }, [viewMode, roomHeight, isInside]);

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
          justifyContent: "space-between" // Add this to space out the elements
        }}
      >
        <h1 style={{ color: "#333", margin: 0 }}>3D House Designer</h1>
        <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
          {/* View Mode Toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>

<button
              style={{
                marginLeft: "10px",
                padding: "6px 12px",
                backgroundColor: "purple", //"#4CAF50",  // Match your app's color theme if needed
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
              onClick={() => window.location.href = "http://localhost:5173"}
            >
              Back to Store
            </button>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            
            <label style={{ color: "#333" }}>View Mode:</label>
            <select 
              value={viewMode}
              onChange={(e) => {
                setViewMode(e.target.value);
                if (navMode === "walk") {
                  setNavMode("orbit");
                }
              }}
              style={{
                padding: "5px",
                borderRadius: "4px",
                border: "1px solid #ddd",
                backgroundColor: "#fff"
              }}
            >
              <option value="3D">3D View</option>
              <option value="2D">2D View</option>
            </select>
          </div>
        </div>
      </nav>

      <div style={{ display: "flex", flexDirection: "row", height: "calc(100vh - 50px)" }}>
        {/* 3D Scene */}
        <div style={{ flex: 5, borderRight: "1px solid #ddd" }}>
          <Canvas camera={{ position: cameraTarget }} shadows>
            {/* Exterior lighting - always active */}
            <ambientLight intensity={0.8} />
            <directionalLight 
              position={[10, 10, 5]} 
              intensity={1.5}
              castShadow
            />

            {/* Room lighting system - only affects objects inside the room */}
            {isInside && (
              <group>
                {/* Create invisible walls to contain light */}
                <mesh position={[0, roomHeight/2, roomLength/2]} visible={false}>
                  <planeGeometry args={[roomWidth, roomHeight]} />
                  <meshStandardMaterial side={THREE.DoubleSide} opacity={0} transparent />
                </mesh>
                <mesh position={[0, roomHeight/2, -roomLength/2]} visible={false}>
                  <planeGeometry args={[roomWidth, roomHeight]} />
                  <meshStandardMaterial side={THREE.DoubleSide} opacity={0} transparent />
                </mesh>
                <mesh position={[-roomWidth/2, roomHeight/2, 0]} rotation={[0, Math.PI/2, 0]} visible={false}>
                  <planeGeometry args={[roomLength, roomHeight]} />
                  <meshStandardMaterial side={THREE.DoubleSide} opacity={0} transparent />
                </mesh>
                <mesh position={[roomWidth/2, roomHeight/2, 0]} rotation={[0, -Math.PI/2, 0]} visible={false}>
                  <planeGeometry args={[roomLength, roomHeight]} />
                  <meshStandardMaterial side={THREE.DoubleSide} opacity={0} transparent />
                </mesh>
                <mesh position={[0, roomHeight, 0]} rotation={[-Math.PI/2, 0, 0]} visible={false}>
                  <planeGeometry args={[roomWidth, roomLength]} />
                  <meshStandardMaterial side={THREE.DoubleSide} opacity={0} transparent />
                </mesh>
                <mesh position={[0, 0, 0]} rotation={[Math.PI/2, 0, 0]} visible={false}>
                  <planeGeometry args={[roomWidth, roomLength]} />
                  <meshStandardMaterial side={THREE.DoubleSide} opacity={0} transparent />
                </mesh>

                {/* Interior lighting */}
                {isLightOn && (
                  <>
                    {/* Main ceiling light */}
                    <pointLight
                      position={[0, roomHeight - 0.3, 0]}
                      color={lightColor}
                      intensity={lightIntensity * 2}
                      distance={roomWidth * 1.5}
                      decay={1.5}
                      castShadow
                    />

                    {/* Corner lights for even illumination */}
                    <pointLight
                      position={[roomWidth/4, roomHeight - 0.3, roomLength/4]}
                      color={lightColor}
                      intensity={lightIntensity * 0.4}
                      distance={roomWidth}
                      decay={2}
                    />
                    <pointLight
                      position={[-roomWidth/4, roomHeight - 0.3, roomLength/4]}
                      color={lightColor}
                      intensity={lightIntensity * 0.4}
                      distance={roomWidth}
                      decay={2}
                    />
                    <pointLight
                      position={[roomWidth/4, roomHeight - 0.3, -roomLength/4]}
                      color={lightColor}
                      intensity={lightIntensity * 0.4}
                      distance={roomWidth}
                      decay={2}
                    />
                    <pointLight
                      position={[-roomWidth/4, roomHeight - 0.3, -roomLength/4]}
                      color={lightColor}
                      intensity={lightIntensity * 0.4}
                      distance={roomWidth}
                      decay={2}
                    />

                    {/* Soft ambient fill light */}
                    <ambientLight 
                      intensity={lightIntensity * 0.2} 
                      color={lightColor}
                    />
                  </>
                )}

                {/* Light bulb model */}
                <LightBulb 
                  position={lightPosition}
                  color={lightColor}
                  intensity={lightIntensity}
                  isOn={isLightOn}
                />
              </group>
            )}
            
            {/* Update OrbitControls based on view mode */}
            {navMode === "orbit" && (
              <OrbitControls 
                enablePan 
                enableZoom 
                enableRotate={viewMode === "3D"}
                minPolarAngle={viewMode === "2D" ? 0 : undefined}
                maxPolarAngle={viewMode === "2D" ? 0 : undefined}
              />
            )}
            <CameraController navMode={navMode} target={cameraTarget} />
            <Grid args={[100, 100]} position={[0, -0.01, 0]} />
            <Floor width={roomWidth} length={roomLength} floorColor={floorColor} />
            {viewMode === "3D" && (
              <Ceiling
                roomWidth={roomWidth}
                roomLength={roomLength}
                roomHeight={roomHeight}
                ceilingColor={ceilingColor}
              />
            )}
            <Walls
              width={roomWidth}
              length={roomLength}
              height={roomHeight}
              frontWallColor={frontWallColor}
              backWallColor={backWallColor}
              leftWallColor={leftWallColor}
              rightWallColor={rightWallColor}
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
            {furnitureItems.map((item) => (
              <Furniture 
                key={item.id} 
                item={item} 
                onUpdate={updateFurniture}
                onDelete={removeFurniture}
              />
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
          
          {/* Wall Colors Section - Moved here */}
          <h3 style={{ fontSize: "16px", margin: "20px 0 10px 0" }}>Wall Colors</h3>
          <div style={{ display: "grid", gap: "10px", marginBottom: "20px" }}>
            <div>
              <label>Front Wall: </label>
              <input
                type="color"
                value={frontWallColor}
                onChange={(e) => setFrontWallColor(e.target.value)}
                style={{ width: "50%" }}
              />
            </div>
            <div>
              <label>Back Wall: </label>
              <input
                type="color"
                value={backWallColor}
                onChange={(e) => setBackWallColor(e.target.value)}
                style={{ width: "50%" }}
              />
            </div>
            <div>
              <label>Left Wall: </label>
              <input
                type="color"
                value={leftWallColor}
                onChange={(e) => setLeftWallColor(e.target.value)}
                style={{ width: "50%" }}
              />
            </div>
            <div>
              <label>Right Wall: </label>
              <input
                type="color"
                value={rightWallColor}
                onChange={(e) => setRightWallColor(e.target.value)}
                style={{ width: "50%" }}
              />
            </div>
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
          {viewMode === "3D" && (
            <div>
              <label>Ceiling Color: </label>
              <input
                type="color"
                value={ceilingColor}
                onChange={(e) => setCeilingColor(e.target.value)}
                style={{ width: "50%" }}
              />
            </div>
          )}

          <h2 style={{ fontSize: "20px", margin: "10px 0" }}>Door Settings</h2>
          <div>
            <label>Door Wall: </label>
            <select 
              value={doorWall} 
              onChange={(e) => {
                setDoorWall(e.target.value);
                // Reset door offset when changing walls to ensure door is visible
                setDoorHorizontalOffset(0);
              }}
              style={{ width: "50%" }}
            >
              <option value="front">Front Wall</option>
              <option value="back">Back Wall</option>
              <option value="left">Left Wall</option>
              <option value="right">Right Wall</option>
            </select>
          </div>

          {/* New Door Customization Controls */}
          <div style={{ marginTop: "10px" }}>
            <div>
              <label>Door Width (m): </label>
              <input
                type="number"
                value={doorWidth}
                onChange={(e) => setDoorWidth(Number(e.target.value))}
                min={0.6}
                max={2.0}
                step={0.1}
                style={{ width: "50%" }}
              />
            </div>
            <div>
              <label>Door Height (m): </label>
              <input
                type="number"
                value={doorHeight}
                onChange={(e) => setDoorHeight(Number(e.target.value))}
                min={1.8}
                max={roomHeight * 0.9}
                step={0.1}
                style={{ width: "50%" }}
              />
            </div>
            <div>
              <label>Position on Wall (m): </label>
              <input
                type="number"
                value={doorHorizontalOffset}
                onChange={(e) => setDoorHorizontalOffset(Number(e.target.value))}
                min={getDoorOffsetLimits().min}
                max={getDoorOffsetLimits().max}
                step={0.1}
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
          </div>

          <h2 style={{ fontSize: "20px", margin: "20px 0 10px 0" }}>Window Settings</h2>
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
            <label>Width (m): </label>
            <input
              type="number"
              value={windowWidth}
              onChange={(e) => setWindowWidth(Number(e.target.value))}
              min={0.5}
              max={roomWidth * 0.8}
              step={0.1}
              style={{ width: "50%" }}
            />
          </div>
          <div>
            <label>Height (m): </label>
            <input
              type="number"
              value={windowHeight}
              onChange={(e) => setWindowHeight(Number(e.target.value))}
              min={0.5}
              max={roomHeight * 0.8}
              step={0.1}
              style={{ width: "50%" }}
            />
          </div>
          <div>
            <label>Height from Floor (m): </label>
            <input
              type="number"
              value={windowHeightFromFloor}
              onChange={(e) => setWindowHeightFromFloor(Number(e.target.value))}
              min={0.3}
              max={roomHeight - windowHeight - 0.3}
              step={0.1}
              style={{ width: "50%" }}
            />
          </div>
          <div>
            <label>Horizontal Offset (m): </label>
            <input
              type="number"
              value={windowHorizontalOffset}
              onChange={(e) => setWindowHorizontalOffset(Number(e.target.value))}
              min={-roomWidth/2 + windowWidth/2}
              max={roomWidth/2 - windowWidth/2}
              step={0.1}
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
            <select 
              value={navMode} 
              onChange={(e) => {
                setNavMode(e.target.value);
                // Force orbit mode in 2D view
                if (viewMode === "2D" && e.target.value === "walk") {
                  setViewMode("3D");
                }
              }}
            >
              <option value="orbit">Orbit</option>
              <option value="walk">Walk</option>
            </select>
          </div>

          {/* Disable room entry in 2D mode */}
          {navMode === "orbit" && viewMode === "3D" && (
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
                <label>Size: </label>
                <select value={furnitureSize} onChange={(e) => setFurnitureSize(e.target.value)}>
                  <option value="Small">Small</option>
                  <option value="Medium">Medium</option>
                  <option value="Large">Large</option>
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

              {/* Furniture List with Remove Buttons */}
              {furnitureItems.length > 0 && (
                <div style={{ marginTop: "20px" }}>
                  <h3 style={{ fontSize: "16px", margin: "10px 0" }}>Placed Furniture</h3>
                  <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                    {furnitureItems.map((item) => (
                      <div 
                        key={item.id} 
                        style={{ 
                          display: "flex", 
                          justifyContent: "space-between", 
                          alignItems: "center",
                          padding: "5px",
                          margin: "5px 0",
                          backgroundColor: "#f0f0f0",
                          borderRadius: "4px"
                        }}
                      >
                        <span>{item.type}</span>
                        <button 
                          onClick={() => removeFurniture(item.id)}
                          style={{
                            backgroundColor: "#ff4444",
                            color: "white",
                            border: "none",
                            padding: "5px 10px",
                            borderRadius: "4px",
                            cursor: "pointer"
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Light Controls - only show when inside */}
          {isInside && (
            <>
              <h2 style={{ fontSize: "20px", margin: "20px 0 10px 0" }}>Light Settings</h2>
              <div style={{ marginBottom: "10px" }}>
                <label style={{ marginRight: "10px" }}>Light: </label>
                <button
                  onClick={() => setIsLightOn(!isLightOn)}
                  style={{
                    backgroundColor: isLightOn ? "#4CAF50" : "#f44336",
                    color: "white",
                    border: "none",
                    padding: "5px 15px",
                    borderRadius: "4px",
                    cursor: "pointer"
                  }}
                >
                  {isLightOn ? "ON" : "OFF"}
                </button>
              </div>
              <div>
                <label>Light Color: </label>
                <input
                  type="color"
                  value={lightColor}
                  onChange={(e) => setLightColor(e.target.value)}
                  style={{ width: "50%" }}
                />
              </div>
              <div style={{ marginTop: "10px" }}>
                <label>Intensity: </label>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.1"
                  value={lightIntensity}
                  onChange={(e) => setLightIntensity(Number(e.target.value))}
                  style={{ width: "50%" }}
                  disabled={!isLightOn}
                />
                <span style={{ marginLeft: "10px" }}>{lightIntensity.toFixed(1)}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  // Helper function to calculate door offset limits based on wall and door width
  function getDoorOffsetLimits() {
    const wallWidth = doorWall === "front" || doorWall === "back" ? roomWidth : roomLength;
    return {
      min: -wallWidth/2 + doorWidth/2,
      max: wallWidth/2 - doorWidth/2
    };
  }
}
