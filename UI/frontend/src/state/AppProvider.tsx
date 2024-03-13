import React, { createContext, useReducer, ReactNode, useEffect } from 'react';
import { appStateReducer } from './AppReducer';
import { Conversation, ChatHistoryLoadingState, CosmosDBHealth, CosmosDBStatus, frontendSettings, FrontendSettings, DocumentSection, Citation } from '../api';
import documentSectionData from '../../document-sections.json';
import { SidebarOptions } from '../components/SidebarView/SidebarView';

export interface AppState {
    isChatHistoryOpen: boolean;
    chatHistoryLoadingState: ChatHistoryLoadingState;
    isCosmosDBAvailable: CosmosDBHealth;
    chatHistory: Conversation[] | null;
    filteredChatHistory: Conversation[] | null;
    currentChat: Conversation | null;
    articlesChat: Conversation | null;
    grantsChat: Conversation | null;
    frontendSettings: FrontendSettings | null;
    documentSections: DocumentSection[] | null;
    researchTopic: string;
    favoritedCitations: Citation[];
    isSidebarExpanded: boolean;
    isChatViewOpen: boolean;
    sidebarSelection: SidebarOptions | null;
    showInitialChatMessage: boolean;
}

export type Action =
    | { type: 'TOGGLE_CHAT_HISTORY' }
    | { type: 'SET_COSMOSDB_STATUS', payload: CosmosDBHealth }
    | { type: 'UPDATE_CHAT_HISTORY_LOADING_STATE', payload: ChatHistoryLoadingState }
    | { type: 'UPDATE_CURRENT_CHAT', payload: Conversation | null }
    | { type: 'UPDATE_GRANTS_CHAT', payload: Conversation | null }
    | { type: 'UPDATE_ARTICLES_CHAT', payload: Conversation | null }
    | { type: 'UPDATE_FILTERED_CHAT_HISTORY', payload: Conversation[] | null }
    | { type: 'UPDATE_CHAT_HISTORY', payload: Conversation } // API Call
    | { type: 'UPDATE_CHAT_TITLE', payload: Conversation } // API Call
    | { type: 'DELETE_CHAT_ENTRY', payload: string } // API Call
    | { type: 'DELETE_CHAT_HISTORY' } // API Call
    | { type: 'DELETE_CURRENT_CHAT_MESSAGES', payload: string }  // API Call
    | { type: 'FETCH_CHAT_HISTORY', payload: Conversation[] | null }  // API Call
    | { type: 'FETCH_FRONTEND_SETTINGS', payload: FrontendSettings | null }  // API Call
    | { type: 'UPDATE_DRAFT_DOCUMENTS_SECTIONS', payload: DocumentSection[] | null }
    | { type: 'UPDATE_RESEARCH_TOPIC', payload: string }
    | { type: 'TOGGLE_FAVORITE_CITATION', payload: { citation: Citation } }
    | { type: 'TOGGLE_SIDEBAR' }
    | { type: 'UPDATE_SIDEBAR_SELECTION', payload: SidebarOptions | null }
    | { type: 'TOGGLE_CHAT_VIEW' }
    | { type: 'SET_SHOW_INITIAL_CHAT_MESSAGE_FLAG', payload: boolean }

const initialState: AppState = {
    isChatHistoryOpen: false,
    chatHistoryLoadingState: ChatHistoryLoadingState.Success,
    chatHistory: null,
    filteredChatHistory: null,
    currentChat: null,
    articlesChat: null,
    grantsChat: null,
    isCosmosDBAvailable: {
        cosmosDB: false,
        status: CosmosDBStatus.NotConfigured,
    },
    frontendSettings: null,
    documentSections: JSON.parse(JSON.stringify(documentSectionData)),
    researchTopic: "",
    favoritedCitations: [],
    isSidebarExpanded: false,
    isChatViewOpen: true,
    sidebarSelection: null,
    showInitialChatMessage: true,
};

export const AppStateContext = createContext<{
    state: AppState;
    dispatch: React.Dispatch<Action>;
  } | undefined>(undefined);

type AppStateProviderProps = {
    children: ReactNode;
  };
  
  export const AppStateProvider: React.FC<AppStateProviderProps> = ({ children }) => {
    const [state, dispatch] = useReducer(appStateReducer, initialState);

    // useEffect(() => {
    //     // Function to toggle the favorite status of a citation
    //     const toggleFavoriteCitation = (citationId: string) => {
    //         dispatch({ type: 'TOGGLE_FAVORITE_CITATION', payload: { citationId } });
    //     };
    //     // Check for cosmosdb config and fetch initial data here
    //     const fetchChatHistory = async (offset=0): Promise<Conversation[] | null> => {
    //         const result = await historyList(offset).then((response) => {
    //             if(response){
    //                 dispatch({ type: 'FETCH_CHAT_HISTORY', payload: response});
    //             }else{
    //                 dispatch({ type: 'FETCH_CHAT_HISTORY', payload: null });
    //             }
    //             return response
    //         })
    //         .catch((err) => {
    //             dispatch({ type: 'UPDATE_CHAT_HISTORY_LOADING_STATE', payload: ChatHistoryLoadingState.Fail });
    //             dispatch({ type: 'FETCH_CHAT_HISTORY', payload: null });
    //             console.error("There was an issue fetching your data.");
    //             return null
    //         })
    //         return result
    //     };

    //     const getHistoryEnsure = async () => {
    //         dispatch({ type: 'UPDATE_CHAT_HISTORY_LOADING_STATE', payload: ChatHistoryLoadingState.Loading });
    //         historyEnsure().then((response) => {
    //             if(response?.cosmosDB){
    //                 fetchChatHistory()
    //                 .then((res) => {
    //                     if(res){
    //                         dispatch({ type: 'UPDATE_CHAT_HISTORY_LOADING_STATE', payload: ChatHistoryLoadingState.Success });
    //                         dispatch({ type: 'SET_COSMOSDB_STATUS', payload: response });
    //                     }else{
    //                         dispatch({ type: 'UPDATE_CHAT_HISTORY_LOADING_STATE', payload: ChatHistoryLoadingState.Fail });
    //                         dispatch({ type: 'SET_COSMOSDB_STATUS', payload: {cosmosDB: false, status: CosmosDBStatus.NotWorking} });
    //                     }
    //                 })
    //                 .catch((err) => {
    //                     dispatch({ type: 'UPDATE_CHAT_HISTORY_LOADING_STATE', payload: ChatHistoryLoadingState.Fail });
    //                     dispatch({ type: 'SET_COSMOSDB_STATUS', payload: {cosmosDB: false, status: CosmosDBStatus.NotWorking} });
    //                 })
    //             }else{
    //                 dispatch({ type: 'UPDATE_CHAT_HISTORY_LOADING_STATE', payload: ChatHistoryLoadingState.Fail });
    //                 dispatch({ type: 'SET_COSMOSDB_STATUS', payload: response });
    //             }
    //         })
    //         .catch((err) => {
    //             dispatch({ type: 'UPDATE_CHAT_HISTORY_LOADING_STATE', payload: ChatHistoryLoadingState.Fail });
    //             dispatch({ type: 'SET_COSMOSDB_STATUS', payload: {cosmosDB: false, status: CosmosDBStatus.NotConfigured} });
    //         })
    //     }
    //     getHistoryEnsure();
    // }, []);

    useEffect(() => {
        const getFrontendSettings = async () => {
            frontendSettings().then((response) => {
                dispatch({ type: 'FETCH_FRONTEND_SETTINGS', payload: response as FrontendSettings });
            })
            .catch((err) => {
                console.error("There was an issue fetching your data: ");
            })
        }
        getFrontendSettings();
    }, []);
  
    return (
      <AppStateContext.Provider value={{ state, dispatch }}>
        {children}
      </AppStateContext.Provider>
    );
  };


