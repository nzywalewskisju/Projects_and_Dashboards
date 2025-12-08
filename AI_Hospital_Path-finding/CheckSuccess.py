
#Declare function for checking success. 
#Basically, checks if the agent could reach all wards or not
def check_success(all_wards, completed_wards, unreachable_wards=()):
    total = len(all_wards)
    done = len(completed_wards)

    if done == 0:
        return "FAILURE"
    elif done < total:
        return "PARTIAL SUCCESS"
    else:
        return "SUCCESS"