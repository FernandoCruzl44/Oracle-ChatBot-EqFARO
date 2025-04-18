#!/bin/bash
set -e # Exit immediately if a command exits with a non-zero status.
set -u # Treat unset variables as an error when substituting.
set -o pipefail # Causes a pipeline to return the exit status of the last command in the pipe that returned a non-zero return value.

# Function to print JSON responses for debugging
print_json_response() {
  local operation=$1
  local content=$2
  
  echo "==== BEGIN JSON RESPONSE: $operation ===="
  echo "$content" | jq '.' || echo "$content"  # Use jq if available, otherwise print raw
  echo "==== END JSON RESPONSE: $operation ===="
}

# Setup cleanup function to run on script exit
cleanup() {
  local exit_code=$?
  echo "Performing cleanup..."
  # Remove the Docker image built by this script
  if docker image inspect faroimage >/dev/null 2>&1; then
    echo "Removing Docker image 'faroimage'..."
    docker rmi faroimage || echo "Failed to remove Docker image 'faroimage'"
  fi
  
  # If we tagged our image with a repository path, remove that too
  if [ -n "${FULL_IMAGE_PATH:-}" ] && docker image inspect "$FULL_IMAGE_PATH" >/dev/null 2>&1; then
    echo "Removing Docker image '$FULL_IMAGE_PATH'..."
    docker rmi "$FULL_IMAGE_PATH" || echo "Failed to remove Docker image '$FULL_IMAGE_PATH'"
  fi
  
  echo "Cleanup complete."
  if [ $exit_code -ne 0 ]; then
    echo "Script failed with exit code $exit_code"
  else
    echo "Script completed successfully."
  fi
  exit $exit_code
}

# Register the cleanup function to run on script exit
trap cleanup EXIT

# --- Configuration ---
# Required: Set these variables before running the script
# OCID of the Compartment where the resources reside
COMPARTMENT_OCID="ocid1.compartment.oc1..aaaaaaaaxtitswqnld7pbe2jep4aegof5f44dz63enrnqe4ypfx4gt2tqbpa"
# OCID of the Subnet for the new Container Instance VNIC
SUBNET_OCID="ocid1.subnet.oc1.mx-queretaro-1.aaaaaaaaopics37peozj52bp7zdal2bp5bqooqmyahi36gsilqwfkbgegsua"
# Display name for the Container Instance (used for finding the old one and naming the new one)
CONTAINER_INSTANCE_DISPLAY_NAME="auth-wip"
# The name of the backend set in your load balancer
BACKEND_SET_NAME="bs_lb_2025-0408-2101"
# The port your application listens on inside the container
CONTAINER_PORT="8080"
# The OCID of the load balancer to update
LOAD_BALANCER_OCID="ocid1.loadbalancer.oc1.mx-queretaro-1.aaaaaaaafbcrdf64gyvvbmrfa4shnch56vkib5cqwyrckn5i4sii4tcqlhda"

# --- Check Configuration ---
if [ "$COMPARTMENT_OCID" == "<YOUR_COMPARTMENT_OCID>" ] || \
   [ "$SUBNET_OCID" == "<YOUR_SUBNET_OCID>" ]; then
  echo "Error: Please replace the placeholder values (<YOUR_...>) for COMPARTMENT_OCID and SUBNET_OCID."
  exit 1
fi

echo "--- Starting Build and Push Process ---"

# 1. Build the application
echo "Building application..."
rm -rf target
mvn verify

# 2. Build Docker image
echo "Building Docker image..."
docker buildx build --platform linux/amd64 --provenance=false -f Dockerfile -t faroimage .

# 3. Set the OCI registry variables
REGISTRY="mx-queretaro-1.ocir.io"
NAMESPACE="axco8elk7e3y"
RUN_NAME="faro"
# SUFFIX=$(openssl rand -hex 2)
IMAGE_NAME="oraclechatbot" #/$SUFFIX"
TAG=$(date +%s-auth-wip)

# Full path for the new image
FULL_IMAGE_PATH="$REGISTRY/$NAMESPACE/$RUN_NAME/$IMAGE_NAME:$TAG"

# Delete and recreate the repository before pushing
echo "--- Deleting and recreating repository ---"
REPO_PATH="$RUN_NAME/$IMAGE_NAME"
echo "Checking if repository $REPO_PATH exists..."

# List repositories
echo "Listing repositories with path $REPO_PATH..."
REPO_LIST=$(oci artifacts container repository list \
    --compartment-id "$COMPARTMENT_OCID" \
    --all \
    --output json)

# Print the repository list response
print_json_response "Repository List" "$REPO_LIST"

# Based on the actual JSON structure, extract matching repos - note the data.items path
echo "Parsing repository list..."
MATCHING_REPOS=$(echo "$REPO_LIST" | jq -r --arg repo "$REPO_PATH" '.data.items[] | select(."display-name" == $repo) | .id')

if [ -n "$MATCHING_REPOS" ]; then
    echo "Found matching repository with OCIDs: $MATCHING_REPOS"
    for REPO_OCID in $MATCHING_REPOS; do
        echo "Deleting repository with OCID $REPO_OCID..."
        oci artifacts container repository delete \
            --repository-id "$REPO_OCID" \
            --force || echo "Failed to delete repository with OCID $REPO_OCID, continuing..."
        
        # Wait for deletion to complete
        echo "Waiting for repository deletion to complete..."
        sleep 15
    done
else
    echo "No existing repositories found matching $REPO_PATH."
fi

# 4. Tag and push the image
echo "Tagging image: $FULL_IMAGE_PATH"
docker tag faroimage "$FULL_IMAGE_PATH"

# Create the repository if it doesn't exist
echo "Creating new repository $REPO_PATH..."
oci artifacts container repository create \
    --compartment-id "$COMPARTMENT_OCID" \
    --display-name "$REPO_PATH" \
    --is-public true || echo "Repository creation failed, might already exist."

echo "Pushing image to OCI registry..."
if docker push "$FULL_IMAGE_PATH"; then
    echo "Successfully pushed image: $FULL_IMAGE_PATH"
else
    echo "Push failed after repository creation attempt. Exiting."
    exit 1
fi

echo "--- Starting Container Instance Replacement and Load Balancer Update ---"

# 5. Find the existing Container Instance OCID by display name
echo "Searching for existing container instance named '$CONTAINER_INSTANCE_DISPLAY_NAME' in compartment $COMPARTMENT_OCID..."
CONTAINER_LIST_RESULT=$(oci container-instances container-instance list \
    --compartment-id "$COMPARTMENT_OCID" \
    --display-name "$CONTAINER_INSTANCE_DISPLAY_NAME" \
    --lifecycle-state "ACTIVE" \
    --output json)

print_json_response "Container Instance List" "$CONTAINER_LIST_RESULT"

OLD_CONTAINER_INSTANCE_OCID=$(echo "$CONTAINER_LIST_RESULT" | jq -r '.data.items[0].id // ""')

if [ -z "$OLD_CONTAINER_INSTANCE_OCID" ] || [ "$OLD_CONTAINER_INSTANCE_OCID" == "null" ]; then
    echo "Warning: No ACTIVE container instance found with the name '$CONTAINER_INSTANCE_DISPLAY_NAME'. Proceeding to create a new one."
    OLD_CONTAINER_INSTANCE_OCID="" # Ensure it's empty if not found
else
    echo "Found existing instance OCID: $OLD_CONTAINER_INSTANCE_OCID"
    # 6. Delete the old Container Instance
    echo "Deleting old container instance $OLD_CONTAINER_INSTANCE_OCID..."
    oci container-instances container-instance delete --container-instance-id "$OLD_CONTAINER_INSTANCE_OCID" --force || echo "Instance $OLD_CONTAINER_INSTANCE_OCID might already be deleted or deletion failed."

    echo "Waiting for old instance $OLD_CONTAINER_INSTANCE_OCID to be fully deleted..."
    while true; do
        # Attempt to get the instance status. If it returns an error (like 404 Not Found), the instance is gone.
        if ! oci container-instances container-instance get --container-instance-id "$OLD_CONTAINER_INSTANCE_OCID" > /dev/null 2>&1; then
            echo "Old instance $OLD_CONTAINER_INSTANCE_OCID successfully deleted or confirmed gone."
            break
        fi
        LIFECYCLE_STATE=$(oci container-instances container-instance get --container-instance-id "$OLD_CONTAINER_INSTANCE_OCID" --query "data.\"lifecycle-state\"" --raw-output 2>/dev/null || echo "TERMINATED") # Default to TERMINATED if get fails during termination
        echo "Old instance state: $LIFECYCLE_STATE"
        if [ "$LIFECYCLE_STATE" == "DELETED" ] || [ "$LIFECYCLE_STATE" == "TERMINATED" ]; then
             echo "Old instance $OLD_CONTAINER_INSTANCE_OCID successfully deleted."
             break
        elif [ "$LIFECYCLE_STATE" == "DELETING" ] || [ "$LIFECYCLE_STATE" == "TERMINATING" ]; then
            sleep 15 # Wait before checking again
        else
            echo "Warning: Old instance $OLD_CONTAINER_INSTANCE_OCID in unexpected state '$LIFECYCLE_STATE' during deletion check. Proceeding cautiously."
            # Depending on requirements, you might want to exit 1 here instead.
            break # Proceed assuming it might be gone or stuck
        fi
    done
fi

# 7. Create a new Container Instance
echo "Creating new container instance '$CONTAINER_INSTANCE_DISPLAY_NAME' with image $FULL_IMAGE_PATH..."

# Prepare JSON strings following Oracle CLI docs format
SHAPE_CONFIG_JSON='{
  "memoryInGBs": 4.0,
  "ocpus": 1.0
}'

CONTAINERS_JSON="[
  {
    \"displayName\": \"oracle-chatbot-container\",
    \"imageUrl\": \"$FULL_IMAGE_PATH\",
    \"ports\": [
      {
        \"port\": $CONTAINER_PORT,
        \"protocol\": \"TCP\"
      }
    ]
  }
]"

VNICS_JSON="[
  {
    \"displayName\": \"primary-vnic\",
    \"subnetId\": \"$SUBNET_OCID\",
    \"isPublicIpAssigned\": true
  }
]"

# Split the create operation from the wait operation for better debugging
echo "Starting container instance creation..."
echo "Creating container instance using OCI CLI..."

# Container creation following Oracle CLI docs format
CREATE_OUTPUT=$(oci container-instances container-instance create \
    --compartment-id "$COMPARTMENT_OCID" \
    --availability-domain "fmAa:MX-QUERETARO-1-AD-1" \
    --shape "CI.Standard.E4.Flex" \
    --shape-config "$SHAPE_CONFIG_JSON" \
    --display-name "$CONTAINER_INSTANCE_DISPLAY_NAME" \
    --containers "$CONTAINERS_JSON" \
    --vnics "$VNICS_JSON" \
    --output json)

# Print the create response
print_json_response "Container Instance Create" "$CREATE_OUTPUT"

# Extract the OCID from the response
CREATE_RESULT=$(echo "$CREATE_OUTPUT" | jq -r '.data.id // ""')

if [ -z "$CREATE_RESULT" ] || [ "$CREATE_RESULT" == "null" ]; then
    echo "Error: Failed to create container instance or retrieve its OCID."
    exit 1
fi

NEW_CONTAINER_INSTANCE_OCID="$CREATE_RESULT"
echo "Container instance creation initiated: $NEW_CONTAINER_INSTANCE_OCID"

# Now wait for container instance to become ACTIVE with a timeout
echo "Waiting for container instance to become ACTIVE..."
MAX_WAIT_ITERATIONS=30  # Approximately 5 minutes with 10 second intervals
WAIT_ITERATIONS=0
LIFECYCLE_STATE=""

while [ "$LIFECYCLE_STATE" != "ACTIVE" ] && [ $WAIT_ITERATIONS -lt $MAX_WAIT_ITERATIONS ]; do
    WAIT_ITERATIONS=$((WAIT_ITERATIONS + 1))
    echo "Checking container instance state (attempt $WAIT_ITERATIONS of $MAX_WAIT_ITERATIONS)..."
    
    GET_STATE_OUTPUT=$(oci container-instances container-instance get \
        --container-instance-id "$NEW_CONTAINER_INSTANCE_OCID" \
        --output json 2>/dev/null || echo '{"error": "Failed to get instance state"}')
    
    print_json_response "Container Instance Get State ($WAIT_ITERATIONS)" "$GET_STATE_OUTPUT"
    
    LIFECYCLE_STATE_RESULT=$(echo "$GET_STATE_OUTPUT" | jq -r '.data."lifecycle-state" // "ERROR"')
    
    if [ "$LIFECYCLE_STATE_RESULT" == "ERROR" ]; then
        echo "Error retrieving container instance state. Continuing to wait..."
    else
        LIFECYCLE_STATE="$LIFECYCLE_STATE_RESULT"
        echo "Current container instance state: $LIFECYCLE_STATE"
        
        if [ "$LIFECYCLE_STATE" == "FAILED" ]; then
            echo "Container instance creation failed."
            exit 1
        fi
    fi
    
    if [ "$LIFECYCLE_STATE" != "ACTIVE" ] && [ $WAIT_ITERATIONS -lt $MAX_WAIT_ITERATIONS ]; then
        echo "Waiting 10 seconds before checking again..."
        sleep 10
    fi
done

if [ "$LIFECYCLE_STATE" != "ACTIVE" ]; then
    echo "Timeout waiting for container instance to become ACTIVE."
    echo "Last known state: $LIFECYCLE_STATE"
    echo "You may need to manually check the status using:"
    echo "oci container-instances container-instance get --container-instance-id $NEW_CONTAINER_INSTANCE_OCID"
    exit 1
fi

echo "Successfully created new container instance: $NEW_CONTAINER_INSTANCE_OCID (State: ACTIVE)"

# 8. Get New IP Address (Instance should be ACTIVE due to --wait-for-state)
echo "Fetching IP address for new instance $NEW_CONTAINER_INSTANCE_OCID..."
# Add a small delay just in case IP assignment takes a moment after ACTIVE state
sleep 5

# Get full container instance details including VNICs
GET_IP_OUTPUT=$(oci container-instances container-instance get --container-instance-id "$NEW_CONTAINER_INSTANCE_OCID" --output json 2>/dev/null)
print_json_response "Container Instance Get IP" "$GET_IP_OUTPUT"

# Extract the VNIC ID from the response
VNIC_ID=$(echo "$GET_IP_OUTPUT" | jq -r '.data.vnics[0]."vnic-id" // ""')

if [ -z "$VNIC_ID" ] || [ "$VNIC_ID" == "null" ]; then
    echo "Error: Failed to retrieve VNIC ID from container instance details."
    exit 1
fi

echo "Found VNIC ID: $VNIC_ID"

# Use the VNIC ID to get the private IP address
echo "Retrieving IP address from VNIC details..."
VNIC_DETAILS=$(oci network vnic get --vnic-id "$VNIC_ID" --output json 2>/dev/null)
print_json_response "VNIC Details" "$VNIC_DETAILS"

# Correct field name is "private-ip", not "private-ip-address"
NEW_IP_ADDRESS=$(echo "$VNIC_DETAILS" | jq -r '.data."private-ip" // ""')

# Retry loop in case the IP isn't available immediately
MAX_RETRY=10
RETRY_COUNT=0

while [ -z "$NEW_IP_ADDRESS" ] || [ "$NEW_IP_ADDRESS" == "null" ]; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -gt $MAX_RETRY ]; then
        echo "Error: Failed to retrieve IP address after $MAX_RETRY attempts."
        exit 1
    fi
    
    echo "Waiting for IP address assignment (attempt $RETRY_COUNT of $MAX_RETRY)..."
    sleep 10
    
    VNIC_DETAILS=$(oci network vnic get --vnic-id "$VNIC_ID" --output json 2>/dev/null)
    print_json_response "VNIC Details Retry $RETRY_COUNT" "$VNIC_DETAILS"
    
    # Using the correct field name
    NEW_IP_ADDRESS=$(echo "$VNIC_DETAILS" | jq -r '.data."private-ip" // ""')
done

echo "Successfully retrieved private IP address: $NEW_IP_ADDRESS"

# 9. Update Load Balancer Backend Set
echo "Updating Load Balancer $LOAD_BALANCER_OCID, Backend Set $BACKEND_SET_NAME to use IP $NEW_IP_ADDRESS:$CONTAINER_PORT..."

# First get the current backend set configuration to preserve settings
echo "Retrieving current backend set configuration..."
BACKEND_SET_DETAILS=$(oci lb backend-set get \
    --load-balancer-id "$LOAD_BALANCER_OCID" \
    --backend-set-name "$BACKEND_SET_NAME" \
    --output json)

print_json_response "Current Backend Set Details" "$BACKEND_SET_DETAILS"

# Extract current health checker details and policy - fixed jq paths to match the actual JSON structure
HEALTH_CHECKER_JSON=$(echo "$BACKEND_SET_DETAILS" | jq -r '.data["health-checker"]')
HEALTH_CHECKER_PROTOCOL=$(echo "$HEALTH_CHECKER_JSON" | jq -r '.protocol')
HEALTH_CHECKER_PORT=$(echo "$HEALTH_CHECKER_JSON" | jq -r '.port')
HEALTH_CHECKER_RETRIES=$(echo "$HEALTH_CHECKER_JSON" | jq -r '.retries')
HEALTH_CHECKER_TIMEOUT=$(echo "$HEALTH_CHECKER_JSON" | jq -r '."timeout-in-millis"')
HEALTH_CHECKER_INTERVAL=$(echo "$HEALTH_CHECKER_JSON" | jq -r '."interval-in-millis"')
HEALTH_CHECKER_URL_PATH=$(echo "$HEALTH_CHECKER_JSON" | jq -r '."url-path"')
POLICY=$(echo "$BACKEND_SET_DETAILS" | jq -r '.data.policy')

# Create JSON for the backends update
BACKENDS_JSON="[{\"ipAddress\": \"$NEW_IP_ADDRESS\", \"port\": $CONTAINER_PORT, \"weight\": 1}]"
echo "Backend configuration: $BACKENDS_JSON"

echo "Using policy: $POLICY"
echo "Health checker protocol: $HEALTH_CHECKER_PROTOCOL"
echo "Health checker port: $HEALTH_CHECKER_PORT"
echo "Health checker retries: $HEALTH_CHECKER_RETRIES"
echo "Health checker timeout: $HEALTH_CHECKER_TIMEOUT"
echo "Health checker interval: $HEALTH_CHECKER_INTERVAL"
echo "Health checker URL path: $HEALTH_CHECKER_URL_PATH"

# Add debug mode to see the exact OCI CLI command
echo "Running load balancer update with the following command:"
echo "oci lb backend-set update \\"
echo "    --load-balancer-id \"$LOAD_BALANCER_OCID\" \\"
echo "    --backend-set-name \"$BACKEND_SET_NAME\" \\"
echo "    --backends \"$BACKENDS_JSON\" \\"
echo "    --policy \"$POLICY\" \\"
echo "    --health-checker-protocol \"$HEALTH_CHECKER_PROTOCOL\" \\"
echo "    --health-checker-port \"$HEALTH_CHECKER_PORT\" \\"
echo "    --health-checker-retries \"$HEALTH_CHECKER_RETRIES\" \\"
echo "    --health-checker-timeout-in-ms \"$HEALTH_CHECKER_TIMEOUT\" \\"
echo "    --health-checker-interval-in-ms \"$HEALTH_CHECKER_INTERVAL\" \\"
echo "    --health-checker-url-path \"$HEALTH_CHECKER_URL_PATH\" \\"
echo "    --force"

# Try with a temporary run directly via the terminal and capture the output including stderr
echo "Attempting load balancer update..."
LB_UPDATE_OUTPUT=$(oci lb backend-set update \
    --load-balancer-id "$LOAD_BALANCER_OCID" \
    --backend-set-name "$BACKEND_SET_NAME" \
    --backends "$BACKENDS_JSON" \
    --policy "$POLICY" \
    --health-checker-protocol "$HEALTH_CHECKER_PROTOCOL" \
    --health-checker-port "$HEALTH_CHECKER_PORT" \
    --health-checker-retries "$HEALTH_CHECKER_RETRIES" \
    --health-checker-timeout-in-ms "$HEALTH_CHECKER_TIMEOUT" \
    --health-checker-interval-in-ms "$HEALTH_CHECKER_INTERVAL" \
    --health-checker-url-path "$HEALTH_CHECKER_URL_PATH" \
    --force \
    --output json 2>&1)

# Check if there was an error
UPDATE_EXIT_CODE=$?
if [ $UPDATE_EXIT_CODE -ne 0 ]; then
    echo "Error: Load balancer update failed with exit code $UPDATE_EXIT_CODE"
    echo "Error output: $LB_UPDATE_OUTPUT"

    exit 1 # Exit if the update fails
    
    # # Additional check for common errors
    # if echo "$LB_UPDATE_OUTPUT" | grep -q "missing required parameters"; then
    #     echo "Missing required parameters detected. Trying with additional required parameters..."
        
    #     # Try with additional parameters that might be required
    #     echo "Attempting with additional health-checker parameters..."
    #     LB_UPDATE_OUTPUT=$(oci lb backend-set update \
    #         --load-balancer-id "$LOAD_BALANCER_OCID" \
    #         --backend-set-name "$BACKEND_SET_NAME" \
    #         --backends "$BACKENDS_JSON" \
    #         --policy "$POLICY" \
    #         --health-checker-protocol "$HEALTH_CHECKER_PROTOCOL" \
    #         --health-checker-port "$HEALTH_CHECKER_PORT" \
    #         --health-checker-retries "$HEALTH_CHECKER_RETRIES" \
    #         --health-checker-timeout-in-millis "$HEALTH_CHECKER_TIMEOUT" \
    #         --health-checker-interval-in-millis "$HEALTH_CHECKER_INTERVAL" \
    #         --health-checker-url-path "$HEALTH_CHECKER_URL_PATH" \
    #         --health-checker-return-code 200 \
    #         --force \
    #         --output json 2>&1)
        
    #     UPDATE_EXIT_CODE=$?
    #     if [ $UPDATE_EXIT_CODE -ne 0 ]; then
    #         echo "Error: Load balancer update failed again with exit code $UPDATE_EXIT_CODE"
    #         echo "Error output: $LB_UPDATE_OUTPUT"
    #         exit 1
    #     fi
    # else
    #     exit 1
    # fi
fi

print_json_response "Load Balancer Backend Set Update" "$LB_UPDATE_OUTPUT"

echo "Load Balancer Backend Set update initiated, waiting for completion..."
# Extract work request ID if available - fix the jq syntax
WORK_REQUEST_ID=$(echo "$LB_UPDATE_OUTPUT" | grep -o "ocid1.loadbalancerworkrequest[^\"]*" || echo "")

if [ -n "$WORK_REQUEST_ID" ]; then
    echo "Monitoring work request: $WORK_REQUEST_ID"
    
    # Poll work request status
    MAX_WAIT_WORK_REQUEST=30  # 30 attempts, 10 seconds apart = 5 minutes
    for ((i=1; i<=MAX_WAIT_WORK_REQUEST; i++)); do
        echo "Checking work request status (attempt $i of $MAX_WAIT_WORK_REQUEST)..."
        
        WORK_REQUEST_OUTPUT=$(oci lb work-request get \
            --work-request-id "$WORK_REQUEST_ID" \
            --output json 2>&1)
            
        WORK_REQUEST_EXIT_CODE=$?
        if [ $WORK_REQUEST_EXIT_CODE -ne 0 ]; then
            echo "Error checking work request status: $WORK_REQUEST_OUTPUT"
            echo "Will try again..."
            sleep 10
            continue
        fi
            
        print_json_response "Load Balancer Work Request ($i)" "$WORK_REQUEST_OUTPUT"
        
        # Extract state using grep instead of jq to avoid potential issues
        WORK_REQUEST_STATE=$(echo "$WORK_REQUEST_OUTPUT" | grep -o '"lifecycle-state"[[:space:]]*:[[:space:]]*"[^"]*"' | grep -o '"[^"]*"$' | tr -d '"' || echo "UNKNOWN")
        echo "Current work request state: $WORK_REQUEST_STATE"
        
        if [ "$WORK_REQUEST_STATE" == "SUCCEEDED" ]; then
            echo "Load Balancer update completed successfully."
            break
        elif [ "$WORK_REQUEST_STATE" == "FAILED" ]; then
            echo "Load Balancer update failed."
            ERROR_MESSAGE=$(echo "$WORK_REQUEST_OUTPUT" | grep -o '"error-message"[[:space:]]*:[[:space:]]*"[^"]*"' | grep -o '"[^"]*"$' | tr -d '"' || echo "Unknown error")
            echo "Error message: $ERROR_MESSAGE"
            exit 1
        fi
        
        if [ "$i" -lt "$MAX_WAIT_WORK_REQUEST" ]; then
            echo "Waiting 10 seconds before checking again..."
            sleep 10
        else
            echo "Timeout waiting for Load Balancer update to complete."
            echo "Last known state: $WORK_REQUEST_STATE"
            echo "You may need to manually check the status."
            exit 1
        fi
    done
else
    echo "No work request ID received. This may indicate that the command failed silently."
    echo "Checking if backend is already updated..."
    
    # Verify if the backend is already properly configured
    VERIFY_BACKEND=$(oci lb backend-set get \
        --load-balancer-id "$LOAD_BALANCER_OCID" \
        --backend-set-name "$BACKEND_SET_NAME" \
        --output json 2>&1)
    
    print_json_response "Verify Backend Set After Update" "$VERIFY_BACKEND"
    
    # Check if our IP is in the backends
    BACKEND_IPS=$(echo "$VERIFY_BACKEND" | jq -r '.data.backends[].["ip-address"] // ""')
    if echo "$BACKEND_IPS" | grep -q "$NEW_IP_ADDRESS"; then
        echo "Backend has been successfully updated with IP $NEW_IP_ADDRESS"
    else
        echo "Backend update verification failed. Current backends: $BACKEND_IPS"
        echo "Expected to find IP: $NEW_IP_ADDRESS"
        
        # Try adding the backend instead of updating the whole backend set
        echo "Attempting to add backend directly instead of updating the whole backend set..."
        ADD_BACKEND_OUTPUT=$(oci lb backend create \
            --load-balancer-id "$LOAD_BALANCER_OCID" \
            --backend-set-name "$BACKEND_SET_NAME" \
            --ip-address "$NEW_IP_ADDRESS" \
            --port "$CONTAINER_PORT" \
            --weight 1 \
            --output json 2>&1)
        
        ADD_BACKEND_EXIT_CODE=$?
        if [ $ADD_BACKEND_EXIT_CODE -ne 0 ]; then
            echo "Error adding backend: $ADD_BACKEND_OUTPUT"
            exit 1
        fi
        
        print_json_response "Add Backend Directly" "$ADD_BACKEND_OUTPUT"
        echo "Backend added directly. Please verify in the OCI console."
    fi
fi

echo "Load Balancer Backend Set updated successfully."
echo "--- Full Deployment Process Complete ---"
echo "New Container Instance OCID: $NEW_CONTAINER_INSTANCE_OCID"
echo "New Container IP Address: $NEW_IP_ADDRESS"
