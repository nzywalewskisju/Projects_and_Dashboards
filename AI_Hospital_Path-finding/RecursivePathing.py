from src.floorplan_matrix import ward_colors


# This module implements a recursive pathing algorithm to find the optimal delivery route for a given set of delivery locations (wards) starting from a specified location. 
# The algorithm uses a helper function `choose_best_goal` to find the best path from the current location
def choose_best_goal(game, start, candidate_goals):
    best_path, best_goal = None, None # Initialize variables to keep track of the best path and corresponding goal
    best_len = float('inf') # Initialize best length to infinity for comparison

    # Iterate through each candidate goal and find the path from the start location to that goal using the game's pathfinding method. 
    # If a path exists, compare its length to the best length found so far. 
    # If it's shorter, update the best path, best goal, and best length accordingly.
    for g in candidate_goals:
        path, reached = game.find_path(start, [g]) 
        if path is not None:
            steps = len(path) - 1

            ## Compare the length of the path to the best length found so far. 
            ## This ensures that we are always keeping track of the shortest path to any of the candidate goals
            if steps < best_len:
                best_len = steps
                best_path = path
                best_goal = reached
    
    return best_path, best_goal

#Recursive pathing function to find the best path to the next ward in the list
def recursive_pathing(game, start, remaining_wards, dropoff_locations, leg_index=0):
    if remaining_wards.empty():
        return start
    
#Pop next ward in the list and follow the wards in order
    _, _, ward = remaining_wards.get()
    candidates = dropoff_locations.get(ward, [])

#Check if drop is misconfigured - if so, just skip it
    if not candidates:
        print(f"[WARN] No drop-off cells configured for ward '{ward}'. Skipping.")
        print()
        return recursive_pathing(game, start, remaining_wards, dropoff_locations, leg_index)
    
    #Use choose_best_goal function to find the best goal to pursue then start new recursion
    path, goal = choose_best_goal(game, start, candidates)
    if path is None:
        print(f"Ward '{ward}' unreachable from {start}. Skipping.")
        print()
        return recursive_pathing(game, start, remaining_wards, dropoff_locations, leg_index)
    
    # Draw this leg of the path
    cur_color = ward_colors.get(ward) # change color of path based on ward destination

    game.draw_path(path, cur_color)

    #Update agent position to be the last goal position, so that when we add things to the queue the agent will start
    #From last known location. This makes it so the buttons will work as intended. 
    game.agent_pos = goal
    game.completed_wards.append(ward)
    print(f"Successful delivery to: {ward}")

    # Safely peek at remaining wards (without removing them)
    remaining_items = list(remaining_wards.queue)  # access internal list copy
    remaining_names = [item[2] for item in sorted(remaining_items)]
    print(f"Remaining wards in queue: {remaining_names}")
    print()


    # Recursively call the function to find the next path from the current goal to the next ward in the list, 
    # until all wards have been visited
    return recursive_pathing(game, goal, remaining_wards, dropoff_locations, leg_index + 1)