#!/bin/bash
# port-doctor.sh
#
# This script is designed to help check if a set of local network ports are available to use.
# It is intended to be used by developers of networked applications to help debug port conflicts.
# It will print the status of each port in the range of ports specified by the user.
#
# If the -k flag is specified, the script will attempt kill each process using a specified port.
# Usage:
#  port-doctor.sh [-k] [port1] [port2] [port3] ...

set -euo pipefail # Be strict.

# Check if the user has specified the -k flag.

if [ "${1:-}" = "-k" ]; then
	killmode=true
	shift
fi

# Check if the user has specified a range of ports to check.
# If not, print usage information and exit.
# Otherwise, store the range of ports in an array.

if [ $# -eq 0 ]; then
  echo "Usage: port-doctor.sh [-k] [port1] [port2] [port3] ..."
  exit 1
else
  ports=("$@")
fi

function is_port_available() {
  # Check if the port is available to use.
  # If the port is available, returns empty string.
  # If the port is not available, returns the process using the port.
  # Hint: use the lsof command to check if the port is in use.
  local port="${1}"

  if lsof -Pi :"${port}" -sTCP:LISTEN -t >/dev/null ; then
    # if port is in use, return the process using the port
    lsof -Pi :"${port}" -sTCP:LISTEN -t
  else
    # if port is not in use, return empty string
    echo ""
  fi
}

# Iterate through the array of ports.
# For each port, check if the port is available to use.
# If the port is available, print a message saying so.
# If the port is not available, print a message saying so and print the process using the port.

for port in "${ports[@]}"; do
  if [ -z "$(is_port_available "${port}")" ]; then
    echo "Port ${port} is available to use."
  else
	# print in red/bold:
    echo -e "\033[1;31mPort ${port} is not available to use. Process using port: $(is_port_available "${port}")\033[0m"
	if [ "${killmode:-}" = true ]; then
		echo "Attempting to kill process using port ${port}..."
		# kill the process using the port
		kill "$(is_port_available "${port}")"
	fi
  fi
done

