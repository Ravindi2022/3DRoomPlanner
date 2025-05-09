3DRoomPlanner
3DRoomPlanner is an interactive furniture design and visualization application that allows users to place, arrange and customize furniture in a 3D room environment. Designed for interior designers and end-users alike, the app lets you pick room dimensions, tweak color schemes for walls and furnishings, and see a realistic, real-time preview of your space. Under the hood it’s built with React and powered by the three.js library for high-performance 3D rendering.

In addition, a companion furniture store website named LUXE showcases the studio’s features and guides users through installation and usage. That website is built with Vite, React and TypeScript.

This project was developed as part of the PUSL3122 module: Human-Computer Interaction, Computer Graphics, and Visualisation, as a group coursework assignment for the academic year 2024–2025.

## Repository Structure
3D-design-studio/
Contains the React-based 3D Design Studio application (including App.js), where users can visualize and customize furniture in 3D.

website/
Contains the LUXE furniture store marketing website code (including App.tsx), built with Vite, React and TypeScript.

package.json (root)
Defines workspace settings and scripts to run both apps concurrently.

## Features
Real-time 3D Room Visualization
Inspect a fully customizable 3D room model, with dynamic lighting and shadows.

Room Dimension Selector
Choose room size and shape from preset options or enter custom measurements.

Furniture Placement & Customization
Add chairs, tables, sofas and more—scale them, adjust their color/texture, and move them around freely.

Color Scheme Editor
Change wall and floor colors (and furniture finishes) via an intuitive color picker to preview different palettes.

Responsive, User-Friendly Interface
Built in React for fluid interactions; supports mouse and touch controls.

3D Rendering with three.js
High-performance rendering pipeline ensures smooth frame rates even with complex scenes.

Vite-Powered Landing Page
Lightning-fast build times, hot-module reloading, and a TypeScript codebase for the marketing site.
