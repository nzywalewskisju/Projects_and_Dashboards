# AlgorithmGUI.py
import tkinter as tk
import time
from queue import PriorityQueue
from PIL import Image, ImageTk
from RecursivePathing import recursive_pathing


#Creates Cell class
class Cell:
    def __init__(self, x, y, is_wall=False):
        self.x = x
        self.y = y
        self.is_wall = is_wall
        self.g = float("inf")
        self.h = 0
        self.f = float("inf")
        self.parent = None

    def __lt__(self, other):
        return self.f < other.f

#Creates MazeGame class
#Need to declare a lot of base values for the game
class MazeGame:
    def __init__(self, root, maze, algorithm, start_location, delivery_locations,
                 dropoff_locations, valid_wards, priority, pq_from_input, counter_from_input,
                 recursive_pathing, check_success, dijkstra_names):
        self.root = root
        self.maze = maze
        self.algorithm = algorithm
        self.start_location = start_location
        self.delivery_locations = delivery_locations
        self.dropoff_locations = dropoff_locations
        self.valid_wards = valid_wards
        self.priority = priority
        self.pq = pq_from_input
        self.counter = counter_from_input
        self.recursive_pathing = recursive_pathing
        self.check_success = check_success
        self.dijkstra_names = dijkstra_names

        self.rows = len(maze)
        self.cols = len(maze[0])
        self.agent_pos = start_location

        self.cells = [[Cell(x, y, maze[x][y] == 1) for y in range(self.cols)] for x in range(self.rows)]
        self.cell_size = 15

        #### Start state's initial values for f(n) = g(n) + h(n) 
        self.cells[self.agent_pos[0]][self.agent_pos[1]].g = 0 
        self.cells[self.agent_pos[0]][self.agent_pos[1]].h = 0
        self.cells[self.agent_pos[0]][self.agent_pos[1]].f = 0

        # The maze cell size in pixels
        self.cell_size = 15 # Need to set pixel size to 15 so you can view entire maze at once

        #### Create a new image that we pull from src folder and resize it
        #### Basically, makes it so we can view the hospital instead of blank grid
        self.bg_image = Image.open("src/floorplan1_nolegend.png")   # your background image
        self.bg_image = self.bg_image.resize((self.cols * self.cell_size, self.rows * self.cell_size))
        self.bg_photo = ImageTk.PhotoImage(self.bg_image)
        

        ## Changes to Display to Extra Credit - Sidebar with buttons to add wards to queue
        # ------------------------------------------
        # create a frame to hold canvas and sidebar
        self.main_frame = tk.Frame(root)
        self.main_frame.pack(fill=tk.BOTH, expand=True)

        #Create the canvas that we will write over
        self.canvas = tk.Canvas(self.main_frame, width=self.cols * self.cell_size, height=self.rows * self.cell_size, bg='white')
        self.canvas.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

        # sidebar on the right
        self.sidebar = tk.Frame(self.main_frame, width=220, bg='lightgrey')
        self.sidebar.pack(side=tk.RIGHT, fill=tk.Y)

        # add buttons for each ward to add to queue
        tk.Label(self.sidebar, text="Add Ward to Queue", bg='lightgrey').pack(pady=(8,2))
        for ward_name in dropoff_locations.keys():
            btn = tk.Button(self.sidebar, text=ward_name, width=24, command=lambda w=ward_name: self.add_ward_to_queue(w))
            btn.pack(pady=1)

        # listbox to display current queue
        tk.Label(self.sidebar, text="Current Queue", bg='lightgrey').pack(pady=(10,2))
        self.queue_listbox = tk.Listbox(self.sidebar, width=28, height=18)
        self.queue_listbox.pack(pady=4, fill=tk.BOTH, expand=True)

        #### Create an image as the photo that we are pulling from the folder and create a tag
        #### With the tag we move it to the lowest area so it doesn't draw over grid
        self.canvas.create_image(0, 0, anchor="nw", image=self.bg_photo, tags="bg")
        self.canvas.tag_lower("bg")

        self.draw_maze()
        
        # Lists to track success checking
        self.attempted_wards = list(delivery_locations)
        self.completed_wards =[]
        self.unreachable_wards = []

        # priority queue state used by recursive pathing
        self.pq = pq_from_input
        self.counter = counter_from_input

        # queue display watcher so the list updates as items are visited
        self._last_queue_snapshot = None
        self.update_queue_display(force=True)
        self.start_queue_watcher(interval_ms=200)
        self.start_agent_queue_monitor(interval_ms=300)

    # Define Manhattan distance heuristic for determining distance
    def heuristic(self, pos, goals):
        return min(abs(pos[0] - gx) + abs(pos[1] - gy) for gx, gy in goals)

    #Function definition to monitor the queue to see if anything new is being added by buttons. 
    def start_agent_queue_monitor(self, interval_ms=300):
    #Runs to see if something is in the queue
        if not getattr(self, "_agent_running", False) and not self.pq.empty():
            self._agent_running = True
    #Function to call recursive_pathing again and check our success logic if in queue
            def run_route():
                try:
                # Start from wherever the agent currently is
                    recursive_pathing(self, self.agent_pos, self.pq, self.dropoff_locations)
                finally:
                # Mark done
                    self._agent_running = False
                    status = self.check_success(self.attempted_wards, self.completed_wards, self.unreachable_wards)
                    print(status)
                    print()

            self.root.after(100, run_route)

    #Run the queue monitor at all times
        self.root.after(interval_ms, lambda: self.start_agent_queue_monitor(interval_ms))

    # add a ward to the priority queue and update the display
    def add_ward_to_queue(self, ward_name):
        if ward_name not in self.valid_wards:
            return
        self.pq.put((-self.priority.get(ward_name, float('inf')), self.counter, ward_name))
        self.counter += 1
        self.attempted_wards.append(ward_name)
        print(f"{ward_name} added to queue")
        print()
        self.update_queue_display(force=True)

    # take a snapshot of the queue for display
    def queue_snapshot(self):
        items = list(self.pq.queue)
        items_sorted = sorted(items)
        return tuple(f"{w} (priority {-neg_p})" for neg_p, _, w in items_sorted)

    # update the sidebar listbox if the queue changed
    def update_queue_display(self, force=False):
        snap = self.queue_snapshot()
        if (not force) and snap == self._last_queue_snapshot:
            return
        self.queue_listbox.delete(0, tk.END)
        for line in snap:
            self.queue_listbox.insert(tk.END, line)
        self._last_queue_snapshot = snap

    # refresh the queue listbox periodically
    def start_queue_watcher(self, interval_ms=200):
        self.update_queue_display(force=False)
        self.root.after(interval_ms, lambda: self.start_queue_watcher(interval_ms))

 
    # Reset all cell costs/parents before each new A* run. 
    # Because we want to ensure that the algorithm starts fresh for each pathfinding attempt.
    def reset_cells(self):
        for x in range(self.rows):
            for y in range(self.cols):
                c = self.cells[x][y]
                c.g = float("inf")
                c.h = 0
                c.f = float("inf")
                c.parent = None

    # Reconstruct path from start to goal as a list of (x,y) tuples
    def reconstruct_path_list(self, goal_cell):
        # Return path as list of (x,y) from start to goal
        path =[]
        current = goal_cell
        while current:
            path.append((current.x, current.y))
            current = current.parent
        path.reverse()  # reverse to get path from start to goal
        return path

    #Primary function
    #Finds the shortest path based on the goal states
    def find_path(self, start, goals):
        self.reset_cells()  # Reset cell costs and parents before each run

        sx, sy = start
        start_cell = self.cells[sx][sy]
        start_cell.g = 0
        start_cell.h = 0 if self.algorithm in self.dijkstra_names else self.heuristic(start, goals)
        start_cell.f = start_cell.g + start_cell.h

        #Declare the priority queue
        open_set = PriorityQueue()
        open_set.put((start_cell.f, start))

        # Initialize the visited set to keep track of explored nodes
        visited = set()
        goals_set = set(goals)  # Convert goals to a set for O(1) lookups

        #find best path based on start state and heuristic
        while not open_set.empty():
            _, (cx, cy) = open_set.get()
            if (cx, cy) in visited:
                continue
            visited.add((cx, cy))

            current_cell = self.cells[cx][cy]

            if (cx, cy) in goals_set:
                path = self.reconstruct_path_list(current_cell)
                return path, (cx,cy)
            
            for dx, dy in [(0, 1), (0, -1), (1, 0), (-1, 0)]:
                nx, ny = cx + dx, cy + dy
                if not (0 <= nx < self.rows and 0 <= ny < self.cols):
                    continue
                neighbor = self.cells[nx][ny]
                if neighbor.is_wall:
                    continue

                tentative_g = current_cell.g + 1
                if tentative_g < neighbor.g:
                    neighbor.parent = current_cell
                    neighbor.g = tentative_g
                    if self.algorithm in self.dijkstra_names:
                        neighbor.h = 0
                    else:
                        neighbor.h = self.heuristic((nx, ny), goals)
                    neighbor.f = neighbor.g + neighbor.h
                    open_set.put((neighbor.f, (nx, ny)))

        return None, None  # No path found        
    
    def draw_path(self, path, color):
        # Draw a list of coordinates onto the canvas, while keeping previous paths.
        for x, y in path:
            self.canvas.create_rectangle(
                y * self.cell_size, 
                x * self.cell_size, 
                (y + 1) * self.cell_size, 
                (x + 1) * self.cell_size, fill=color)
            self.root.update()     # force redraw
            time.sleep(0.1)        # pause for animation (adjust speed) (makes it look like agent is moving)

    #Assign possible directions that agent can move. 
    def move_agent(self, event):
    
        #### Move right, if possible
        if event.keysym == 'Right' and self.agent_pos[1] + 1 < self.cols and not self.cells[self.agent_pos[0]][self.agent_pos[1] + 1].is_wall:
            self.agent_pos = (self.agent_pos[0], self.agent_pos[1] + 1)

        #### Move Left, if possible            
        elif event.keysym == 'Left' and self.agent_pos[1] - 1 >= 0 and not self.cells[self.agent_pos[0]][self.agent_pos[1] - 1].is_wall:
            self.agent_pos = (self.agent_pos[0], self.agent_pos[1] - 1)
        
        #### Move Down, if possible
        elif event.keysym == 'Down' and self.agent_pos[0] + 1 < self.rows and not self.cells[self.agent_pos[0] + 1][self.agent_pos[1]].is_wall:
            self.agent_pos = (self.agent_pos[0] + 1, self.agent_pos[1])

        #### Move Up, if possible   
        elif event.keysym == 'Up' and self.agent_pos[0] - 1 >= 0 and not self.cells[self.agent_pos[0] - 1][self.agent_pos[1]].is_wall:
            self.agent_pos = (self.agent_pos[0] - 1, self.agent_pos[1])

        #### Erase agent from the previous cell at time t
        self.canvas.delete("agent")

        ### Redraw the agent in color navy in the new cell position at time t+1
        self.canvas.create_rectangle(self.agent_pos[1] * self.cell_size, self.agent_pos[0] * self.cell_size, 
                                    (self.agent_pos[1] + 1) * self.cell_size, (self.agent_pos[0] + 1) * self.cell_size, 
                                    fill='navy', tags="agent")

    # Draw the maze grid on the canvas
    def draw_maze(self):
        for x in range(self.rows):
            for y in range(self.cols):
                color = '' if self.maze[x][y] == 1 else ''
                self.canvas.create_rectangle(
                    y * self.cell_size,
                    x * self.cell_size,
                    (y + 1) * self.cell_size,
                    (x + 1) * self.cell_size,
                    fill=color
                )

