import semantic_kernel as sk
from semantic_kernel.connectors.ai.open_ai import (
    AzureTextCompletion,
)
from semantic_kernel.core_skills import ConversationSummarySkill


def setup_kernel(deployment, api_key, endpoint):
    kernel = sk.Kernel()

    deployment = "text-davinci-003"
    kernel.add_text_completion_service(
        deployment, AzureTextCompletion(deployment, endpoint=endpoint, api_key=api_key)
    )
    
    kernel.import_skill(
        ConversationSummarySkill(kernel=kernel), skill_name="ConversationSummaryPlugin"
    )

    plugins_directory = "./backend/sk/plugins"
    kernel.import_semantic_skill_from_directory(
        plugins_directory, "draft_documents"
    )

    return kernel
