# Robot Nurse Pathfinding Project

## Project Overview
This project simulates a robot nurse that helps hospital staff by delivering medication, collecting test samples, and acting as a telemedicine interface.
<br/>The robot navigates through a hospital floor plan that is represented as a grid matrix and uses either A* or Dijkstra's algorithm to find the shortest available paths.
<br/>At the same time, the robot fulfills requests in wards based upon the priority of each task.

## Project Details
**Floor Plan:** The hospital map is represented as a 50 by 50 grid of 0s and 1s. 0s denote areas in which the robot is allowed to travel. 1s denote obstacles/walls.<br/>
**Algorithms:** This project implements both A* and Dijkstra's to calculate optimal paths for the robot to take.<br/>
**Heuristic:** The Manhattan Distance was used a heuristic for the A* algorithm due to the grid layout of the floor plan and the inability of the robot to make diagonal moves.<br/>
**Priority Queue:** This program ensures that deliveries are ordered by medical urgency (determined by which ward the request is for). The highest priority locations are the most important and will be traveled to first.
- Priority 5: ICU, Emergency, Oncology, Burn Ward
- Priority 4: Surgical Ward, Maternity Ward
- Priority 3: Hematology, Pediatric Ward
- Priority 2: Medical Ward, General Ward
- Priority 1: Admissions, Isolation Ward<br/>

**Outcomes:** The program produces one of three outputs:
- 'SUCCESS': All requests were completed by the robot.
- 'PARTIAL SUCCESS': Some requests were blocked by walls/obstacles, while the rest were completed by the robot.
- 'FAILURE': No requests were able to be completed by the robot due to walls/obstacles.

## Files Included
```
└── 📁ai-final-project-team3            ### Root
    └── 📁inputs                        ### Contains input files that exemplify project output
        ├── Blank.txt
        ├── Errors.txt
        ├── Failure.txt
        ├── Partial_Success.txt
        ├── Success.txt
    └── 📁src                           ### Initial project setup
        ├── convert.py
        ├── Create Grid Overlay
        ├── ❗floorplan_matrix.py       ### Hospital-matrix representation + wards (names, priorities, colors, and dropoff locations)
        ├── floorplan_matrix.txt
        ├── floorplan1_nolegend.JPG
        ├── floorplan1_nolegend.png
        ├── floorplan1.JPG
    ├── .gitignore
    ├── ❗AlgorithmGUI.py               ### Contains Cell and MazeGame classes, pertains to GUI logic mostly
    ├── ❗CheckSuccess.py               ### Contains logic for determing the program's success status
    ├── ❗ErrorChecking.py              ### Contains logic for error checking, specifically in the input file
    ├── ❗FindPath.py                   ### Main program file, builds pqueue and runs the GUI
    ├── ❗InputParse.py                 ### Contains logic for parsing the input file
    ├── ❗README.md                     ### Broad Overview
    └── ❗RecursivePathing.py           ### Contains recursive logic for finding best goals and navigating to them
```

## Input File Format
This program accepts an input.txt file with the following format:
- **Delivery algorithm:** Either A* or Dijkstra's
- **Start location:** The coordinates where the robot begins. (X,Y) | 0 <= X,Y <= 49
- **Delivery locations:** A comma separated list of wards for the robot to go to.

## How to Run this Project
The program FindPath.py accepts the input file as the command line argument:
**python FindPath.py inputs/inputfile.txt**

## GUI
Utilize the program sidebar to synchronously add requests to the robot's priority queue.

## Process of Program
When the program is run, the following steps will take place:
1. **Parsing the Input:** The program reads the chosen algorithm, the starting location of the robot, and the delivery requests.
2. **Building the Priority Queue:** The requests are ordered by ward priority.
3. **Pathfinding:** The chosen algorithm is used to compute the shortest path between locations.
4. **Executing Deliveries:** Using the optimal path, the robot completes its tasks one at a time, updating its own location after each delivery.
5. **Checking Termination:** The program ends with 'SUCCESS', 'PARTIAL SUCCESS', OR 'FAILURE' and displays the path taken by the robot.
6. **Optional Continuation:** While the GUI is open, the program is able to receive additional delivery requests. If they are given, the program repeats steps 2-5.