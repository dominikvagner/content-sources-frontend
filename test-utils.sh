#!/bin/bash

COMMAND="$1" # setup | setup-dev | update | remove
ARG1="$2"
SUBMODULE_PATH="_playwright-tests/test-utils"

function print_out_usage {
  cat <<EOF
Usage: ./test_utils.sh {setup | setup-dev [fork-url] | update | remove}
EOF
}

if [[ ! ("${COMMAND}" == "setup" || "${COMMAND}" == "setup-dev" || "${COMMAND}" == "update" || "${COMMAND}" == "remove") ]]; then
  echo "error: unsupported or missing argument" >&2
  print_out_usage >&2
  exit 1
fi

if [ "${COMMAND}" == "setup" ]; then
  # Ensure the script is run from the root of the repository
  if [[ ! -d ".git" && ! -f "test-utils.sh" ]]; then
    echo "Please run this script from the root of the repository."
    exit 1
  fi

  # Initialize and update the submodule
  git submodule update --init --recursive

  # Navigate to the submodule directory
  cd "${SUBMODULE_PATH}" || exit 1

  # Enable sparse-checkout and set the desired folder
  git sparse-checkout init --cone
  git sparse-checkout set "${SUBMODULE_PATH}"

  git remote add origin "https://github.com/content-services/content-sources-backend.git"
  git switch main

  echo "Sparse checkout configured successfully."
fi

if [ "${COMMAND}" == "setup-dev" ]; then
  if [[ ! -d ".git" && ! -f "test-utils.sh" ]]; then
    echo "Please run this script from the root of the frontend repository."
    exit 1
  fi
  if [ "${ARG1}" == "" ]; then
    echo "Please provide the fork's URL."
    exit 1
  fi

  git submodule update --init --recursive

  # Navigate to the submodule directory
  cd "${SUBMODULE_PATH}" || exit 1

  # Enable sparse-checkout and set the desired folder
  git sparse-checkout init --cone
  git sparse-checkout set "${SUBMODULE_PATH}"

  git remote add origin "${ARG1}"
  git remote add upstream "https://github.com/content-services/content-sources-backend.git"
  git switch main
fi

if [ "${COMMAND}" == "update" ]; then
  # Ensure the script is run from the root of the repository
  if [[ ! -d ".git" && ! -f "test-utils.sh" ]]; then
    echo "Please run this script from the root of the frontend repository."
    exit 1
  fi

  git submodule update --remote --rebase "_playwright-tests/test-utils"
fi

if [ "${COMMAND}" == "remove" ]; then
  # Ensure the script is run from the root of the repository
  if [[ ! -d ".git" && ! -f "test-utils.sh" ]]; then
    echo "Please run this script from the root of the frontend repository."
    exit 1
  fi

  # Navigate to the submodule directory
  cd "${SUBMODULE_PATH}" || exit 1

  # Reset any changes in the submodule
  git reset --hard HEAD
  git clean -fdx
  git remote rm origin
  git remote rm upstream

  # Reinitialize the submodule to ensure it is in a clean state
  cd - || exit
  git submodule deinit -f "${SUBMODULE_PATH}"
  rm -rf "${SUBMODULE_PATH}"
  git submodule update --init --recursive "${SUBMODULE_PATH}"
fi
