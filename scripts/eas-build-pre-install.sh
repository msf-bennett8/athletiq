#!/bin/bash
if [ -n "$GOOGLE_SERVICES_JSON" ]; then
  echo "$GOOGLE_SERVICES_JSON" > google-services.json
  echo "google-services.json created from environment variable"
else
  echo "GOOGLE_SERVICES_JSON environment variable not found"
fi