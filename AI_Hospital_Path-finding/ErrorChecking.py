import sys

# options for algorithm names
accepted_algorithm_names = ["A","a","A*","a*","AStar", "astar", "Astar", "aSTAR",
                            "d", "D", "dijkstra's", "Dijkstra's", "dijkstras", "Dijkstras", "DIJKSTRAS"]
# options for just Dijkstra's
dijkstra_names = ["d","D","dijkstra's","Dijkstra's","dijkstras","Dijkstras","DIJKSTRAS"]

# validating the starting location
def validate_start_location(start_location, floor):

    # must be a tuple with two integers
    if (not isinstance(start_location, tuple) or
        len(start_location) != 2 or
        not all(isinstance(n,int) for n in start_location)):
        print()
        print("ERROR: Invalid start location format.")
        print("Start location must be in the form (row, col). Example: (0,0)")
        print()
        sys.exit(1)

    # checking that the location is in the bounds of the maze
    sx, sy = start_location
    if not (0 <= sx < len(floor) and 0 <= sy < len(floor[0])):
        print()
        print(f"ERROR: Start location {start_location} is outside the floor plan bounds.")
        print(f"Valid row range: 0 to {len(floor)-1}; Valid columnn range: 0 to {len(floor[0])-1}.")
        print()
        sys.exit(1)

    # check that it corresponds to an open cell (0 on floor plan grid)
    if floor[sx][sy] != 0:
        print()
        print(f"ERROR: Start location {start_location} is located on a wall or invalid cell.")
        print("Start location must correspond to a 0 in the floor matrix.")
        print("Some suggested starting locations: (0,0),(41,0),(11,5),(29,5),(45,5),(29,29),(26,30),(0,38)")
        print()
        sys.exit(1)

# check if algorithm is valid
def validate_algorithm(algorithm):
    if algorithm not in accepted_algorithm_names:
        print()
        print("ERROR: Delivery algorithm not recognized. Please use A* or Dijkstra's.")
        print("ACCEPTED NAMES:", accepted_algorithm_names)
        print()
        sys.exit(1)

# check if all delivery locations are valid
def validate_delivery_locations(delivery_locations, valid_wards):
    for ward in delivery_locations:
        if ward not in valid_wards:
            print()
            print(f"ERROR: Invalid delivery location '{ward}' found in input file.")
            print("VALID WARDS:", valid_wards)
            print()
            sys.exit(1)