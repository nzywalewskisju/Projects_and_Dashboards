import sys
def parse_delivery_file(filename):
    """
    Parses a delivery configuration file and extracts:
    - algorithm (string)
    - start_location (tuple of ints)
    - delivery_locations (list of strings)
    """
    data = {}


#Open file with try statement to ensure a graceful fail
    try:
        with open(filename, 'r') as file:
            for line in file:
                line = line.strip()
                if not line or ':' not in line:
                    continue  # skip empty or malformed lines
#Delimt by colon so we can find certain parts of input, include algorithm and location
                key, value = [part.strip() for part in line.split(':', 1)]

                if key == "Delivery Algorithm":
                    data["algorithm"] = value
                elif key == "Start Location":
                    # Expecting format like (0,0)
                    value = value.strip("()")
                    try:
                        x, y = map(int, value.split(','))
                        data["start_location"] = (x, y)
                    except ValueError:
                        print(f"Warning: Invalid start location format: {value}")
                        data["start_location"] = None
                elif key == "Delivery Locations":
                    # Split by commas and strip spaces
                    locations = [loc.strip() for loc in value.split(',') if loc.strip()]
                    data["delivery_locations"] = locations

        return data
#Throw exception if there is a file handling error
    except FileNotFoundError:
        print(f"Error: The file '{filename}' was not found.")
        sys.exit(1)
        return {}
    except Exception as e:
        print(f"An error occurred while reading '{filename}': {e}")
        return {}