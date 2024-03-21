# Build your own AI Assitant Solution Accelerator

MENU: [**USER STORY**](#user-story) \| [**ONE-CLICK DEPLOY**](#one-click-deploy)  \| [**SUPPORTING DOCUMENTS**](#supporting-documents) \|
[**CUSTOMER TRUTH**](#customer-truth)

<h2><img src="Deployment/images/readMe/userStory.png" width="64">
<br/>
User story
</h2>

**Solution accelerator overview**

This solution accelerator helps build your own AI assistants quickly using Azure Open AI Service, Azure AI Search and Microsoft Fabric. While we have used Research Grant Writer Assistant as an example scenario, this can be used by any customer looking for reusable architecture and code snippets to build AI assistants with their own enterprise data.

**Scenario**

The Grant Writer assistant helps the researchers find relevant articles and grants available for their research topic easily using a conversational chatbot. It also accelerates the grant application creation process with the power of large language models(LLMs) and content generation techniques. Researcher can generate different sections of a grant application with a simple button click, then they can refine the prompts and regenerate individual sections to add more details as needed. Finally, the generated grant application can be exported as a PDF or a Microsoft Word document for further processing.

**Key features**

- **Fabric for Data Engineering at scale**  Fabric pipelines help process data mounted from Azure Storage Account at scale and add to AI search index with vector embeddings.
- **Azure AI Search as vector store** Azure AI search to enable Retrieval Augmented Generation and ground the application on collected articles and grants dataset.
- **Azure Open AI Service** Azure Open AI service to help researchers in content search, summarization and text generation for grant application drafts.
- **Azure AI Studio** AI Studio to help build the chat and text generation flow deployments easily and to also validate and improve the LLM responses.
- **Prompt Flow Evaluation** Promptflow evaluation tools to help test the flows for relevance,groundedness and any harmful content generation.

**Below is an image of the solution accelerator.**
    ![Landing Page](/Deployment/images/readMe/landing_page.png)


<h2><img src="Deployment/images/readMe/oneClickDeploy.png" width="64">
<br/>
One-click deploy
</h2>

### Prerequisites

To use this solution accelerator, you will need access to an [Azure subscription](https://azure.microsoft.com/free/) with permission to create resource groups and resources. While not required, a prior understanding of Azure Open AI, Azure AI Search and Microsoft Fabric will be helpful.

For additional training and support, please see:

1. [Azure Open AI](https://learn.microsoft.com/en-us/azure/ai-services/openai/) 
2. [Azure AI Search](https://learn.microsoft.com/en-us/azure/search/) 
3. [Microsoft Fabric](https://learn.microsoft.com/en-us/fabric/) 

### Solution accelerator architecture
![image](/Deployment/images/readMe/architecture.png)

### **How to install/deploy**

1. Click the following deployment button to create the required resources for this accelerator in your Azure Subscription.

   [![Deploy to Azure](https://aka.ms/deploytoazurebutton)](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2Fnchandhi%2Fncbyctestrepo%2Fmain%2FDeployment%2Fbicep%2Fmain.json)

2. You will need to select an Azure Subscription, create/select a Resource group, Region and a unique Solution Prefix.

   ![image](/Deployment/images/readMe/armDeployment.png)

3. When deployment is complete, launch the application by navigating to
    your Azure resource group, choosing the app service resource, and
    clicking on the default domain. You should bookmark this URL to have quick access to your deployed application.

4. Follow steps in [AI Studio Deployment guide](./Deployment/AIStudioDeployment.md) to set up the grant draft proposal endpoint.

5. Follow steps in [Fabric Deployment guide](./Deployment/FabricPipelines.md) to set up the data processing pipelines.

6. Follow steps in [Promptflow Evaluation guide](./Deployment/PromptFlowEvaluation.md) to set up the the evaluation flows.



<br/>
<br>
<h2><img src="Deployment/images/readMe/customerTruth.png" width="64">
</br>
Customer truth
</h2>
Customer stories coming soon. For early access, contact CSA CTO team.

<br/>
<br/>
<br/>

---

## Disclaimers

This Software requires the use of third-party components which are governed by separate proprietary or open-source licenses as identified below, and you must comply with the terms of each applicable license in order to use the Software. You acknowledge and agree that this license does not grant you a license or other right to use any such third-party proprietary or open-source components.  

To the extent that the Software includes components or code used in or derived from Microsoft products or services, including without limitation Microsoft Azure Services (collectively, “Microsoft Products and Services”), you must also comply with the Product Terms applicable to such Microsoft Products and Services. You acknowledge and agree that the license governing the Software does not grant you a license or other right to use Microsoft Products and Services. Nothing in the license or this ReadMe file will serve to supersede, amend, terminate or modify any terms in the Product Terms for any Microsoft Products and Services. 

You must also comply with all domestic and international export laws and regulations that apply to the Software, which include restrictions on destinations, end users, and end use. For further information on export restrictions, visit https://aka.ms/exporting. 

You acknowledge that the Software and Microsoft Products and Services (1) are not designed, intended or made available as a medical device(s), and (2) are not designed or intended to be a substitute for professional medical advice, diagnosis, treatment, or judgment and should not be used to replace or as a substitute for professional medical advice, diagnosis, treatment, or judgment. Customer is solely responsible for displaying and/or obtaining appropriate consents, warnings, disclaimers, and acknowledgements to end users of Customer’s implementation of the Online Services. 

You acknowledge the Software is not subject to SOC 1 and SOC 2 compliance audits. No Microsoft technology, nor any of its component technologies, including the Software, is intended or made available as a substitute for the professional advice, opinion, or judgement of a certified financial services professional. Do not use the Software to replace, substitute, or provide professional financial advice or judgment.  

BY ACCESSING OR USING THE SOFTWARE, YOU ACKNOWLEDGE THAT THE SOFTWARE IS NOT DESIGNED OR INTENDED TO SUPPORT ANY USE IN WHICH A SERVICE INTERRUPTION, DEFECT, ERROR, OR OTHER FAILURE OF THE SOFTWARE COULD RESULT IN THE DEATH OR SERIOUS BODILY INJURY OF ANY PERSON OR IN PHYSICAL OR ENVIRONMENTAL DAMAGE (COLLECTIVELY, “HIGH-RISK USE”), AND THAT YOU WILL ENSURE THAT, IN THE EVENT OF ANY INTERRUPTION, DEFECT, ERROR, OR OTHER FAILURE OF THE SOFTWARE, THE SAFETY OF PEOPLE, PROPERTY, AND THE ENVIRONMENT ARE NOT REDUCED BELOW A LEVEL THAT IS REASONABLY, APPROPRIATE, AND LEGAL, WHETHER IN GENERAL OR IN A SPECIFIC INDUSTRY. BY ACCESSING THE SOFTWARE, YOU FURTHER ACKNOWLEDGE THAT YOUR HIGH-RISK USE OF THE SOFTWARE IS AT YOUR OWN RISK.  
