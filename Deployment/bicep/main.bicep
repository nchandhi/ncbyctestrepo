// ========== main.bicep ========== //
targetScope = 'resourceGroup'

@minLength(3)
@maxLength(6)
@description('Prefix Name')
param solutionPrefix string

var resourceGroupLocation = resourceGroup().location
var resourceGroupName = resourceGroup().name
var subscriptionId  = subscription().subscriptionId

var solutionLocation = resourceGroupLocation
var baseUrl = 'https://raw.githubusercontent.com/nchandhi/ncbyoatestrepo/main/'

// ========== Managed Identity ========== //
module managedIdentityModule 'deploy_managed_identity.bicep' = {
  name: 'deploy_managed_identity'
  params: {
    solutionName: solutionPrefix
    solutionLocation: solutionLocation
  }
  scope: resourceGroup(resourceGroup().name)
}


// ========== Storage Account Module ========== //
module storageAccountModule 'deploy_storage_account.bicep' = {
  name: 'deploy_storage_account.bicep'
  params: {
    solutionName: solutionPrefix
    solutionLocation: solutionLocation
    managedIdentityObjectId:managedIdentityModule.outputs.managedIdentityOutput.objectId
  }
  scope: resourceGroup(resourceGroup().name)
}

// ========== Azure AI services multi-service account ========== //
module azAIMultiServiceAccount 'deploy_azure_ai_service.bicep' = {
  name: 'deploy_azure_ai_service'
  params: {
    solutionName: solutionPrefix
    solutionLocation: solutionLocation
  }
} 

// ========== Search service ========== //
module azSearchService 'deploy_ai_search_service.bicep' = {
  name: 'deploy_ai_search_service'
  params: {
    solutionName: solutionPrefix
    solutionLocation: solutionLocation
  }
} 

// ========== Azure OpenAI ========== //
module azOpenAI 'deploy_azure_open_ai.bicep' = {
  name: 'deploy_azure_open_ai'
  params: {
    solutionName: solutionPrefix
    solutionLocation: solutionLocation
  }
}

module uploadFiles 'deploy_upload_files_script.bicep' = {
  name : 'deploy_upload_files_script'
  params:{
    storageAccountName:storageAccountModule.outputs.storageAccountOutput.name
    solutionLocation: solutionLocation
    containerName:storageAccountModule.outputs.storageAccountOutput.dataContainer
    identity:managedIdentityModule.outputs.managedIdentityOutput.id
    storageAccountKey:storageAccountModule.outputs.storageAccountOutput.key
    baseUrl:baseUrl
  }
  dependsOn:[storageAccountModule]
}
// ========== Key Vault ========== //

module keyvaultModule 'deploy_keyvault.bicep' = {
  name: 'deploy_keyvault'
  params: {
    solutionName: solutionPrefix
    solutionLocation: solutionLocation
    objectId: managedIdentityModule.outputs.managedIdentityOutput.objectId
    tenantId: subscription().tenantId
    managedIdentityObjectId:managedIdentityModule.outputs.managedIdentityOutput.objectId
    adlsAccountName:storageAccountModule.outputs.storageAccountOutput.storageAccountName
    adlsAccountKey:storageAccountModule.outputs.storageAccountOutput.key
    azureOpenAIApiKey:azOpenAI.outputs.openAIOutput.openAPIKey
    azureOpenAIApiVersion:'2023-07-01-preview'
    azureOpenAIEndpoint:azOpenAI.outputs.openAIOutput.openAPIEndpoint
    azureSearchAdminKey:azSearchService.outputs.searchServiceOutput.searchServiceAdminKey
    azureSearchServiceEndpoint:azSearchService.outputs.searchServiceOutput.searchServiceEndpoint
    azureSearchServiceName:azSearchService.outputs.searchServiceOutput.searchServiceName
    azureSearchArticlesIndex:'articlesindex'
    azureSearchGrantsIndex:'grantsindex'
    azureSearchDraftsIndex:'draftsindex'
    cogServiceEndpoint:azAIMultiServiceAccount.outputs.cogSearchOutput.cogServiceEndpoint
    cogServiceName:azAIMultiServiceAccount.outputs.cogSearchOutput.cogServiceName
    cogServiceKey:azAIMultiServiceAccount.outputs.cogSearchOutput.cogServiceKey
    enableSoftDelete:false
  }
  scope: resourceGroup(resourceGroup().name)
  dependsOn:[storageAccountModule,azOpenAI,azAIMultiServiceAccount,azSearchService]
}

module createIndex 'deploy_index_python_scripts.bicep' = {
  name : 'deploy_index_python_scripts'
  params:{
    solutionLocation: solutionLocation
    identity:managedIdentityModule.outputs.managedIdentityOutput.id
    baseUrl:baseUrl
    keyVaultName:keyvaultModule.outputs.keyvaultOutput.name
  }
  dependsOn:[keyvaultModule]
}

module createAIHub 'deploy_ai_hub_python_scripts.bicep' = {
  name : 'deploy_ai_hub_python_scripts'
  params:{
    baseUrl:baseUrl
    solutionLocation: solutionLocation
    subscriptionId:subscriptionId
    solutionName: solutionPrefix
    identity:managedIdentityModule.outputs.managedIdentityOutput.id
    keyVaultName:keyvaultModule.outputs.keyvaultOutput.name
    resourceGroupName:resourceGroupName
  }
  dependsOn:[keyvaultModule]
}
