#Get Azure Key Vault Client

key_vault_name = 'kv_to-be-replaced'
subscription_id='subscription_to-be-replaced'
resource_group_name = 'rg_to-be-replaced'
aihub_name = 'nc_testhub' + 'solutionname_to-be-replaced'
project_name='nc_testhub' + 'solutionname_to-be-replaced'
deployment_name = 'nctestpydeployment3'

from azure.ai.resources.entities import Project, AIResource
from azure.core.exceptions import ResourceNotFoundError


from azure.ai.resources.client import AIClient
from azure.identity import DefaultAzureCredential

ai_client = AIClient(
    credential=DefaultAzureCredential(),
    subscription_id=subscription_id,
    resource_group_name='nctestbiceprg2'
    #,project_name='nachandh-6763'
)

created_resource = ai_client.ai_resources.begin_create(ai_resource=AIResource(name=aihub_name)).result()

# Create project with above AI resource as parent.
new_local_project = Project(
    name=project_name,
    ai_resource=created_resource.id,
    description="AI Hub project",
)
created_project = ai_client.projects.begin_create(project=new_local_project).result()
print(created_project.name)
