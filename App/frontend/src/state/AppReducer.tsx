import { Action, AppState } from './AppProvider'
import { SidebarOptions } from '../components/SidebarView/SidebarView'

// Define the reducer function
export const appStateReducer = (state: AppState, action: Action): AppState => {
    switch (action.type) {
        case 'TOGGLE_CHAT_HISTORY':
            return { ...state, isChatHistoryOpen: !state.isChatHistoryOpen };
        case 'UPDATE_CURRENT_CHAT':
            return { ...state, currentChat: action.payload };
        case 'UPDATE_GRANTS_CHAT':
            return { ...state, grantsChat: action.payload };
        case 'UPDATE_ARTICLES_CHAT':
            return { ...state, articlesChat: action.payload };
        case 'UPDATE_CHAT_HISTORY_LOADING_STATE':
            return { ...state, chatHistoryLoadingState: action.payload };
        case 'UPDATE_CHAT_HISTORY':
            if (!state?.chatHistory || !state?.currentChat) { return state }

            let conversationIndex = state.chatHistory.findIndex(conv => conv.id === action.payload.id);
            if (conversationIndex !== -1) {
                let updatedChatHistory = [...state.chatHistory];
                updatedChatHistory[conversationIndex] = state.currentChat
                return {...state, chatHistory: updatedChatHistory}
            } else {
                return { ...state, chatHistory: [...state.chatHistory, action.payload] };
            }
        case 'UPDATE_CHAT_TITLE':
            if(!state.chatHistory){
                return { ...state, chatHistory: [] };
            }
            let updatedChats = state.chatHistory.map(chat => {
                if (chat.id === action.payload.id) {
                    if(state.currentChat?.id === action.payload.id){
                        state.currentChat.title = action.payload.title;
                    }
                    //TODO: make api call to save new title to DB
                    return { ...chat, title: action.payload.title };
                }
                return chat;
            });
            return { ...state, chatHistory: updatedChats };
        case 'DELETE_CHAT_ENTRY':
            if(!state.chatHistory){
                return { ...state, chatHistory: [] };
            }
            let filteredChat = state.chatHistory.filter(chat => chat.id !== action.payload);
            state.currentChat = null;
            //TODO: make api call to delete conversation from DB
            return { ...state, chatHistory: filteredChat };
        case 'DELETE_CHAT_HISTORY':
            //TODO: make api call to delete all conversations from DB
            return { ...state, chatHistory: [], filteredChatHistory: [], currentChat: null };
        case 'DELETE_CURRENT_CHAT_MESSAGES':
            //TODO: make api call to delete current conversation messages from DB
            if(!state.currentChat || !state.chatHistory){
                return state;
            }
            const updatedCurrentChat = {
                ...state.currentChat,
                messages: []
            };
            return {
                ...state,
                currentChat: updatedCurrentChat
            };
        case 'FETCH_CHAT_HISTORY':
            return { ...state, chatHistory: action.payload };
        case 'FETCH_FRONTEND_SETTINGS':
            return { ...state, frontendSettings: action.payload };
        case 'UPDATE_DRAFT_DOCUMENTS_SECTIONS':
            return { 
                ...state,
                documentSections: action.payload,
            };
        case 'UPDATE_RESEARCH_TOPIC':
            return { 
                ...state,
                researchTopic: action.payload,
            };
        case 'TOGGLE_FAVORITE_CITATION':
            const { id } = action.payload.citation;
            const isFavorited = state.favoritedCitations.some(citation => citation.id === id);
            if (!isFavorited) {
                return {
                    ...state,
                    favoritedCitations: [
                        ...state.favoritedCitations,
                        action.payload.citation // Extract the citation property
                    ]
                };
            } else {
                return {
                    ...state,
                    favoritedCitations: state.favoritedCitations.filter(citation => citation.id !== id)
                };
            }
        case 'TOGGLE_SIDEBAR':
            return { ...state, isSidebarExpanded: !state.isSidebarExpanded };
        case 'UPDATE_SIDEBAR_SELECTION':
            const showInitialChatMessage = state.sidebarSelection === null && state.researchTopic !== '' &&
                ((state.grantsChat === null && action.payload === SidebarOptions.Grant) ||
                (state.articlesChat === null && action.payload === SidebarOptions.Article))

            // set current chat to currentChat, grantsChat, or articlesChat
            var currentChat = state.currentChat;
            if (action.payload === SidebarOptions.Grant) {
                currentChat = state.grantsChat;
            } else if (action.payload === SidebarOptions.Article) {
                currentChat = state.articlesChat;
            }

            return { ...state, sidebarSelection: action.payload, showInitialChatMessage: showInitialChatMessage, currentChat: currentChat };
        case 'SET_SHOW_INITIAL_CHAT_MESSAGE_FLAG':
            return { ...state, showInitialChatMessage: action.payload };
        default:
            return state;
      }
};