#######################################################
#### MazeGame uses a grid of rows X cols to demonstrate
#### pathfinding using A*.
####
#######################################################
import tkinter as tk
from PIL import Image, ImageTk
import sys
import time
from queue import PriorityQueue

# Importing from other files
from ErrorChecking import dijkstra_names
from ErrorChecking import validate_start_location, validate_algorithm, validate_delivery_locations
from InputParse import parse_delivery_file
from src.floorplan_matrix import floor, dropoff_locations, valid_wards, priority
from AlgorithmGUI import Cell, MazeGame
from RecursivePathing import recursive_pathing
from CheckSuccess import check_success

# Check that a filename argument was provided
if len(sys.argv) < 2:
    print("Error: No input file passed as argument")
    sys.exit(1)

# The first argument after the script name is the file path
input_filename = sys.argv[1]

# Parse the input file
config = parse_delivery_file(input_filename)

# Use the parsed data
algorithm = config.get("algorithm")
start_location = config.get("start_location")
delivery_locations = config.get("delivery_locations")

# Useful for error checking
print()
print()
print("DELIVERY ALGORITHM:", algorithm)
print("START LOCATION:", start_location)
print("DELIVERY LOCATIONS:", delivery_locations)

# run error checking functions
validate_start_location(start_location, floor)
validate_algorithm(algorithm)
validate_delivery_locations(delivery_locations, valid_wards)

# If the robot starts on a delivery location for one of the wards in the delivery list, we fulfill that request immediately
# Iterate through all possible dropoff locations, and if a location is part of the current delivery list, then get all possible entrances for that location
# For each possible entrance, check if the start location is at that entrance.
# If so, remove that ward from the list since we are already there. Print a message and break the loop.
for ward in dropoff_locations:
    if ward in delivery_locations:
        coords = dropoff_locations.get(ward)
        for pair in coords:
            if start_location == pair:
                delivery_locations.remove(ward)
                print()
                print("Started at " + ward + ". Finished task immediately.")
                break

# build a priority queue from the delivery list so higher priority is visited first
# negative priority with a counter preserves insertion order for ties
def build_pq_from_list(wards):
    pq = PriorityQueue()
    counter = 0
    for w in wards:
        pq.put((-priority.get(w, float('inf')), counter, w))
        counter += 1
    return pq, counter

# build priority queue and counter from input delivery locations
pq_from_input, counter_from_input = build_pq_from_list(delivery_locations)
remaining_items = list(pq_from_input.queue)  # access internal list copy
remaining_names = [item[2] for item in sorted(remaining_items)]
print(f"PRIORITIZED DELIVERY LOCATIONS: {remaining_names}")
print()

# load the floorplan matrix
maze = floor

# Instanitaite the game state 
root = tk.Tk()
root.title("Path Traversed using " + algorithm + " Algorithm")

# Create the MazeGame instance with all necessary parameters
game = MazeGame(
    root=root,
    maze=floor,
    algorithm=algorithm,
    start_location=start_location,
    delivery_locations=delivery_locations,
    dropoff_locations=dropoff_locations,
    valid_wards=valid_wards,
    priority=priority,
    pq_from_input=pq_from_input,
    counter_from_input=counter_from_input,
    recursive_pathing=recursive_pathing,
    check_success=check_success,
    dijkstra_names=dijkstra_names 
)

root.bind("<KeyPress>", game.move_agent)
root.mainloop()