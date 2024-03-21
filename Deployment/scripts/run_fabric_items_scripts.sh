#!/bin/bash
echo "started the script"

# Variables
baseUrl="$1"
keyvaultName="$2"
fabricWorkspaceId="$3"
requirementFile="requirements.txt"
requirementFileUrl=${baseUrl}"Deployment/scripts/fabric_scripts/requirements.txt"

echo "Download Started"

# Download the create_index python files
curl --output "create_fabric_items.py" ${baseUrl}"Deployment/scripts/fabric_scripts/create_fabric_items.py"

curl --output "create_articles_index.ipynb" ${baseUrl}"Deployment/scripts/fabric_scripts/notebooks/create_articles_index.ipynb"

# Download the requirement file
curl --output "$requirementFile" "$requirementFileUrl"

echo "Download completed"

#Replace key vault name 
sed -i "s/kv_to-be-replaced/${keyvaultName}/g" "create_fabric_items.py"
sed -i "s/workspaceId_to-be-replaced/${fabricWorkspaceId}/g" "create_fabric_items.py"

pip install -r requirements.txt

python create_fabric_items.py
